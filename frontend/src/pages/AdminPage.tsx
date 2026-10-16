import React, { useState } from 'react';
import { Shield, ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import AdminDashboard from '../AdminDashboard';
import ErrorBoundary from '../ErrorBoundary';

export default function AdminPage(): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('civicos_admin_auth') === 'true';
  });
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (password === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('civicos_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Parolă incorectă! Pentru modul testare scrie "admin"');
    }
  };

  const handleLogout = (): void => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('civicos_admin_auth');
    setPassword('');
  };

  if (isAuthenticated) {
    return (
      <ErrorBoundary fallbackTitle="Eroare la încărcarea panoului de administrație">
        <AdminDashboard onLogout={handleLogout} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-900/40">
            <Shield size={22} />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">CivicOS</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/50">
              Admin Portal
            </span>
          </div>
        </div>
        <a 
          href="/" 
          className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition px-3 py-1.5 rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft size={16} /> Portal Cetățean
        </a>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl shadow-black/50">
          <div className="w-14 h-14 bg-purple-950/80 border border-purple-700/50 text-purple-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Lock size={28} />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Autentificare Funcționar</h1>
          <p className="text-sm text-slate-400 text-center mb-8">
            Panoul de control și decizie pentru gestionarea sesizărilor, taxelor și serviciilor publice municipale.
          </p>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Parolă Acces Administrație
              </label>
              <input 
                type="password" 
                autoFocus
                placeholder="Introdu parola (implicit 'admin')" 
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition placeholder:text-slate-500"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              />
              {authError && (
                <p className="text-rose-400 text-sm font-medium mt-2 flex items-center gap-1">
                  ⚠️ {authError}
                </p>
              )}
            </div>

            <button 
              type="submit"
              className="w-full flex justify-center items-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-600/30 transition active:scale-[0.99] cursor-pointer"
            >
              Intră în Dashboard <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-500">
              Pentru testare locală, utilizează parola: <code className="text-purple-400 bg-slate-900 px-2 py-0.5 rounded font-mono">admin</code>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        CivicOS &copy; {new Date().getFullYear()} &mdash; Modul de Administrație &amp; Decizie Publică
      </footer>
    </div>
  );
}

