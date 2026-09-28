import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { Users, Search, Building2, MapPin, Users as UsersIcon, Plus, AlertCircle, FileText, Trash2 } from 'lucide-react';

export default function BonsPlans({ user }) {
  const [messages, setMessages] = useState([]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    entreprise: '',
    lieu: '',
    postes: '1',
    description: ''
  });

  // fetch all messages, order by newest
  useEffect(() => {
    const q = query(collection(db, 'bonsplans'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    });
    return () => unsubscribe();
  }, []);

  // filter messages based on search
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      const search = searchTerm.toLowerCase();
      // handle old chat messages
      if (msg.text && !msg.entreprise) {
        return msg.text.toLowerCase().includes(search);
      }
      // handle new structured messages
      return (
        (msg.entreprise || '').toLowerCase().includes(search) ||
        (msg.lieu || '').toLowerCase().includes(search) ||
        (msg.description || '').toLowerCase().includes(search)
      );
    });
  }, [messages, searchTerm]);

  // send a new structured post to the squad
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'bonsplans'), {
        entreprise: formData.entreprise,
        lieu: formData.lieu,
        postes: formData.postes,
        description: formData.description,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp()
      });
      setFormData({ entreprise: '', lieu: '', postes: '1', description: '' });
      setIsFormOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout", error);
    }
  };

  // delete a post if you're the owner
  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce bon plan ?')) {
      try {
        await deleteDoc(doc(db, 'bonsplans', id));
      } catch (error) {
        console.error("Erreur lors de la suppression", error);
        window.alert("Erreur de suppression (permissions Firebase). Vérifie tes règles Firestore !");
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Bons Plans</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Chercher une entreprise, ville..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {isFormOpen ? <AlertCircle size={18} /> : <Plus size={18} />}
            {isFormOpen ? 'Annuler' : 'Partager'}
          </button>
        </div>
      </div>

      {/* Formulaire de partage */}
      {isFormOpen && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Partager une opportunité</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Entreprise</label>
                <input 
                  type="text" required
                  placeholder="Ex: Ubisoft"
                  className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.entreprise} onChange={e => setFormData({...formData, entreprise: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lieu</label>
                <input 
                  type="text" required
                  placeholder="Ex: Paris (ou Remote)"
                  className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.lieu} onChange={e => setFormData({...formData, lieu: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre de postes</label>
                <select 
                  className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.postes} onChange={e => setFormData({...formData, postes: e.target.value})}
                >
                  <option value="1">1 poste</option>
                  <option value="2-5">2 à 5 postes</option>
                  <option value="5+">Plus de 5 postes</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description ou lien de l'offre</label>
              <textarea 
                required
                placeholder="Détaille un peu (profil recherché, techno, lien vers l'annonce...)"
                className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                Publier le bon plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed des bons plans */}
      <div className="space-y-4">
        {filteredMessages.map(msg => {
          const isOldMessage = msg.text && !msg.entreprise;
          
          return (
            <div key={msg.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 transition-colors hover:shadow-md">
              
              {/* Avatar section */}
              <div className="flex-shrink-0 flex sm:flex-col items-center gap-3 sm:gap-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold uppercase">
                  {msg.userEmail ? msg.userEmail[0] : '?'}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                   {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : 'Maintenant'}
                </div>
              </div>

              {/* Content section */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                      {msg.userId === user.uid ? 'Moi' : msg.userEmail?.split('@')[0]}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                      Membre
                    </span>
                  </div>
                  {msg.userId === user.uid && (
                    <button 
                      onClick={() => handleDelete(msg.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {isOldMessage ? (
                  <p className="text-slate-800 dark:text-slate-200 mt-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    {msg.text}
                  </p>
                ) : (
                  <div className="mt-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                      <Building2 size={18} className="text-blue-500" />
                      {msg.entreprise}
                    </h3>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="flex items-center gap-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full font-medium">
                        <MapPin size={14} /> {msg.lieu}
                      </span>
                      <span className="flex items-center gap-1 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full font-medium">
                        <UsersIcon size={14} /> {msg.postes} poste(s)
                      </span>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-sm">
                      <p className="flex items-start gap-2">
                        <FileText size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>{msg.description}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {filteredMessages.length === 0 && (
          <div className="text-center bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun bon plan trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}
