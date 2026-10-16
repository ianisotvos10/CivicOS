import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Car, FileText, Heart, CheckCircle, Clock, XCircle, ArrowRight, Loader2, Home, UserCheck, ShieldAlert } from 'lucide-react';
import { CitizenUser, PublicServiceRequest } from './types';

const API_BASE = 'http://localhost:8081/api/v1/services';

type ServiceFormType = 'URBANISM' | 'PARCARE' | 'STARE_CIVILA' | 'SOCIAL';

interface ServicesWidgetProps {
  citizen: CitizenUser;
}

export default function ServicesWidget({ citizen }: ServicesWidgetProps): React.ReactElement {
  const [requests, setRequests] = useState<PublicServiceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeForm, setActiveForm] = useState<ServiceFormType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchRequests = useCallback((): void => {
    setLoading(true);
    fetch(`${API_BASE}/citizen/${citizen.cnp}`)
      .then(r => r.json())
      .then((data: PublicServiceRequest[]) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [citizen.cnp]);

  useEffect(() => {
    fetchRequests();
  }, [citizen.cnp, fetchRequests]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!activeForm) return;
    setSubmitting(true);
    
    let subType = '';
    if (activeForm === 'URBANISM') subType = 'Certificat de Urbanism';
    if (activeForm === 'PARCARE') subType = 'Cerere Loc Parcare Reședință';
    if (activeForm === 'STARE_CIVILA') subType = 'Cerere Viză de Flotant';
    if (activeForm === 'SOCIAL') subType = 'Cerere Ajutor Social (Încălzire / Alocație)';

    const citizenDisplayName = citizen.name || (citizen.prenume && citizen.nume ? `${citizen.prenume} ${citizen.nume}` : 'Cetățean');

    const payload = {
      citizenCnp: citizen.cnp,
      citizenName: citizenDisplayName,
      serviceType: activeForm,
      subType: subType,
      details: JSON.stringify(formData),
      status: 'PENDING'
    };

    try {
      await fetch(`${API_BASE}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchRequests();
      setActiveForm(null);
      setFormData({});
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string): React.ReactElement | null => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12}/> ÎN ANALIZĂ</span>;
      case 'APPROVED':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> APROBAT</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12}/> RESPINS</span>;
      case 'INFO_NEEDED':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><ShieldAlert size={12}/> DATE INCOMPLETE</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-10">
          <Briefcase size={200} />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2">Servicii e-Guvernare</h2>
          <p className="text-blue-100 text-lg max-w-2xl">
            Fără dosar cu șină. Fără cozi. Depune cereri pentru urbanism, flotant, loc de parcare sau ajutoare sociale, 100% online.
          </p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button onClick={() => setActiveForm('URBANISM')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group">
          <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Home size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Urbanism</h3>
          <p className="text-sm text-gray-500">Certificate, Autorizații, Avize</p>
        </button>

        <button onClick={() => setActiveForm('PARCARE')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group">
          <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Car size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Parcări</h3>
          <p className="text-sm text-gray-500">Locuri reședință, Abonamente</p>
        </button>

        <button onClick={() => setActiveForm('STARE_CIVILA')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group">
          <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UserCheck size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Stare Civilă</h3>
          <p className="text-sm text-gray-500">Viză flotant, Transcrieri</p>
        </button>

        <button onClick={() => setActiveForm('SOCIAL')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group">
          <div className="bg-rose-100 text-rose-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Heart size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Asistență Socială</h3>
          <p className="text-sm text-gray-500">Ajutoare, Indemnizații, Tichete</p>
        </button>
      </div>

      {/* FORMULARE ACTIVE */}
      {activeForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-8 relative">
          <button onClick={() => setActiveForm(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700">
            <XCircle size={24} />
          </button>
          
          <h3 className="text-2xl font-black text-gray-900 mb-6">
            {activeForm === 'URBANISM' && 'Cerere Certificat de Urbanism'}
            {activeForm === 'PARCARE' && 'Cerere Loc de Parcare Reședință'}
            {activeForm === 'STARE_CIVILA' && 'Aprobare Viză de Flotant'}
            {activeForm === 'SOCIAL' && 'Cerere Asistență Socială'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            {activeForm === 'URBANISM' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Număr Cadastral / CF</label>
                  <input required type="text" className="w-full border-gray-300 rounded-lg shadow-sm p-3 border" placeholder="ex: 123456" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nr_cadastral: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Scopul Solicitării</label>
                  <textarea required className="w-full border-gray-300 rounded-lg shadow-sm p-3 border" placeholder="Construire casă P+1, informare, etc." onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, scop: e.target.value })}></textarea>
                </div>
              </>
            )}

            {activeForm === 'PARCARE' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Număr Înmatriculare</label>
                  <input required type="text" className="w-full border-gray-300 rounded-lg shadow-sm p-3 border uppercase" placeholder="CJ 01 ABC" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, numar_auto: e.target.value.toUpperCase() })} />
                </div>
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100 flex items-start gap-3">
                  <ShieldAlert className="flex-shrink-0 mt-0.5" size={16} />
                  <p>Sistemul va verifica automat dacă autoturismul are ITP-ul valabil, RCA-ul la zi și dacă impozitul auto este achitat la zi în momentul analizei.</p>
                </div>
              </>
            )}

            {activeForm === 'STARE_CIVILA' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">CNP Proprietar Spațiu (Găzduitor)</label>
                  <input required type="text" minLength={13} maxLength={13} className="w-full border-gray-300 rounded-lg shadow-sm p-3 border" placeholder="CNP din 13 cifre" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, cnp_proprietar: e.target.value })} />
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg text-sm border border-emerald-100 flex items-start gap-3">
                  <UserCheck className="flex-shrink-0 mt-0.5" size={16} />
                  <p>Proprietarul va primi o notificare electronică pentru a confirma luarea dumneavoastră în spațiu. Nu mai este necesar să vă prezentați împreună la ghișeu!</p>
                </div>
              </>
            )}

            {activeForm === 'SOCIAL' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tip Ajutor</label>
                  <select required className="w-full border-gray-300 rounded-lg shadow-sm p-3 border" onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, tip_ajutor: e.target.value })}>
                    <option value="">Alegeți...</option>
                    <option value="incalzire">Ajutor pentru încălzirea locuinței</option>
                    <option value="tichete">Tichete Sociale de Sărbători</option>
                  </select>
                </div>
                <div className="bg-rose-50 text-rose-800 p-4 rounded-lg text-sm border border-rose-100 flex items-start gap-3">
                  <Heart className="flex-shrink-0 mt-0.5" size={16} />
                  <p>Sistemul e-Guvernare va interoga direct baza de date ANAF. Nu mai aveți nevoie de adeverință de venit tipărită!</p>
                </div>
              </>
            )}

            <button disabled={submitting} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-sm flex items-center justify-center gap-2 w-full mt-4 disabled:opacity-50">
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              Trimite Cererea Oficială
            </button>
          </form>
        </div>
      )}

      {/* ISTORIC CERERI */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="text-blue-600" /> Istoric Cereri Depuse
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nu ați depus nicio cerere.</div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => {
              let parsedDetails: Record<string, unknown> = {};
              try {
                parsedDetails = JSON.parse(req.details || '{}');
              } catch {
                parsedDetails = {};
              }
              return (
                <div key={req.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-black text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                        {req.serviceType.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-gray-900 text-lg">{req.subType}</h4>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-3 mb-3 font-mono">
                    {Object.entries(parsedDetails).map(([k, v]) => (
                      <div key={k}><span className="font-bold capitalize">{k.replace('_', ' ')}:</span> {String(v)}</div>
                    ))}
                  </div>

                  {req.resolutionMessage && (
                    <div className={`p-4 rounded-lg text-sm border ${req.status === 'APPROVED' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      <strong className="block mb-1">Răspuns Funcționar:</strong>
                      {req.resolutionMessage}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-3">
                    Depusă la: {new Date(req.createdAt).toLocaleString('ro-RO')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
