import React, { useState } from 'react';
import { Shield, User, FileStack, ArrowRight } from 'lucide-react';
import CitizenDashboard from './CitizenDashboard';
import AdminDashboard from './AdminDashboard';
import Registry from './Registry';

export default function App() {
  const [role, setRole] = useState(null); // 'citizen' | 'admin' | 'kyc'
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (password === 'admin') {
      setRole('admin');
      setAuthError('');
    } else {
      setAuthError('Parolă incorectă! Încearcă "admin"');
    }
  };

  const handleCitizenLogin = (citizenData) => {
    setUser(citizenData);
    setRole('citizen');
  };

  const logout = () => {
    setRole(null);
    setUser(null);
    setPassword('');
  };

  if (role === 'admin') {
    return <AdminDashboard onLogout={logout} />;
  }

  if (role === 'citizen') {
    return <CitizenDashboard user={user} onLogout={logout} />;
  }

  if (role === 'kyc') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="text-blue-600" /> Identificare Digitală (KYC)
            </h1>
            <button onClick={() => setRole(null)} className="text-sm font-medium text-gray-500 hover:text-gray-800">Înapoi</button>
          </div>
          <Registry onLogin={handleCitizenLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        
        {/* Card Cetatean */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Portal Cetățean</h2>
          <p className="text-gray-500 mb-8">Identifică-te digital folosind buletinul pentru a depune sesizări și a urmări statusul lor.</p>
          <button 
            onClick={() => setRole('kyc')}
            className="w-full flex justify-between items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition"
          >
            Loghează-te cu Buletinul <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Card Administratie */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
            <FileStack size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Portal Administrație</h2>
          <p className="text-gray-500 mb-8">Dashboard avansat cu inteligență artificială pentru funcționarii publici.</p>
          
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
            <input 
              type="password" 
              placeholder="Parolă (scrie 'admin')" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {authError && <span className="text-red-500 text-sm font-medium">{authError}</span>}
            <button 
              type="submit"
              className="w-full flex justify-between items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition"
            >
              Intră în Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
