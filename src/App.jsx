import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import BonsPlans from './pages/BonsPlans';
import Stats from './pages/Stats';
import { LayoutDashboard, Users, LogOut, PieChart, Menu, X, UserCircle2, Moon, Sun } from 'lucide-react';

function AppContent({ user, toggleDarkMode, isDarkMode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', name: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/stats', name: 'Statistiques', icon: PieChart },
    { path: '/bons-plans', name: 'Bons Plans', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-700 dark:bg-slate-800 shadow-xl transition-all z-20">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-wide">StageTrack</span>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  isActive 
                    ? 'bg-indigo-800 dark:bg-indigo-600 text-white shadow-inner' 
                    : 'text-indigo-200 dark:text-slate-400 hover:bg-indigo-600/50 dark:hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-600/50 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3 px-2 py-2 w-full">
              <UserCircle2 className="w-8 h-8 text-indigo-200 dark:text-slate-400" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={toggleDarkMode}
              className="flex items-center justify-center p-3 text-indigo-100 dark:text-slate-300 bg-indigo-600 dark:bg-slate-700 hover:bg-indigo-500 dark:hover:bg-slate-600 rounded-xl transition-colors"
              title={isDarkMode ? "Passer au thème clair" : "Passer au thème sombre"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => signOut(auth)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-indigo-100 bg-indigo-600 dark:bg-slate-700 hover:bg-indigo-500 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Top Bar */}
        <div className="md:hidden bg-indigo-700 dark:bg-slate-800 flex items-center justify-between p-4 shadow-md z-30">
          <span className="text-xl font-bold text-white">StageTrack</span>
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="text-indigo-200 hover:text-white">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-1">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[60px] left-0 right-0 bg-indigo-700 dark:bg-slate-800 shadow-xl z-20 border-t border-indigo-600 dark:border-slate-700">
            <nav className="px-4 pt-2 pb-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                      isActive ? 'bg-indigo-800 dark:bg-indigo-600 text-white' : 'text-indigo-200 dark:text-slate-400 hover:bg-indigo-600 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={20} />
                    {link.name}
                  </Link>
                );
              })}
              <button
                onClick={() => signOut(auth)}
                className="flex w-full items-center gap-3 px-4 py-3 mt-4 text-sm font-bold text-indigo-200 dark:text-slate-400 hover:text-white hover:bg-indigo-600 dark:hover:bg-slate-700 rounded-lg"
              >
                <LogOut size={20} />
                Déconnexion
              </button>
            </nav>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900 transition-colors">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/stats" element={<Stats user={user} />} />
            <Route path="/bons-plans" element={<BonsPlans user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Theme handling
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // listen to auth state changes so we know who is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
    </div>
  );

  // if the dude isn't logged in, block him and show the auth screen
  if (!user) {
    return (
      <div className={`${isDarkMode ? 'dark' : ''}`}>
        <Auth toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      </div>
    );
  }

  return (
    <Router>
      <AppContent user={user} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
    </Router>
  );
}
