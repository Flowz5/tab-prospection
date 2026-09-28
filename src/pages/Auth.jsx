import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { UserPlus, LogIn, Briefcase, Moon, Sun } from 'lucide-react';

export default function Auth({ toggleDarkMode, isDarkMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // handle the login/signup stuff with firebase auth
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      // spit out some readable errors instead of the ugly firebase ones
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Email ou mot de passe incorrect.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà utilisée.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe doit faire au moins 6 caractères.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4 transition-colors relative">
      {toggleDarkMode && (
        <button 
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 p-3 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}

      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-colors">
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl opacity-50 pointer-events-none"></div>

        <div className="relative">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <Briefcase size={32} strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isLogin ? 'Connexion' : 'Inscription'}
            </h2>
          </div>

          {/* form submission */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm font-medium animate-pulse">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white transition-all outline-none"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-slate-700 dark:text-white transition-all outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 font-bold shadow-sm transition-all disabled:opacity-70"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                  {isLogin ? 'Se connecter' : "S'inscrire"}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            {/* toggle login/signup mode */}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
