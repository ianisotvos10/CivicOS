import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader2, Sparkles, Plus } from 'lucide-react';

const DOC_TYPES = ['Adeverință Rol Fiscal', 'Adeverință de Domiciliu', 'Certificat Nomenclatură Stradală'];

export default function DocumentRequest({ citizen }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [selectedType, setSelectedType] = useState(DOC_TYPES[0]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadDocs(); }, [citizen]);

  const loadDocs = () => {
    setLoading(true);
    fetch(`/api/v1/documents/citizen/${citizen.cnp}`)
      .then(r => r.json())
      .then(data => { setDocs(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setRequesting(true);
    try {
      await fetch('/api/v1/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenCnp: citizen.cnp,
          citizenName: `${citizen.prenume} ${citizen.nume}`,
          documentType: selectedType
        })
      });
      setShowForm(false);
      loadDocs();
    } finally {
      setRequesting(false);
    }
  };

  const handleDownload = (id) => {
    window.open(`/api/v1/documents/${id}/download`, '_blank');
  };

  if (loading) return <div className="text-gray-400 py-4 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Se încarcă documentele...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-4 rounded-xl">
        <div>
          <h3 className="font-bold text-blue-900 flex items-center gap-2"><Sparkles size={18}/> Smart Registry</h3>
          <p className="text-sm text-blue-700">Deoarece identitatea ta a fost verificată automat, documentele sunt aprobate și generate instantaneu.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition flex-shrink-0">
            <Plus size={16}/> Cere Document Nou
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-gray-200 p-5 rounded-xl bg-white shadow-sm">
          <h4 className="font-bold mb-3 text-gray-800">Solicită Document Oficial</h4>
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Tip Document</label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500">
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition">Anulare</button>
              <button type="submit" disabled={requesting} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2 transition flex-1 justify-center">
                {requesting ? <><Loader2 size={16} className="animate-spin"/> Se generează...</> : 'Solicită și Generează'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h4 className="font-bold text-gray-800 mb-3">Istoric Documente</h4>
        {docs.length === 0 ? <p className="text-sm text-gray-500">Nu ai solicitat niciun document încă.</p> : (
          <div className="space-y-3">
            {docs.map(doc => (
              <div key={doc.id} className="flex justify-between items-center border border-gray-200 p-4 rounded-xl bg-white">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100"><FileText className="text-blue-600" size={24}/></div>
                  <div>
                    <h5 className="font-bold text-gray-900">{doc.documentType}</h5>
                    <p className="text-xs text-gray-500">Emis: {new Date(doc.issuedAt).toLocaleString('ro-RO')}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded uppercase">Aprobat Automat (Smart Registry)</span>
                  </div>
                </div>
                <button onClick={() => handleDownload(doc.id)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-lg text-sm font-semibold transition border border-gray-200">
                  <Download size={16}/> Descarcă PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
