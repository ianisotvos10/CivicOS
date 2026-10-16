import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Calendar, PieChart, TrendingUp, Activity, BarChart2, Map as MapIcon, X, Tag, Sparkles, AlertTriangle, FileText, CheckCircle2, Clock, ShieldCheck, Banknote, AlertCircle, Scale, ShieldAlert, Briefcase } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CityMapAlerts from './CityMapAlerts';
import { Request, Appointment, Poll, Tax, OfficialDocument, PublicServiceRequest } from './types';

const API_BASE = '/api/v1';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>('sesizari');
  const [sesizariView, setSesizariView] = useState<'list' | 'analytics'>('list');
  
  // Sesizari
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [bureaucratNotes, setBureaucratNotes] = useState<string>('');
  const [generatingReply, setGeneratingReply] = useState<boolean>(false);

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Polls
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newPollTitle, setNewPollTitle] = useState<string>('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);

  // Taxe
  const [taxes, setTaxes] = useState<Tax[]>([]);
  
  // Documente
  const [documents, setDocuments] = useState<OfficialDocument[]>([]);

  // Servicii e-Guvernare (Faza 7)
  const [serviceRequests, setServiceRequests] = useState<PublicServiceRequest[]>([]);

  const fetchRequests = useCallback(async (): Promise<void> => {
    try {
      const r = await fetch(`${API_BASE}/requests`);
      if (r.ok) {
        const data: Request[] = await r.json();
        setRequests(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAppointments = useCallback(async (): Promise<void> => {
    try {
      const r = await fetch(`${API_BASE}/appointments/admin/day?date=${selectedDate}`);
      if (r.ok) {
        const data: Appointment[] = await r.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedDate]);

  const fetchPolls = useCallback(async (): Promise<void> => {
    try {
      const r = await fetch(`${API_BASE}/polls/all`);
      if (r.ok) {
        const data: Poll[] = await r.json();
        setPolls(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTaxes = useCallback(async (): Promise<void> => {
    try {
      const r = await fetch(`${API_BASE}/taxes/all`);
      if (r.ok) {
        const data: Tax[] = await r.json();
        setTaxes(data.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchDocuments = useCallback(async (): Promise<void> => {
    try {
      const r = await fetch(`${API_BASE}/documents/all`);
      if (r.ok) {
        const data: OfficialDocument[] = await r.json();
        setDocuments(data.sort((a, b) => new Date(b.issueDate || b.issuedAt || '').getTime() - new Date(a.issueDate || a.issuedAt || '').getTime()));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchServiceRequests = useCallback(async (): Promise<void> => {
    try {
      const r = await fetch(`${API_BASE}/services/all`);
      if (r.ok) {
        const data: PublicServiceRequest[] = await r.json();
        setServiceRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchPolls();
    fetchTaxes();
    fetchDocuments();
    fetchServiceRequests();
  }, [fetchRequests, fetchPolls, fetchTaxes, fetchDocuments, fetchServiceRequests]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const resolveServiceRequest = async (id: string, status: string, message: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/services/${id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolutionMessage: message })
      });
      fetchServiceRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchRequests();
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status: newStatus as Request['status'] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReply = async (id: string): Promise<void> => {
    setGeneratingReply(true);
    try {
      const r = await fetch(`${API_BASE}/requests/${id}/draft-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: bureaucratNotes }),
      });
      setGeneratingReply(false);
      fetchRequests();
      if (r.ok) {
        const updatedReq: Request = await r.json();
        setSelectedRequest(updatedReq);
      } else {
        fetchRequests();
        setSelectedRequest(null);
      }
    } catch (err) {
      setGeneratingReply(false);
      console.error(err);
    }
  };

  const getStatusBadge = (status: string): React.ReactElement => {
    if (status === 'OPEN') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">NOU (OPEN)</span>;
    if (status === 'IN_PROGRESS') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">ÎN LUCRU</span>;
    if (status === 'RESOLVED') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">FINALIZATĂ</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
  };

  const getUrgencyBadge = (urgency?: string): React.ReactElement | null => {
    if (!urgency) return null;
    const u = urgency.toUpperCase();
    if (u.includes('URGENT') || u.includes('CRITIC')) return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-700"><AlertCircle size={12}/> URGENT</span>;
    if (u.includes('MEDIU') || u.includes('MEDIUM')) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-orange-100 text-orange-700">MEDIU</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-green-100 text-green-700">SCĂZUT</span>;
  };

  const handleCreatePoll = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (newPollTitle && newPollOptions[0] && newPollOptions[1]) {
      try {
        await fetch(`${API_BASE}/polls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: newPollTitle, options: newPollOptions.filter(o => o.trim() !== '') })
        });
        setNewPollTitle('');
        setNewPollOptions(['', '']);
        fetchPolls();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const closePoll = async (id: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/polls/${id}/close`, { method: 'PATCH' });
      fetchPolls();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans flex flex-col">
      <header className="max-w-7xl mx-auto w-full mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
            <LayoutDashboard className="text-blue-600" size={32} /> CivicOS Portal
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Dashboard Administrativ — Gestionare Inteligentă</p>
        </div>
        <button onClick={onLogout} className="text-sm font-bold text-red-600 hover:text-red-800 px-5 py-2.5 border-2 border-red-100 hover:border-red-200 bg-red-50 hover:bg-red-100 rounded-xl transition-all">Deconectare</button>
      </header>

      <div className="max-w-7xl mx-auto w-full mb-8 flex gap-3 overflow-x-auto bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
        <button onClick={() => setActiveTab('sesizari')} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'sesizari' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><LayoutDashboard size={18}/> Sesizări & AI</button>
        <button onClick={() => setActiveTab('servicii')} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'servicii' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Briefcase size={18}/> Servicii Publice</button>
        <button onClick={() => setActiveTab('documente')} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'documente' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><FileText size={18}/> Smart Registry</button>
        <button onClick={() => setActiveTab('financiar')} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'financiar' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Banknote size={18}/> Financiar & Taxe</button>
        <button onClick={() => setActiveTab('programari')} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'programari' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Calendar size={18}/> Ghișeu</button>
        <button onClick={() => setActiveTab('sondaje')} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'sondaje' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><BarChart2 size={18}/> Sondaje</button>
        <button onClick={() => setActiveTab('alerte')} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'alerte' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><MapIcon size={18}/> Harta Alertelor</button>
      </div>

      <main className="max-w-7xl mx-auto w-full flex-1">
        
        {/* TAB: SESIZARI */}
        {activeTab === 'sesizari' && (
          <div className="w-full flex flex-col gap-4">
            {sesizariView === 'list' && (
              <div className="flex justify-end">
                <button onClick={() => setSesizariView('analytics')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"><PieChart size={18}/> Vezi Analitică & Rapoarte</button>
              </div>
            )}
            
            {sesizariView === 'analytics' ? (
              <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3"><PieChart className="text-blue-600"/> Raport Analitic: Sesizări Urbane</h2>
                  <button onClick={() => setSesizariView('list')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all text-sm">Înapoi la Listă</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                    <div className="text-blue-800 font-bold text-sm mb-1 uppercase tracking-wider">Total Sesizări</div>
                    <div className="text-4xl font-black text-blue-900">{requests.length}</div>
                  </div>
                  <div className="bg-green-50 border border-green-100 p-5 rounded-xl">
                    <div className="text-green-800 font-bold text-sm mb-1 uppercase tracking-wider">Rezolvate</div>
                    <div className="text-4xl font-black text-green-900">{requests.filter(r => r.status === 'RESOLVED').length}</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-xl">
                    <div className="text-yellow-800 font-bold text-sm mb-1 uppercase tracking-wider">În Lucru</div>
                    <div className="text-4xl font-black text-yellow-900">{requests.filter(r => r.status === 'IN_PROGRESS').length}</div>
                  </div>
                  <div className="bg-red-50 border border-red-100 p-5 rounded-xl">
                    <div className="text-red-800 font-bold text-sm mb-1 uppercase tracking-wider">Noi (Neatribuite)</div>
                    <div className="text-4xl font-black text-red-900">{requests.filter(r => r.status === 'OPEN').length}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="border border-gray-200 p-6 rounded-xl bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Activity size={18}/> Repartiție pe Departamente (AI)</h3>
                    <div className="space-y-4">
                      {Object.entries(requests.reduce<Record<string, number>>((acc, req) => { 
                          const cat = req.aiCategory || 'Nespecificat'; 
                          acc[cat] = (acc[cat] || 0) + 1; 
                          return acc; 
                      }, {})).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                        <div key={cat}>
                          <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                            <span>{cat}</span>
                            <span>{count} ({requests.length > 0 ? Math.round(count / requests.length * 100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${requests.length > 0 ? (count / requests.length) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-gray-200 p-6 rounded-xl bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp size={18}/> Nivel de Urgență</h3>
                    <div className="space-y-4">
                      {Object.entries(requests.reduce<Record<string, number>>((acc, req) => { 
                          const urg = req.aiUrgency ? req.aiUrgency.toUpperCase() : 'NECUNOSCUT'; 
                          acc[urg] = (acc[urg] || 0) + 1; 
                          return acc; 
                      }, {})).sort((a, b) => b[1] - a[1]).map(([urg, count]) => {
                        let color = 'bg-gray-400';
                        if (urg.includes('URGENT') || urg.includes('CRITIC')) color = 'bg-red-500';
                        else if (urg.includes('MEDIU')) color = 'bg-orange-400';
                        else if (urg.includes('SCAZUT')) color = 'bg-green-500';

                        return (
                          <div key={urg}>
                            <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                              <span>{urg}</span>
                              <span>{count} ({requests.length > 0 ? Math.round(count / requests.length * 100) : 0}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                              <div className={`${color} h-full rounded-full`} style={{ width: `${requests.length > 0 ? (count / requests.length) * 100 : 0}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                <div className={`flex-1 flex flex-col gap-6 ${selectedRequest ? 'lg:w-5/12' : 'w-full'}`}>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: '350px' }}>
                    <MapContainer center={[46.77, 23.59]} zoom={12} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {requests.map(req => (req.latitude != null && req.longitude != null && !isNaN(Number(req.latitude)) && !isNaN(Number(req.longitude))) ? (
                        <CircleMarker
                          key={req.id}
                          center={[Number(req.latitude), Number(req.longitude)]}
                          radius={8}
                          fillOpacity={0.8}
                          color="white"
                          weight={2}
                          pathOptions={{ fillColor: req.aiUrgency?.toUpperCase().includes('URGENT') ? '#ef4444' : '#3b82f6' }}
                          eventHandlers={{ click: () => setSelectedRequest(req) }}
                        />
                      ) : null)}
                    </MapContainer>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 p-4 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '600px' }}>
                    <h3 className="font-black text-gray-800 text-lg mb-2 px-2">Sesizări Primite ({requests.length})</h3>
                    {requests.map(req => (
                      <div key={req.id} onClick={() => setSelectedRequest(req)} className={`cursor-pointer border p-4 rounded-xl transition-all ${selectedRequest?.id === req.id ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-2">
                          {getStatusBadge(req.status)}
                          {getUrgencyBadge(req.aiUrgency)}
                        </div>
                        <h4 className="font-bold text-gray-900 text-base leading-tight mb-2">{req.title}</h4>
                        <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                          <span className="flex items-center gap-1.5"><Tag size={12}/> {req.aiCategory || 'Categorie Nespecificată'}</span>
                          <span className="flex items-center gap-1.5"><Clock size={12}/> {new Date(req.createdAt).toLocaleDateString('ro-RO')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedRequest && (
                  <div className="w-full lg:w-7/12 bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden flex flex-col h-fit">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
                      <button onClick={() => setSelectedRequest(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-lg transition"><X size={20}/></button>
                      <div className="flex gap-2 mb-3">
                        {getStatusBadge(selectedRequest.status)}
                        {getUrgencyBadge(selectedRequest.aiUrgency)}
                      </div>
                      <h3 className="text-2xl font-black mb-1">{selectedRequest.title}</h3>
                      <p className="text-blue-100 text-sm font-medium">De la: {selectedRequest.citizenName || 'Anonim'} ({selectedRequest.citizenEmail})</p>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full z-0"></div>
                        <div className="flex items-center gap-2 text-indigo-700 font-black text-lg mb-4 relative z-10">
                          <Sparkles size={20}/> Analiză AI (Gemini)
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm relative z-10">
                          <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                            <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Departament Desemnat</span>
                            <span className="font-bold text-gray-900 mt-0.5 block">{selectedRequest.aiDepartment || 'N/A'}</span>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                            <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Sentiment Cetățean</span>
                            <span className="font-bold text-gray-900 mt-0.5 block">{selectedRequest.aiSentiment || 'N/A'}</span>
                          </div>
                          <div className="col-span-2 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                            <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Locație Detectată Automat</span>
                            <span className="font-bold text-gray-900 mt-0.5 block">{selectedRequest.aiLocation || 'Nespecificată'}</span>
                          </div>
                        </div>
                        {selectedRequest.aiSummary && (
                          <div className="mt-4 bg-white p-4 rounded-lg text-sm text-gray-700 border border-indigo-100 shadow-sm relative z-10">
                            <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">Rezumat AI (Sinteză)</span>
                            <p className="font-medium leading-relaxed">{selectedRequest.aiSummary}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-black text-gray-800 mb-2 uppercase text-xs tracking-wider">Mesaj Original</h4>
                        <div className="text-sm bg-gray-50 p-5 rounded-xl text-gray-700 whitespace-pre-wrap border border-gray-200 leading-relaxed font-medium">
                          {selectedRequest.description}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                        <h4 className="font-black text-gray-800 mb-4 uppercase text-xs tracking-wider">Acțiuni Funcționar & Rezoluție</h4>
                        {!selectedRequest.resolutionText ? (
                          <div className="space-y-3">
                            <textarea className="w-full border-2 border-gray-200 p-4 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none font-medium" placeholder="Scrie aici notițele tehnice sau pașii de rezolvare... AI-ul va formula răspunsul final politicos pentru cetățean." rows={3} value={bureaucratNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBureaucratNotes(e.target.value)} />
                            <button onClick={() => handleGenerateReply(selectedRequest.id)} disabled={generatingReply} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3.5 text-sm font-black flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-wait">
                              {generatingReply ? 'Se procesează de către AI...' : <><Sparkles size={18}/> Formulează Răspuns Oficial (AI)</>}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-green-50 p-5 rounded-xl text-sm text-green-900 border border-green-200 shadow-sm">
                            <div className="font-black flex items-center gap-2 mb-3 text-green-800"><CheckCircle2 size={18}/> Răspuns trimis către cetățean:</div>
                            <p className="font-medium leading-relaxed italic border-l-4 border-green-300 pl-4 py-1">{selectedRequest.resolutionText}</p>
                          </div>
                        )}
                        
                        <div className="mt-6 flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <span className="font-bold text-sm text-gray-700">Modifică Stadiul Sesizării:</span>
                          <select value={selectedRequest.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusChange(selectedRequest.id, e.target.value)} className="border-2 border-gray-300 p-2.5 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm cursor-pointer transition-all">
                            <option value="OPEN">NOU (OPEN)</option>
                            <option value="IN_PROGRESS">ÎN LUCRU</option>
                            <option value="RESOLVED">FINALIZATĂ</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: SERVICII PUBLICE (FAZA 7) */}
        {activeTab === 'servicii' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-gray-800">
              <Briefcase className="text-blue-600" size={28}/> Servicii e-Guvernare (Cereri Cetățeni)
            </h2>
            <div className="space-y-4">
              {serviceRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 font-medium">Nu există cereri înregistrate.</div>
              ) : (
                serviceRequests.map(req => {
                  let parsedDetails: Record<string, unknown> = {};
                  try {
                    parsedDetails = JSON.parse(req.details || '{}');
                  } catch {
                    parsedDetails = {};
                  }
                  return (
                    <div key={req.id} className="border border-gray-200 p-5 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-black text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                            {req.serviceType.replace('_', ' ')}
                          </span>
                          <h4 className="font-bold text-gray-900 text-lg">{req.subType}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            De la: <strong>{req.citizenName}</strong> (CNP: {req.citizenCnp})
                          </p>
                        </div>
                        <div>
                          {req.status === 'PENDING' && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">ÎN ANALIZĂ</span>}
                          {req.status === 'APPROVED' && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">APROBAT</span>}
                          {req.status === 'REJECTED' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">RESPINS</span>}
                          {req.status === 'INFO_NEEDED' && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">DATE INCOMPLETE</span>}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg font-mono mb-4 border border-gray-100">
                        {Object.entries(parsedDetails).map(([k, v]) => (
                          <div key={k} className="mb-1"><span className="font-bold capitalize">{k.replace('_', ' ')}:</span> {String(v)}</div>
                        ))}
                      </div>

                      {req.status === 'PENDING' ? (
                        <div className="flex gap-2 border-t pt-4">
                          <button onClick={() => {
                            const msg = prompt('Mesaj de aprobare:');
                            if (msg !== null) resolveServiceRequest(req.id, 'APPROVED', msg || 'Cererea a fost aprobată cu succes.');
                          }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition">Aprobă</button>
                          
                          <button onClick={() => {
                            const msg = prompt('Motiv respingere:');
                            if (msg !== null) resolveServiceRequest(req.id, 'REJECTED', msg || 'Cererea a fost respinsă.');
                          }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition">Respinge</button>

                          <button onClick={() => {
                            const msg = prompt('Ce date lipsesc?');
                            if (msg !== null) resolveServiceRequest(req.id, 'INFO_NEEDED', msg);
                          }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition">Cere Date Extra</button>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm">
                          <strong>Rezoluție Funcționar:</strong> {req.resolutionMessage}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB: SMART REGISTRY (DOCUMENTE) */}
        {activeTab === 'documente' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-gray-800"><FileText className="text-blue-600" size={28}/> Registru Electronic (Smart Registry)</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-gray-500 font-bold uppercase text-xs tracking-wider">Nr. Înreg</th>
                    <th className="px-6 py-4 text-gray-500 font-bold uppercase text-xs tracking-wider">Tip Document</th>
                    <th className="px-6 py-4 text-gray-500 font-bold uppercase text-xs tracking-wider">Cetățean</th>
                    <th className="px-6 py-4 text-gray-500 font-bold uppercase text-xs tracking-wider">CNP</th>
                    <th className="px-6 py-4 text-gray-500 font-bold uppercase text-xs tracking-wider">Data Emiterii</th>
                    <th className="px-6 py-4 text-gray-500 font-bold uppercase text-xs tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {documents.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-500 font-medium">Nu a fost eliberat niciun document încă.</td></tr> : null}
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-600 font-bold text-xs">{doc.registrationNumber}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{doc.documentType}</td>
                      <td className="px-6 py-4 font-medium">{doc.citizenName || doc.ownerName}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{doc.citizenCnp || doc.ownerCnp}</td>
                      <td className="px-6 py-4 font-medium text-gray-600">{new Date(doc.issueDate || doc.issuedAt || '').toLocaleString('ro-RO')}</td>
                      <td className="px-6 py-4"><span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-green-100 text-green-700 font-black tracking-wide"><ShieldCheck size={14}/> APROBAT AI</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: FINANCIAR (TAXE + AMENZI + CONTESTATII) */}
        {activeTab === 'financiar' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-gray-800"><Banknote className="text-emerald-600" size={28}/> Trezorerie & Taxe Locale</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-3 right-3 opacity-20"><Banknote size={48}/></div>
                  <div className="text-emerald-100 font-black uppercase text-xs tracking-wider mb-1">Total Încasat</div>
                  <div className="text-3xl font-black">{taxes.filter(t => t.paid || t.isPaid || t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0).toLocaleString()} <span className="text-lg text-emerald-200">RON</span></div>
                </div>
                <div className="bg-gradient-to-br from-rose-500 to-red-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-3 right-3 opacity-20"><AlertTriangle size={48}/></div>
                  <div className="text-rose-100 font-black uppercase text-xs tracking-wider mb-1">Restanțe</div>
                  <div className="text-3xl font-black">{taxes.filter(t => !t.paid && !t.isPaid && t.status !== 'PAID').reduce((sum, t) => sum + t.amount, 0).toLocaleString()} <span className="text-lg text-rose-200">RON</span></div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-3 right-3 opacity-20"><ShieldAlert size={48}/></div>
                  <div className="text-orange-100 font-black uppercase text-xs tracking-wider mb-1">Amenzi Active</div>
                  <div className="text-3xl font-black">{taxes.filter(t => t.category === 'AMENDA' && !t.paid && !t.isPaid).length}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-3 right-3 opacity-20"><Scale size={48}/></div>
                  <div className="text-purple-100 font-black uppercase text-xs tracking-wider mb-1">Contestații</div>
                  <div className="text-3xl font-black">{taxes.filter(t => t.contestationStatus === 'PENDING').length} <span className="text-lg text-purple-200">în așteptare</span></div>
                </div>
              </div>
              
              <h3 className="font-black text-gray-800 mb-4 text-lg">Rol Nominal (Evidență Completă)</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-5 py-3 text-gray-500 font-bold uppercase text-xs tracking-wider">Categorie</th>
                      <th className="px-5 py-3 text-gray-500 font-bold uppercase text-xs tracking-wider">Tip Taxă / Impozit</th>
                      <th className="px-5 py-3 text-gray-500 font-bold uppercase text-xs tracking-wider">Suma (RON)</th>
                      <th className="px-5 py-3 text-gray-500 font-bold uppercase text-xs tracking-wider">CNP</th>
                      <th className="px-5 py-3 text-gray-500 font-bold uppercase text-xs tracking-wider">Scadență</th>
                      <th className="px-5 py-3 text-gray-500 font-bold uppercase text-xs tracking-wider">Stare</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {taxes.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-500 font-medium">Nu există înregistrări fiscale.</td></tr> : null}
                    {taxes.map(tax => (
                      <tr key={tax.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-bold ${
                            tax.category === 'AMENDA' ? 'bg-red-100 text-red-700' : 
                            tax.category === 'IMPOZIT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>{tax.category || 'TAXA'}</span>
                        </td>
                        <td className="px-5 py-3 font-bold text-gray-800">{tax.title || tax.type}</td>
                        <td className="px-5 py-3 font-black text-gray-900">{tax.amount} RON</td>
                        <td className="px-5 py-3 font-mono text-gray-500 text-xs font-bold">{tax.citizenCnp}</td>
                        <td className="px-5 py-3 font-medium text-gray-600">{new Date(tax.dueDate).toLocaleDateString('ro-RO')}</td>
                        <td className="px-5 py-3">
                          {(tax.paid || tax.isPaid || tax.status === 'PAID') ? 
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-green-100 text-green-700 font-black"><CheckCircle2 size={13}/> ACHITAT</span> : 
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-red-100 text-red-700 font-black border border-red-200"><AlertCircle size={13}/> NEACHITAT</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Amenzi & Contestatii */}
            {taxes.filter(t => t.contestationStatus).length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-gray-800"><Scale className="text-orange-600" size={28}/> Contestații Amenzi</h2>
                <div className="space-y-4">
                  {taxes.filter(t => t.contestationStatus).map(tax => (
                    <div key={tax.id} className={`border-2 p-5 rounded-xl ${tax.contestationStatus === 'PENDING' ? 'border-orange-200 bg-orange-50/30' : tax.contestationStatus === 'APPROVED' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-black text-gray-900">{tax.title || tax.type}</h4>
                          <p className="text-sm text-gray-600 mt-0.5">CNP: <span className="font-mono font-bold">{tax.citizenCnp}</span> • {tax.processNumber && <span>Nr. PV: <strong>{tax.processNumber}</strong> • </span>}{tax.amount} RON</p>
                        </div>
                        <span className={`text-xs px-3 py-1.5 rounded-lg font-black ${
                          tax.contestationStatus === 'PENDING' ? 'bg-orange-100 text-orange-700' : 
                          tax.contestationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{tax.contestationStatus === 'PENDING' ? '⏳ ÎN ANALIZĂ' : tax.contestationStatus === 'APPROVED' ? '✓ APROBATĂ' : '✗ RESPINSĂ'}</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-3">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Motivul contestației (cetățean):</p>
                        <p className="text-sm text-gray-700 italic">"{tax.contestation}"</p>
                      </div>
                      {tax.contestationStatus === 'PENDING' && (
                        <div className="flex gap-3">
                          <button onClick={async () => {
                            const response = prompt('Motivul aprobării contestației:');
                            if (response !== null) {
                              await fetch(`${API_BASE}/taxes/${tax.id}/contest-resolve`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ approved: true, response: response || 'Contestația a fost analizată și aprobată.' })
                              });
                              fetchTaxes();
                            }
                          }} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-2.5 rounded-lg flex items-center justify-center gap-2 transition shadow-sm">
                            <CheckCircle2 size={16}/> Aprobă Contestația
                          </button>
                          <button onClick={async () => {
                            const response = prompt('Motivul respingerii contestației:');
                            if (response !== null) {
                              await fetch(`${API_BASE}/taxes/${tax.id}/contest-resolve`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ approved: false, response: response || 'Contestația a fost respinsă. Amenda rămâne valabilă.' })
                              });
                              fetchTaxes();
                            }
                          }} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-2.5 rounded-lg flex items-center justify-center gap-2 transition shadow-sm">
                            <X size={16}/> Respinge Contestația
                          </button>
                        </div>
                      )}
                      {tax.contestationResponse && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Răspuns oficial:</p>
                          <p className="text-sm text-gray-800 font-medium">"{tax.contestationResponse}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PROGRAMARI */}
        {activeTab === 'programari' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-black mb-6 text-gray-800">Agendă Programări Ghișeu</h2>
            <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block">
              <label className="font-bold text-sm text-gray-600 mr-4">Selectează Data:</label>
              <input type="date" value={selectedDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)} className="border-2 border-gray-300 rounded-lg px-4 py-2 text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {appointments.length === 0 ? <div className="text-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"><p className="text-gray-500 font-bold text-lg">Nicio programare pentru această zi.</p><p className="text-gray-400 text-sm mt-1">Ghișeul este liber.</p></div> : appointments.map(app => (
                <div key={app.id} className="flex items-center gap-6 p-5 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-3xl font-black text-blue-600 tracking-tight bg-blue-50 p-3 rounded-xl border border-blue-100">{app.timeSlot}</div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-gray-900">{app.citizenName}</div>
                    <div className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2"><Tag size={14}/> {app.purpose}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SONDAJE */}
        {activeTab === 'sondaje' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-gray-800"><BarChart2 className="text-purple-600" size={28}/> Sondaje Urbane (Statistici)</h2>
            
            <div className="mb-10 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl shadow-sm">
              <h3 className="font-black text-purple-900 mb-4 text-lg">Creează Sondaj Nou</h3>
              <form onSubmit={handleCreatePoll} className="space-y-4">
                <input required value={newPollTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPollTitle(e.target.value)} placeholder="Întrebare sondaj (Ex: Ești de acord cu pietonizarea străzii...)" className="w-full border-2 border-purple-200 rounded-xl p-4 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {newPollOptions.map((opt, i) => (
                    <input key={`new-poll-opt-${i}`} required value={opt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const n = [...newPollOptions]; n[i] = e.target.value; setNewPollOptions(n); }} placeholder={`Opțiunea ${i + 1}`} className="w-full border-2 border-gray-200 rounded-lg p-3 font-medium text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white" />
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button type="button" onClick={() => setNewPollOptions([...newPollOptions, ''])} className="text-sm font-black text-purple-700 hover:text-purple-900 transition-all bg-purple-100/50 hover:bg-purple-100 px-4 py-2 rounded-lg">+ Adaugă opțiune de răspuns</button>
                  <button type="submit" className="bg-purple-600 text-white font-black px-8 py-3 rounded-xl hover:bg-purple-700 transition-all shadow-md hover:shadow-lg">Lansează Sondajul</button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <h3 className="font-black text-gray-800 text-xl border-b pb-2">Rezultate Sondaje Active & Istoric</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {polls.map(poll => {
                  const totalVotes = poll.totalVotes || 0;
                  return (
                    <div key={poll.id} className="border border-gray-200 p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      {poll.status !== 'ACTIVE' && <div className="absolute inset-0 bg-gray-50/50 z-10 pointer-events-none"></div>}
                      <div className="flex justify-between items-start mb-6">
                        <div className="pr-4">
                          <h4 className="font-black text-lg text-gray-900 leading-tight mb-2">{poll.question}</h4>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 inline-block px-2 py-1 rounded">Total Voturi: {totalVotes}</p>
                        </div>
                        {poll.status === 'ACTIVE' ? <button onClick={() => closePoll(poll.id)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-black transition-all shadow-sm shrink-0 relative z-20">Închide</button> : <span className="text-xs text-gray-500 font-black tracking-widest bg-gray-200 px-3 py-1.5 rounded-lg shrink-0 z-20">ÎNCHIS</span>}
                      </div>
                      <div className="space-y-4 relative z-20">
                        {poll.options.map((opt, i) => {
                          const count = (poll.voteCounts && poll.voteCounts[i]) ? poll.voteCounts[i] : 0;
                          const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                          return (
                            <div key={`${poll.id}-opt-${i}-${opt}`} className="relative">
                              <div className="flex justify-between text-sm font-black text-gray-800 mb-1.5 relative z-10 px-1">
                                <span>{opt}</span>
                                <span>{count} ({percent}%)</span>
                              </div>
                              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden absolute top-0 left-0">
                                <div className={`h-full transition-all duration-1000 ${percent > 50 ? 'bg-purple-500' : 'bg-blue-400'}`} style={{ width: `${percent}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ALERTE */}
        {activeTab === 'alerte' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-gray-800"><MapIcon className="text-blue-600" size={28}/> Panou Control Harta Alertelor</h2>
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-inner">
              <CityMapAlerts isAdmin={true} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
