import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';

export default function Dashboard({ user }) {
  const [applications, setApplications] = useState([]);
  const [toContact, setToContact] = useState([]);
  const [formData, setFormData] = useState({
    entreprise: '',
    localisation: '',
    statut: 'Envoyé',
    contactType: 'Candidature spontanée',
    dateEnvoi: '',
    relance: '',
    type: 'candidature' // 'candidature' ou 'acontacter'
  });
  const [isEditing, setIsEditing] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'applications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(data.filter(app => app.type === 'candidature'));
      // Trier les "À contacter" par ville
      const aContacter = data.filter(app => app.type === 'acontacter')
                             .sort((a, b) => a.localisation.localeCompare(b.localisation));
      setToContact(aContacter);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'applications', isEditing), formData);
        setIsEditing(null);
      } else {
        await addDoc(collection(db, 'applications'), {
          ...formData,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      setFormData({ entreprise: '', localisation: '', statut: 'Envoyé', contactType: 'Candidature spontanée', dateEnvoi: '', relance: '', type: 'candidature' });
    } catch (error) {
      console.error("Erreur d'ajout/modification", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette entrée ?")) {
      await deleteDoc(doc(db, 'applications', id));
    }
  };

  const editApp = (app) => {
    setFormData(app);
    setIsEditing(app.id);
  };

  const isLate = (dateEnvoi, relance) => {
    if (!dateEnvoi || relance) return false;
    const days = differenceInDays(new Date(), parseISO(dateEnvoi));
    return days > 10;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de Bord Personnel</h1>

      {/* Formulaire */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Modifier' : 'Ajouter'} une entreprise</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input type="text" placeholder="Entreprise" required className="border p-2 rounded focus:ring-blue-500" value={formData.entreprise} onChange={e => setFormData({...formData, entreprise: e.target.value})} />
          <input type="text" placeholder="Localisation" required className="border p-2 rounded focus:ring-blue-500" value={formData.localisation} onChange={e => setFormData({...formData, localisation: e.target.value})} />
          
          <select className="border p-2 rounded focus:ring-blue-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="candidature">Candidature envoyée/en cours</option>
            <option value="acontacter">À contacter</option>
          </select>

          {formData.type === 'candidature' && (
            <>
              <select className="border p-2 rounded focus:ring-blue-500" value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}>
                <option value="Envoyé">Envoyé</option>
                <option value="En attente">En attente</option>
                <option value="Entretien">Entretien</option>
                <option value="Refusé">Refusé</option>
              </select>
              
              <select className="border p-2 rounded focus:ring-blue-500" value={formData.contactType} onChange={e => setFormData({...formData, contactType: e.target.value})}>
                <option value="Candidature spontanée">Candidature spontanée</option>
                <option value="Piston">Piston</option>
                <option value="Maître de stage">Maître de stage</option>
              </select>

              <input type="date" className="border p-2 rounded focus:ring-blue-500" value={formData.dateEnvoi} onChange={e => setFormData({...formData, dateEnvoi: e.target.value})} title="Date d'envoi" />
              <input type="date" className="border p-2 rounded focus:ring-blue-500" value={formData.relance} onChange={e => setFormData({...formData, relance: e.target.value})} title="Date de relance" />
            </>
          )}

          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2 lg:col-span-4">
            {isEditing ? <Edit2 size={18} /> : <Plus size={18} />}
            {isEditing ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </form>
      </div>

      {/* Tableau des candidatures */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Mes Candidatures</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-12">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localisation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Envoi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Relance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => {
                const late = isLate(app.dateEnvoi, app.relance);
                return (
                  <tr key={app.id} className={late ? 'bg-red-50 hover:bg-red-100 transition-colors' : 'hover:bg-gray-50 transition-colors'}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-2">
                      {late && <AlertCircle className="text-red-500 h-5 w-5" title="Relance à faire !" />}
                      {app.entreprise}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{app.localisation}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${app.statut === 'Envoyé' ? 'bg-blue-100 text-blue-800' : ''}
                        ${app.statut === 'En attente' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${app.statut === 'Entretien' ? 'bg-green-100 text-green-800' : ''}
                        ${app.statut === 'Refusé' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {app.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.contactType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.dateEnvoi}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.relance || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => editApp(app)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(app.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {applications.length === 0 && (
                <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">Aucune candidature pour le moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section À Contacter */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">À Contacter (Trié par ville)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toContact.map(app => (
          <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{app.entreprise}</h3>
              <p className="text-gray-600">{app.localisation}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => editApp(app)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(app.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {toContact.length === 0 && <p className="text-gray-500 col-span-full">Aucune entreprise à contacter.</p>}
      </div>
    </div>
  );
}
