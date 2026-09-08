import React, { useState, useEffect } from 'react';
import { Plus, RefreshCcw, X, Shield, Mic, AlertTriangle, Clock, Calendar, BarChart2, ChevronDown, ChevronUp, UploadCloud, CheckCircle2, XCircle, CreditCard, FileText, Map as MapIcon } from 'lucide-react';
import ChatWidget from './ChatWidget';
import RequestTimeline from './RequestTimeline';
import PollWidget from './PollWidget';
import AppointmentBooking from './AppointmentBooking';
import TaxWidget from './TaxWidget';
import DocumentRequest from './DocumentRequest';
import CityMapAlerts from './CityMapAlerts';

const API_BASE = '/api/v1';

export default function CitizenDashboard({ user, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sesizari');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [expandedReqId, setExpandedReqId] = useState(null);
  const [attachFile, setAttachFile] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const checkExpiration = () => {
    if (!user.data_expirare) return null;
    const expDate = new Date(user.data_expirare);
    const diffDays = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { type: 'expired', message: `Cartea ta de identitate a expirat de ${Math.abs(diffDays)} zile!` };
    if (diffDays <= 30) return { type: 'warning', message: `Cartea ta de identitate expiră în ${diffDays} zile. Programează-te pentru reînnoire!` };
    return null;
  };
  const expirationAlert = checkExpiration();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/requests/citizen/${user.cnp}`);
      const data = await r.json();
      setRequests(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, [user.cnp]);

  const handleAttachFile = async (file) => {
    setAttachFile(file);
    setValidationResult(null);
    if (!file) return;
    setValidating(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const r = await fetch('http://localhost:8001/validate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, mime_type: file.type })
      });
      const data = await r.json();
      setValidationResult(data);
    } catch {
      setValidationResult({ valid: false, detected_type: 'Eroare', confidence: 'LOW', message: 'Nu s-a putut valida documentul.' });
    } finally { setValidating(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validationResult && !validationResult.valid) return alert('Document invalid.');
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRequest.title, description: newRequest.description,
          citizenCnp: user.cnp, citizenName: `${user.prenume} ${user.nume}`,
          citizenEmail: user.email || 'cetatean@civicos.ro', status: 'OPEN',
        }),
      });
      setNewRequest({ title: '', description: '' });
      setAttachFile(null); setValidationResult(null); setIsFormOpen(false);
      fetchRequests();
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const toggleListening = () => {
    if (isListening) { setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert('Browser nesuportat.');
    const rec = new SR(); rec.lang = 'ro-RO'; rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onresult = (ev) => setNewRequest(p => ({ ...p, description: p.description ? p.description + ' ' + ev.results[0][0].transcript : ev.results[0][0].transcript }));
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
  };

  const getStatusBadge = (status) => {
    const map = { OPEN: 'bg-yellow-100 text-yellow-800 border-yellow-200', IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200', RESOLVED: 'bg-green-100 text-green-800 border-green-200', REJECTED: 'bg-red-100 text-red-800 border-red-200' };
    const labels = { OPEN: 'NOU', IN_PROGRESS: 'ÎN LUCRU', RESOLVED: 'FINALIZAT', REJECTED: 'RESPINS' };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${map[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
  };

  const TABS = [
    { id: 'sesizari', label: 'Sesizările Mele', icon: Shield },
    { id: 'taxe', label: 'Taxe și Plăți', icon: CreditCard },
    { id: 'documente', label: 'Documente Oficiale', icon: FileText },
    { id: 'programare', label: 'Programare Ghișeu', icon: Calendar },
    { id: 'sondaje', label: 'Sondaje Urbane', icon: BarChart2 },
    { id: 'alerte', label: 'Alerte Oraș (Hartă)', icon: MapIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-blue-600" /> CivicOS Portal Cetățean
          </h1>
          <p className="text-sm text-gray-500">Logat ca: {user.prenume} {user.nume}</p>
        </div>
        <button onClick={onLogout} className="text-sm font-medium text-red-600 hover:text-red-800 px-4 py-2 border border-red-100 bg-red-50 rounded-lg">Deconectare</button>
      </header>

      <main className="max-w-4xl mx-auto w-full p-6 flex-1">
        {expirationAlert && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 shadow-sm ${expirationAlert.type === 'expired' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
            <AlertTriangle className="flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">{expirationAlert.type === 'expired' ? 'Act Expirat!' : 'Atenție!'}</h3>
              <p className="text-sm mt-1">{expirationAlert.message}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'sesizari' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Sesizările Mele</h2>
              <button onClick={() => { setIsFormOpen(!isFormOpen); setValidationResult(null); setAttachFile(null); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm">
                {isFormOpen ? <X size={18} /> : <Plus size={18} />} {isFormOpen ? 'Anulează' : 'Adaugă Sesizare'}
              </button>
            </div>
            {isFormOpen && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Subiect</label>
                    <input type="text" required className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newRequest.title} onChange={e => setNewRequest({ ...newRequest, title: e.target.value })} />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-sm font-semibold text-gray-700">Descriere detaliată</label>
                      <button type="button" onClick={toggleListening} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${isListening ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'bg-gray-100 text-gray-600 border-gray-200'}`}><Mic size={14} /> Dictează Vocal</button>
                    </div>
                    <textarea required rows="3" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newRequest.description} onChange={e => setNewRequest({ ...newRequest, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Atașament (opțional)</label>
                    <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer">
                      <UploadCloud size={20} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{attachFile ? attachFile.name : 'Alege fișier'}</span>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleAttachFile(e.target.files[0])} />
                    </label>
                    {validationResult && (
                      <div className={`mt-2 p-3 rounded-lg flex items-start gap-2 text-sm ${validationResult.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {validationResult.valid ? <CheckCircle2 size={16} className="mt-0.5" /> : <XCircle size={16} className="mt-0.5" />}
                        <div><p className="font-semibold">{validationResult.detected_type}</p><p>{validationResult.message}</p></div>
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={submitting || validating || (validationResult && !validationResult.valid)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">Trimite</button>
                </form>
              </div>
            )}
            {loading ? <div className="text-center py-12">Se încarcă...</div> : requests.length === 0 ? <div className="text-center p-12 text-gray-500 bg-white rounded-xl">Nu ai sesizări.</div> : (
              <div className="space-y-4">
                {requests.map(req => (
                  <div key={req.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-2">{getStatusBadge(req.status)}<span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString('ro-RO')}</span></div>
                      <h4 className="text-lg font-bold mb-1">{req.title}</h4>
                      <p className="text-gray-600 text-sm">{req.description}</p>
                      {req.resolutionText && <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-100"><span className="text-xs font-bold text-green-800">Răspuns Oficial:</span><p className="text-sm text-green-900 mt-1">"{req.resolutionText}"</p></div>}
                    </div>
                    <button onClick={() => setExpandedReqId(expandedReqId === req.id ? null : req.id)} className="w-full px-5 py-2.5 bg-gray-50 flex items-center gap-2 text-xs font-medium text-gray-500">
                      <Clock size={13} /> {expandedReqId === req.id ? 'Ascunde istoricul' : 'Vezi istoricul sesizării'}
                    </button>
                    {expandedReqId === req.id && <div className="px-5 pb-5 bg-gray-50"><RequestTimeline requestId={req.id} /></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'taxe' && <TaxWidget citizen={user} />}
        {activeTab === 'documente' && <DocumentRequest citizen={user} />}
        {activeTab === 'programare' && <div className="bg-white rounded-xl p-6 shadow-sm"><AppointmentBooking citizen={user} /></div>}
        {activeTab === 'sondaje' && <div className="bg-white rounded-xl p-6 shadow-sm"><PollWidget citizenCnp={user.cnp} /></div>}
        {activeTab === 'alerte' && <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Alerte și Avarii (Live)</h2>
          <CityMapAlerts isAdmin={false} />
        </div>}
      </main>

      <ChatWidget />
    </div>
  );
}
