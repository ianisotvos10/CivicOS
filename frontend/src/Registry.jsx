import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, User, FileText, MapPin, Hash, Save, RefreshCw, ServerCrash } from 'lucide-react';

const API_BASE = '/api/v1/registry';

export default function Registry({ onLogin }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setExtractedData(null);
      setSuccess(false);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/upload-id`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error("Eroare server (Python OCR)");
      const data = await response.json();
      setExtractedData({
        nume: data.nume,
        prenume: data.prenume,
        cnp: data.cnp,
        serie: data.serie,
        numar: data.numar,
        adresa: data.adresa,
        data_expirare: data.dataExpirare
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    setSaving(true);
    try {
      // Trimitem datele extrase spre Java pentru a crea/actualiza profilul
      const response = await fetch(`/api/v1/citizens/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nume: extractedData.nume,
          prenume: extractedData.prenume,
          cnp: extractedData.cnp,
          serie: extractedData.serie,
          numar: extractedData.numar,
          adresa: extractedData.adresa,
          dataExpirare: extractedData.data_expirare
        }),
      });
      if (!response.ok) throw new Error("Eroare la salvarea profilului.");
      const savedCitizen = await response.json();
      
      // Trimitem userul catre App.jsx (pastram structura ca sa nu se strice maparea in CitizenDashboard)
      onLogin({
        ...extractedData,
        data_expirare: savedCitizen.dataExpirare
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setExtractedData({ ...extractedData, [field]: value });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full animate-fadeIn">
      {/* Zona de Upload */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Scanare Document</h2>
        <p className="text-sm text-gray-500 mb-6">Încarcă o poză clară cu Cartea de Identitate a cetățeanului. AI-ul va extrage automat datele.</p>
        
        <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition bg-white min-h-[250px] relative overflow-hidden group">
          {preview ? (
            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2 z-0 opacity-40 group-hover:opacity-20 transition" />
          ) : null}
          <div className="z-10 flex flex-col items-center text-center">
            <UploadCloud size={40} className="text-blue-500 mb-3" />
            <span className="font-semibold text-gray-700">Apasă pentru a alege fișierul</span>
            <span className="text-xs text-gray-500 mt-1">Format suportat: JPG, PNG, PDF</span>
          </div>
          <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
        </label>

        {file && !extractedData && (
          <button 
            onClick={handleUpload} disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />}
            {loading ? 'AI-ul procesează (OCR)...' : 'Extrage Datele (AI)'}
          </button>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-start gap-2">
            <ServerCrash size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Rezultatul Extragerii (Formular Editabil) */}
      <div className="w-full md:w-2/3 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Date Extrase</h2>
          <p className="text-sm text-gray-500 mt-1">Verifică corectitudinea datelor înainte de a le salva în registru.</p>
        </div>
        
        <div className="p-6 flex-1 bg-gray-50/50">
          {!extractedData && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>Încarcă un document pentru a vedea rezultatele aici.</p>
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center text-blue-500 py-12 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="font-medium animate-pulse">Gemini Vision analizează imaginea...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1"><User size={14} className="text-blue-500" /> Nume de Familie</label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={extractedData.nume || ''} onChange={(e) => handleChange('nume', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1"><User size={14} className="text-blue-500" /> Prenume</label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={extractedData.prenume || ''} onChange={(e) => handleChange('prenume', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1"><Hash size={14} className="text-blue-500" /> CNP</label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono" value={extractedData.cnp || ''} onChange={(e) => handleChange('cnp', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Serie Buletin</label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase" value={extractedData.serie || ''} onChange={(e) => handleChange('serie', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Număr Buletin</label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono" value={extractedData.numar || ''} onChange={(e) => handleChange('numar', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1 text-orange-600">📅 Dată Expirare</label>
                  <input type="date" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono" value={extractedData.data_expirare || ''} onChange={(e) => handleChange('data_expirare', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1"><MapPin size={14} className="text-blue-500" /> Adresa completă</label>
                  <textarea rows="2" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={extractedData.adresa || ''} onChange={(e) => handleChange('adresa', e.target.value)}></textarea>
                </div>
              </div>
            </div>
          )}
        </div>

        {extractedData && (
          <div className="p-6 border-t border-gray-100 flex justify-end items-center gap-4 bg-white rounded-b-xl">
            <button 
              onClick={handleLoginSubmit} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition shadow-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} 
              {saving ? 'Se creează contul...' : `Continuă ca ${extractedData.prenume}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

