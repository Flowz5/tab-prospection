import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, Edit2, Trash2, AlertCircle, Building2, MapPin, Calendar, Clock, Contact2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

export default function Dashboard({ user }) {
  const [applications, setApplications] = useState([]);
  const [toContact, setToContact] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    entreprise: '',
    localisation: '',
    statut: 'Envoyé',
    contactType: 'Candidature spontanée',
    dateEnvoi: '',
    relance: '',
    relance2: '',
    relance3: '',
    type: 'candidature' // 'candidature' ou 'acontacter'
  });
  const [isEditing, setIsEditing] = useState(null);

  // fetch all apps from firebase and listen to real-time updates
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'applications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(data.filter(app => app.type === 'candidature').sort((a,b) => new Date(b.dateEnvoi) - new Date(a.dateEnvoi)));
      
      // group the "to contact" folks by city
      const aContacter = data.filter(app => app.type === 'acontacter')
                             .sort((a, b) => a.localisation.localeCompare(b.localisation));
      setToContact(aContacter);
    });
    return () => unsubscribe();
  }, [user]);

  // save the form data (handles both new and edits)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'applications', isEditing), formData);
      } else {
        await addDoc(collection(db, 'applications'), {
          ...formData,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      resetForm();
    } catch (error) {
      console.error("Erreur d'ajout/modification", error);
    }
  };

  const resetForm = () => {
    setFormData({ entreprise: '', localisation: '', statut: 'Envoyé', contactType: 'Candidature spontanée', dateEnvoi: '', relance: '', relance2: '', relance3: '', type: 'candidature' });
    setIsEditing(null);
    setIsFormOpen(false);
  }

  const handleDelete = async (id) => {
    if (window.confirm("Tu veux vraiment tej ça ?")) {
      await deleteDoc(doc(db, 'applications', id));
    }
  };

  const editApp = (app) => {
    setFormData({
      entreprise: app.entreprise || '',
      localisation: app.localisation || '',
      statut: app.statut || 'Envoyé',
      contactType: app.contactType || 'Candidature spontanée',
      dateEnvoi: app.dateEnvoi || '',
      relance: app.relance || '',
      relance2: app.relance2 || '',
      relance3: app.relance3 || '',
      type: app.type || 'candidature'
    });
    setIsEditing(app.id);
    setIsFormOpen(true);
  };

  // check if we forgot to follow up (limit is 10 days bro)
  const isLate = (dateEnvoi, relance, relance2, relance3, statut) => {
    if (!dateEnvoi || statut === 'Refusé' || statut === 'Accepté') return false;
    
    // figure out the last time we talked to them
    let lastDate = dateEnvoi;
    if (relance3) lastDate = relance3;
    else if (relance2) lastDate = relance2;
    else if (relance) lastDate = relance;

    const days = differenceInDays(new Date(), parseISO(lastDate));
    return days > 10;
  };

  const getStatusStyle = (statut) => {
    switch (statut) {
      case 'Envoyé': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'En attente': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Entretien': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Refusé': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Accepté': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Tableau de bord</h1>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
        >
          {isFormOpen ? <XCircle size={18} /> : <Plus size={18} />}
          {isFormOpen ? 'Fermer' : 'Nouvelle opportunité'}
        </button>
      </div>

      {/* Formulaire Modal/Slide-down */}
      {isFormOpen && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 mb-10 transform transition-all">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <Building2 className="text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Modifier l\'opportunité' : 'Ajouter une opportunité'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Building2 size={16}/> Entreprise</label>
                <input type="text" required className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-slate-50 focus:bg-white" placeholder="Nom de l'entreprise" value={formData.entreprise} onChange={e => setFormData({...formData, entreprise: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><MapPin size={16}/> Localisation</label>
                <input type="text" required className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-slate-50 focus:bg-white" placeholder="Ville, Pays ou Télétravail" value={formData.localisation} onChange={e => setFormData({...formData, localisation: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><HelpCircle size={16}/> Type d'opportunité</label>
                <select className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow bg-slate-50 focus:bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="candidature">Candidature envoyée/en cours</option>
                  <option value="acontacter">À contacter (Prospection)</option>
                </select>
              </div>
              
              {formData.type === 'candidature' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Contact2 size={16}/> Moyen de contact</label>
                  <select className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow bg-slate-50 focus:bg-white" value={formData.contactType} onChange={e => setFormData({...formData, contactType: e.target.value})}>
                    <option value="Candidature spontanée">Candidature spontanée</option>
                    <option value="Offre en ligne">Offre en ligne</option>
                    <option value="Piston">Piston / Réseau</option>
                    <option value="Maître de stage">Maître de stage</option>
                  </select>
                </div>
              )}
            </div>

            {formData.type === 'candidature' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-sm font-semibold text-slate-700">Statut actuel</label>
                    <select className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow bg-slate-50 focus:bg-white font-medium" value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}>
                      <option value="Envoyé">Envoyé</option>
                      <option value="En attente">En attente (Lu)</option>
                      <option value="Entretien">Entretien</option>
                      <option value="Accepté">Accepté 🎉</option>
                      <option value="Refusé">Refusé</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Calendar size={16}/> Date d'envoi</label>
                    <input type="date" required className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow bg-slate-50 focus:bg-white" value={formData.dateEnvoi} onChange={e => setFormData({...formData, dateEnvoi: e.target.value})} />
                  </div>
                </div>

                {/* Relances */}
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-4 flex items-center gap-2"><Clock size={16}/> Suivi et Relances</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">Relance 1</label>
                      <input type="date" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-shadow bg-white" value={formData.relance} onChange={e => setFormData({...formData, relance: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">Relance 2</label>
                      <input type="date" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-shadow bg-white" value={formData.relance2} onChange={e => setFormData({...formData, relance2: e.target.value})} disabled={!formData.relance} title={!formData.relance ? "Remplissez d'abord la relance 1" : ""} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">Relance 3</label>
                      <input type="date" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-shadow bg-white" value={formData.relance3} onChange={e => setFormData({...formData, relance3: e.target.value})} disabled={!formData.relance2} />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={resetForm} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                Annuler
              </button>
              <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all">
                {isEditing ? 'Enregistrer les modifications' : 'Créer la fiche'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau des candidatures */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
          Mes Candidatures <span className="bg-indigo-100 text-indigo-700 text-sm py-1 px-3 rounded-full">{applications.length}</span>
        </h2>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Entreprise</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Localisation</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Envoi</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Dernière Relance</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => {
                  const late = isLate(app.dateEnvoi, app.relance, app.relance2, app.relance3, app.statut);
                  
                  // Déterminer la dernière relance effectuée pour l'affichage concis
                  const derniereRelance = app.relance3 ? `R3: ${app.relance3}` : (app.relance2 ? `R2: ${app.relance2}` : (app.relance ? `R1: ${app.relance}` : '-'));

                  return (
                    <tr key={app.id} className={`group transition-colors ${late ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {late && <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-600" title="Relance conseillée !"><AlertCircle size={18} /></div>}
                          {!late && <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors"><Building2 size={16} /></div>}
                          <div>
                            <p className="font-bold text-slate-900">{app.entreprise}</p>
                            <p className="text-xs text-slate-500">{app.contactType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {app.localisation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${getStatusStyle(app.statut)}`}>
                          {app.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {app.dateEnvoi}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                        {derniereRelance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => editApp(app)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(app.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center text-slate-400">
                        <Building2 size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-slate-500">Aucune candidature pour le moment</p>
                        <p className="text-sm">Commencez par ajouter votre première opportunité.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section À Contacter */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
          À Contacter <span className="bg-amber-100 text-amber-700 text-sm py-1 px-3 rounded-full">{toContact.length}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {toContact.map(app => (
            <div key={app.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200 p-6 flex flex-col justify-between group transition-all">
              <div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                  <Building2 size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{app.entreprise}</h3>
                <p className="text-slate-500 text-sm flex items-center gap-1"><MapPin size={14}/> {app.localisation}</p>
              </div>
              <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
                <button 
                  onClick={() => {
                    // convert to sent application
                    setFormData({...app, type: 'candidature', dateEnvoi: new Date().toISOString().split('T')[0]});
                    setIsEditing(app.id);
                    setIsFormOpen(true);
                  }} 
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Postuler
                </button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => editApp(app)} className="text-slate-400 hover:text-indigo-600 p-1.5"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(app.id)} className="text-slate-400 hover:text-rose-600 p-1.5"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
          {toContact.length === 0 && (
             <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
               <p className="text-slate-500 font-medium">Rien à contacter pour l'instant.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
