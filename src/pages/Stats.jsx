import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PieChart, TrendingUp, CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';

// Composant pour dessiner un cercle de progression
const CircularProgress = ({ percentage, color, label, sublabel, icon: Icon }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="relative flex items-center justify-center mb-4">
        {/* Cercle de fond */}
        <svg className="transform -rotate-90 w-40 h-40">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-100"
          />
          {/* Cercle de progression */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-slate-700">
          <Icon size={24} className={`mb-1 ${color.replace('text-', 'text-').replace('-500', '-600')}`} />
          <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
        </div>
      </div>
      <h3 className="font-bold text-slate-800 text-center">{label}</h3>
      <p className="text-sm text-slate-500 text-center mt-1">{sublabel}</p>
    </div>
  );
};

export default function Stats({ user }) {
  const [stats, setStats] = useState({
    sent: 0,
    pipeline: 0,
    refused: 0,
    pending: 0,
    interview: 0,
    accepted: 0
  });

  // grab all apps and split them up by status
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'applications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      
      const sentApps = data.filter(app => app.type === 'candidature');
      const pipelineApps = data.filter(app => app.type === 'acontacter');
      
      setStats({
        sent: sentApps.length,
        pipeline: pipelineApps.length,
        refused: sentApps.filter(app => app.statut === 'Refusé').length,
        pending: sentApps.filter(app => app.statut === 'En attente' || app.statut === 'Envoyé').length,
        interview: sentApps.filter(app => app.statut === 'Entretien').length,
        accepted: sentApps.filter(app => app.statut === 'Accepté').length,
      });
    });
    return () => unsubscribe();
  }, [user]);

  // basic math to get the %
  const totalActions = stats.sent + stats.pipeline;
  const pctSent = totalActions > 0 ? (stats.sent / totalActions) * 100 : 0;
  
  const pctRefused = stats.sent > 0 ? (stats.refused / stats.sent) * 100 : 0;
  const pctPending = stats.sent > 0 ? (stats.pending / stats.sent) * 100 : 0;
  const pctInterview = stats.sent > 0 ? (stats.interview / stats.sent) * 100 : 0;
  const pctAccepted = stats.sent > 0 ? (stats.accepted / stats.sent) * 100 : 0;

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <PieChart className="text-indigo-600 dark:text-indigo-400" size={36} />
          Statistiques
        </h1>
      </div>

      {/* Résumé Chiffré */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-indigo-600 dark:bg-indigo-700 text-white rounded-2xl p-6 shadow-md">
          <p className="text-indigo-100 dark:text-indigo-200 text-sm font-medium mb-1">Total Candidatures</p>
          <p className="text-4xl font-bold">{stats.sent}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl p-6 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">En pipeline (à cibler)</p>
          <p className="text-4xl font-bold">{stats.pipeline}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl p-6 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Entretiens décrochés</p>
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.interview}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl p-6 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Offres acceptées</p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.accepted}</p>
        </div>
      </div>

      {/* Graphiques Circulaires */}
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Taux de conversion</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <CircularProgress 
            percentage={pctSent} 
            color="text-indigo-500 dark:text-indigo-400" 
            label="Envoyées" 
            sublabel={`${stats.sent} sur ${totalActions} cibles`}
            icon={TrendingUp}
          />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <CircularProgress 
            percentage={pctPending} 
            color="text-amber-500 dark:text-amber-400" 
            label="En attente" 
            sublabel={`${stats.pending} sans retour`}
            icon={Clock}
          />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <CircularProgress 
            percentage={pctInterview} 
            color="text-purple-500 dark:text-purple-400" 
            label="Entretiens" 
            sublabel={`${stats.interview} obtenus`}
            icon={Building2}
          />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <CircularProgress 
            percentage={pctRefused} 
            color="text-rose-500 dark:text-rose-400" 
            label="Refus" 
            sublabel={`${stats.refused} refus`}
            icon={XCircle}
          />
        </div>
      </div>
      
      {pctAccepted > 0 && (
        <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-6 flex flex-col items-center justify-center">
           <CheckCircle className="text-green-500 dark:text-green-400 mb-3" size={48} />
           <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">Acceptés !</h2>
           <p className="text-green-700 dark:text-green-400 font-medium">{stats.accepted} offre(s) de stage validée(s).</p>
        </div>
      )}
    </div>
  );
}
