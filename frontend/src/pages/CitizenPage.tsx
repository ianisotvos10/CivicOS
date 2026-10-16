import React, { useState } from 'react';
import { Shield, User, ArrowRight, ArrowLeft, Zap, Sparkles } from 'lucide-react';
import CitizenDashboard from '../CitizenDashboard';
import Registry from '../Registry';
import ErrorBoundary from '../ErrorBoundary';
import { CitizenUser } from '../types';

export default function CitizenPage(): React.ReactElement {
  const [user, setUser] = useState<CitizenUser | null>(() => {
    const saved = sessionStorage.getItem('civicos_citizen_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isKycMode, setIsKycMode] = useState<boolean>(false);

  const handleCitizenLogin = (citizenData: CitizenUser): void => {
    setUser(citizenData);
    sessionStorage.setItem('civicos_citizen_user', JSON.stringify(citizenData));
    setIsKycMode(false);
  };

  const handleDemoLogin = (): void => {
    const demoUser: CitizenUser = {
      cnp: '1850101123456',
      nume: 'Popescu',
      prenume: 'Ion',
      name: 'Popescu Ion',
      firstName: 'Ion',
      serie: 'RD',
      numar: '654321',
      idSeries: 'RD',
      idNumber: '654321',
      adresa: 'Str. Libertății nr. 12, Sector 1, București',
      address: 'Str. Libertății nr. 12, Sector 1, București',
      data_expirare: '2028-12-31',
      dataExpirare: '2028-12-31',
      expiryDate: '2028-12-31',
      email: 'ion.popescu@civicos.ro'
    };
    handleCitizenLogin(demoUser);
  };

  const handleLogout = (): void => {
    setUser(null);
    sessionStorage.removeItem('civicos_citizen_user');
    setIsKycMode(false);
  };

  // Logged-in citizen view
  if (user) {
    return (
      <ErrorBoundary fallbackTitle="Eroare la încărcarea portalului cetățean">
        <CitizenDashboard user={user} onLogout={handleLogout} />
      </ErrorBoundary>
    );
  }

  // KYC ID Scan view
  if (isKycMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <Shield size={22} />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">CivicOS</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Identificare Digitală (KYC)
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsKycMode(false)}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft size={16} /> Înapoi la Portal
          </button>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Scanare și Verificare Carte de Identitate</h1>
            <p className="text-sm text-gray-500 mt-1">
              Încarcă fotografia cărții de identitate. Modulul OCR inteligent va extrage automat datele pentru autentificare.
            </p>
          </div>
          <Registry onLogin={handleCitizenLogin} />
        </main>
      </div>
    );
  }

  // Citizen Landing / Login options view
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Top Navbar */}
      <header className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20">
            <Shield size={22} />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">CivicOS</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Portal Cetățean
            </span>
          </div>
        </div>

        <a 
          href="/admin" 
          className="text-sm font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-4 py-2 rounded-xl transition flex items-center gap-1.5"
        >
          Portal Administrație (Funcționari) <ArrowRight size={16} />
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <User size={32} />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
            Portalul Serviciilor Publice pentru Cetățeni
          </h1>
          <p className="text-gray-600 text-base leading-relaxed mb-8">
            Platforma unică pentru depunerea sesizărilor urbane, plata taxelor și impozitelor locale, solicitarea de certificate și recepționarea notificărilor în timp real.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* Opțiunea 1: KYC Scan */}
            <div className="border border-blue-200 rounded-2xl p-5 bg-blue-50/40 hover:bg-blue-50/80 transition flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Shield size={14} /> Recomandat
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Identificare cu Buletinul</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Încarcă poza buletinului pentru extragere automată prin OCR inteligent.
                </p>
              </div>
              <button 
                onClick={() => setIsKycMode(true)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                Scanează Buletinul <ArrowRight size={16} />
              </button>
            </div>

            {/* Opțiunea 2: Quick Demo Login */}
            <div className="border border-emerald-200 rounded-2xl p-5 bg-emerald-50/40 hover:bg-emerald-50/80 transition flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Zap size={14} /> Rapid pentru testare
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Cetățean Demo</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Autentificare instantanee cu profilul de test Ion Popescu (fără upload).
                </p>
              </div>
              <button 
                onClick={handleDemoLogin}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} /> Intră ca Ion Popescu
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-gray-500 flex items-center justify-between">
            <span>Funcționarii publici și administratorii accesează platforma dedicată:</span>
            <a href="/admin" className="font-semibold text-purple-600 hover:text-purple-800 underline ml-2">
              /admin
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-gray-500 bg-white border-t border-gray-200">
        CivicOS &copy; {new Date().getFullYear()} &mdash; Sistemul Digital Integrat pentru Administrația Publică Locală
      </footer>
    </div>
  );
}

