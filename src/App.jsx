import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import BonsPlans from './pages/BonsPlans';
import Stats from './pages/Stats';
import { LayoutDashboard, Users, LogOut, PieChart, Menu, X, UserCircle2 } from 'lucide-react';

function AppContent({ user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', name: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/stats', name: 'Statistiques', icon: PieChart },
    { path: '/bons-plans', name: 'Bons Plans', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-700 shadow-xl transition-all z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-wide">StageTrack</span>
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
                    ? 'bg-indigo-800 text-white shadow-inner' 
                    : 'text-indigo-200 hover:bg-indigo-600/50 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-600/50">
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-800/50 rounded-xl mb-4">
            <UserCircle2 className="w-8 h-8 text-indigo-200" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-indigo-100 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Top Bar */}
        <div className="md:hidden bg-indigo-700 flex items-center justify-between p-4 shadow-md z-30">
          <span className="text-xl font-bold text-white">StageTrack</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-1">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[60px] left-0 right-0 bg-indigo-700 shadow-xl z-20 border-t border-indigo-600">
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
                      isActive ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-600'
                    }`}
                  >
                    <Icon size={20} />
                    {link.name}
                  </Link>
                );
              })}
              <button
                onClick={() => signOut(auth)}
                className="flex w-full items-center gap-3 px-4 py-3 mt-4 text-sm font-bold text-indigo-200 hover:text-white hover:bg-indigo-600 rounded-lg"
              >
                <LogOut size={20} />
                Déconnexion
              </button>
            </nav>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
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

  // listen to auth state changes so we know who is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  // if the dude isn't logged in, block him and show the auth screen
  if (!user) {
    return <Auth />;
  }

  return (
    <Router>
      <AppContent user={user} />
    </Router>
  );
}
