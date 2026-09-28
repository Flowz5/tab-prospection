import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, Edit2, Trash2, AlertCircle, Building2, MapPin, Calendar, Clock, Contact2, HelpCircle, Download, FileText, Link as LinkIcon, Search, Filter, Tag } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard({ user }) {
  const [applications, setApplications] = useState([]);
  const [toContact, setToContact] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tous');

  const [formData, setFormData] = useState({
    entreprise: '',
    localisation: '',
    statut: 'Envoyé',
    contactType: 'Candidature spontanée',
    dateEnvoi: '',
    relance: '',
    relance2: '',
    relance3: '',
    type: 'candidature', // 'candidature' ou 'acontacter'
    url: '',
    notes: '',
    tagsInput: '' // temporary field for typing tags
  });
  
  // Array to hold tags since Firestore handles arrays well
  const [tags, setTags] = useState([]);
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
                             .sort((a, b) => (a.localisation || '').localeCompare(b.localisation || ''));
      setToContact(aContacter);
    });
    return () => unsubscribe();
  }, [user]);

  // Handle tags insertion (comma separated or enter key)
  const handleTagInput = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = formData.tagsInput.trim().replace(',', '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setFormData({ ...formData, tagsInput: '' });
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // save the form data (handles both new and edits)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        tags: tags,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      };
      delete dataToSave.tagsInput; // don't save the temporary input

      if (isEditing) {
        await updateDoc(doc(db, 'applications', isEditing), dataToSave);
      } else {
        dataToSave.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'applications'), dataToSave);
      }
      resetForm();
    } catch (error) {
      console.error("Erreur d'ajout/modification", error);
    }
  };

  const resetForm = () => {
    setFormData({ entreprise: '', localisation: '', statut: 'Envoyé', contactType: 'Candidature spontanée', dateEnvoi: '', relance: '', relance2: '', relance3: '', type: 'candidature', url: '', notes: '', tagsInput: '' });
    setTags([]);
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
      type: app.type || 'candidature',
      url: app.url || '',
      notes: app.notes || '',
      tagsInput: ''
    });
    setTags(app.tags || []);
    setIsEditing(app.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // check if we forgot to follow up (limit is 10 days bro)
  const isLate = (dateEnvoi, relance, relance2, relance3, statut) => {
    if (!dateEnvoi || statut === 'Refusé' || statut === 'Accepté') return false;
    let lastDate = dateEnvoi;
    if (relance3) lastDate = relance3;
    else if (relance2) lastDate = relance2;
    else if (relance) lastDate = relance;

    const days = differenceInDays(new Date(), parseISO(lastDate));
    return days > 10;
  };

  const getStatusStyle = (statut) => {
    switch (statut) {
      case 'Envoyé': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'En attente': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'Entretien': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'Refusé': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case 'Accepté': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  // filter logic
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = app.entreprise.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (app.localisation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (app.tags && app.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesStatus = filterStatus === 'Tous' || app.statut === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, filterStatus]);

  const filteredToContact = useMemo(() => {
    return toContact.filter(app => {
      return app.entreprise.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (app.localisation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (app.tags && app.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
    });
  }, [toContact, searchTerm]);

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Entreprise', 'Localisation', 'Statut', 'Contact', 'Date Envoi', 'Relance 1', 'Relance 2', 'Relance 3', 'Tags', 'URL', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...applications.map(app => 
        [
          `"${app.entreprise}"`,
          `"${app.localisation || ''}"`,
          `"${app.statut}"`,
          `"${app.contactType}"`,
          `"${app.dateEnvoi}"`,
          `"${app.relance || ''}"`,
          `"${app.relance2 || ''}"`,
          `"${app.relance3 || ''}"`,
          `"${(app.tags || []).join('; ')}"`,
          `"${app.url || ''}"`,
          `"${(app.notes || '').replace(/\n/g, ' ')}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `candidatures_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Tableau de Suivi des Candidatures", 14, 15);
    
    const tableColumn = ["Entreprise", "Lieu", "Statut", "Envoi", "Dernière Relance"];
    const tableRows = [];

    applications.forEach(app => {
      const derniere = app.relance3 ? `R3: ${app.relance3}` : (app.relance2 ? `R2: ${app.relance2}` : (app.relance ? `R1: ${app.relance}` : '-'));
      tableRows.push([app.entreprise, app.localisation, app.statut, app.dateEnvoi, derniere]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`candidatures_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Tableau de bord</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Export Buttons */}
          <button onClick={exportCSV} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-colors">
            <FileText size={18} /> CSV
          </button>
          <button onClick={exportPDF} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-colors">
            <Download size={18} /> PDF
          </button>
          {/* New App Button */}
          <button 
            onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-medium shadow-sm hover:shadow transition-all flex items-center gap-2 w-full lg:w-auto justify-center"
          >
            {isFormOpen ? <AlertCircle size={18} /> : <Plus size={18} />}
            {isFormOpen ? 'Fermer' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Formulaire Modal/Slide-down */}
      {isFormOpen && (
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 mb-10 transform transition-all">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <Building2 className="text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{isEditing ? 'Modifier l\'opportunité' : 'Nouvelle opportunité'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Base info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Building2 size={16}/> Entreprise</label>
                <input type="text" required className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none" placeholder="Nom de l'entreprise" value={formData.entreprise} onChange={e => setFormData({...formData, entreprise: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><MapPin size={16}/> Localisation</label>
                <input type="text" required className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none" placeholder="Ville, Pays ou Télétravail" value={formData.localisation} onChange={e => setFormData({...formData, localisation: e.target.value})} />
              </div>
            </div>

            {/* URL and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><LinkIcon size={16}/> Lien de l'offre (optionnel)</label>
                <input type="url" className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none" placeholder="https://..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Tag size={16}/> Tags (Entrée pour ajouter)</label>
                <div className="border border-slate-200 dark:border-slate-600 p-2 rounded-xl bg-slate-50 dark:bg-slate-700 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-indigo-500">
                  {tags.map(tag => (
                    <span key={tag} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                      {tag} <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-500">&times;</button>
                    </span>
                  ))}
                  <input type="text" className="flex-1 bg-transparent min-w-[120px] outline-none text-sm dark:text-white" placeholder="Ajouter un tag..." value={formData.tagsInput} onChange={e => setFormData({...formData, tagsInput: e.target.value})} onKeyDown={handleTagInput} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><HelpCircle size={16}/> Type d'opportunité</label>
                <select className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="candidature">Candidature envoyée/en cours</option>
                  <option value="acontacter">À contacter (Prospection)</option>
                </select>
              </div>
              
              {formData.type === 'candidature' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Contact2 size={16}/> Moyen de contact</label>
                  <select className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none" value={formData.contactType} onChange={e => setFormData({...formData, contactType: e.target.value})}>
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
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Statut actuel</label>
                    <select className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none font-medium" value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}>
                      <option value="Envoyé">Envoyé</option>
                      <option value="En attente">En attente (Lu)</option>
                      <option value="Entretien">Entretien</option>
                      <option value="Accepté">Accepté 🎉</option>
                      <option value="Refusé">Refusé</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Calendar size={16}/> Date d'envoi</label>
                    <input type="date" required className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none" value={formData.dateEnvoi} onChange={e => setFormData({...formData, dateEnvoi: e.target.value})} />
                  </div>
                </div>

                {/* Relances */}
                <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                  <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2"><Clock size={16}/> Suivi et Relances</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Relance 1</label>
                      <input type="date" className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:text-white outline-none" value={formData.relance} onChange={e => setFormData({...formData, relance: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Relance 2</label>
                      <input type="date" className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:text-white outline-none disabled:opacity-50" value={formData.relance2} onChange={e => setFormData({...formData, relance2: e.target.value})} disabled={!formData.relance} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Relance 3</label>
                      <input type="date" className="w-full border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:text-white outline-none disabled:opacity-50" value={formData.relance3} onChange={e => setFormData({...formData, relance3: e.target.value})} disabled={!formData.relance2} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><FileText size={16}/> Notes persos</label>
              <textarea 
                className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none min-h-[100px]" 
                placeholder="Ex: Le recruteur s'appelle Marc, super boîte mais budget serré..." 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={resetForm} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                Annuler
              </button>
              <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-all">
                {isEditing ? 'Enregistrer les modifications' : 'Créer la fiche'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Table Area */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            Mes Candidatures <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm py-1 px-3 rounded-full">{filteredApps.length}</span>
          </h2>
          {/* Quick Filter */}
          <div className="flex items-center gap-2 text-sm">
            <Filter size={16} className="text-slate-400" />
            <select 
              className="bg-transparent border border-slate-200 dark:border-slate-700 dark:text-white rounded-lg p-1 outline-none"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Envoyé">Envoyé</option>
              <option value="En attente">En attente</option>
              <option value="Entretien">Entretien</option>
              <option value="Refusé">Refusé</option>
              <option value="Accepté">Accepté</option>
            </select>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entreprise</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Localisation</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Envoi</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dernière Relance</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredApps.map((app) => {
                  const late = isLate(app.dateEnvoi, app.relance, app.relance2, app.relance3, app.statut);
                  const derniereRelance = app.relance3 ? `R3: ${app.relance3}` : (app.relance2 ? `R2: ${app.relance2}` : (app.relance ? `R1: ${app.relance}` : '-'));

                  return (
                    <tr key={app.id} className={`group transition-colors ${late ? 'bg-rose-50/50 dark:bg-rose-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {late && <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 mt-1" title="Relance conseillée !"><AlertCircle size={18} /></div>}
                          {!late && <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-1"><Building2 size={16} /></div>}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-white">{app.entreprise}</p>
                              {app.url && (
                                <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-500" title="Voir l'offre">
                                  <LinkIcon size={14} />
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{app.contactType}</p>
                            {app.tags && app.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {app.tags.map(t => (
                                  <span key={t} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-medium">
                        {app.localisation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${getStatusStyle(app.statut)}`}>
                          {app.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        {app.dateEnvoi}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
                        {derniereRelance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {app.notes && (
                            <button className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg" title={app.notes}>
                              <FileText size={18} />
                            </button>
                          )}
                          <button onClick={() => editApp(app)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(app.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center text-slate-400 dark:text-slate-500">
                        <Building2 size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Aucune candidature trouvée</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pipeline Area */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-3">
          À Contacter <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm py-1 px-3 rounded-full">{filteredToContact.length}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredToContact.map(app => (
            <div key={app.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between group transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                  {app.url && (
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-700 p-2 rounded-lg">
                      <LinkIcon size={16} />
                    </a>
                  )}
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{app.entreprise}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1"><MapPin size={14}/> {app.localisation}</p>
                {app.tags && app.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {app.tags.map(t => (
                      <span key={t} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-4">
                <button 
                  onClick={() => {
                    setFormData({...app, type: 'candidature', dateEnvoi: new Date().toISOString().split('T')[0]});
                    setIsEditing(app.id);
                    setIsFormOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Postuler
                </button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {app.notes && (
                    <button className="text-slate-400 hover:text-amber-500 p-1.5" title={app.notes}><FileText size={16} /></button>
                  )}
                  <button onClick={() => editApp(app)} className="text-slate-400 hover:text-indigo-500 p-1.5"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(app.id)} className="text-slate-400 hover:text-rose-500 p-1.5"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
          {filteredToContact.length === 0 && (
             <div className="col-span-full bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center">
               <p className="text-slate-500 dark:text-slate-400 font-medium">Rien à afficher.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
