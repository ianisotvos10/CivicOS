import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Loader2, Sparkles, Plus, ShieldCheck, Calendar, QrCode, X, Building2, GraduationCap, Heart, Briefcase, Home, Landmark, MapPin } from 'lucide-react';
import { CitizenUser, OfficialDocument } from './types';

interface DocumentRequestProps {
  citizen: CitizenUser;
}

interface DocTypeConfig {
  type: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  desc: string;
  purposes: string[];
}

interface FiscalStatus {
  hasDebts: boolean;
  totalDebts?: number;
  debtDetails?: string[];
}

const DOC_TYPES: DocTypeConfig[] = [
  { type: 'Adeverință Rol Fiscal', icon: Landmark, desc: 'Situația fiscală completă a contribuabilului', purposes: ['Informare personală', 'Solicitare credit bancar', 'Altele'] },
  { type: 'Adeverință de Domiciliu', icon: Home, desc: 'Confirmarea domiciliului actual din evidențe', purposes: ['Înscriere școală/grădiniță', 'Angajare', 'Altele'] },
  { type: 'Certificat Nomenclatură Stradală', icon: MapPin, desc: 'Adresa oficială conform nomenclatorului urban', purposes: ['Intabulare', 'Modificare acte', 'Altele'] },
  { type: 'Certificat Fiscal', icon: Briefcase, desc: 'Atestare fiscală — necesar la notar pentru vânzare/cumpărare imobil', purposes: ['Vânzare imobil', 'Cumpărare imobil', 'Moștenire', 'Altele'] },
  { type: 'Adeverință pentru Grădiniță / Școală', icon: GraduationCap, desc: 'Document necesar la înscrierea copiilor în unitățile de învățământ', purposes: ['Înscriere grădiniță', 'Înscriere școală', 'Transfer'] },
  { type: 'Adeverință Venit / Ajutor Social', icon: Heart, desc: 'Confirmarea veniturilor pentru dosare de ajutor social', purposes: ['Ajutor social', 'Ajutor încălzire', 'Alocație suplimentară'] },
  { type: 'Certificat Atestare Fiscală PJ', icon: Building2, desc: 'Atestare fiscală pentru persoane juridice (firme, SRL, SA)', purposes: ['Participare licitație', 'Obținere licență', 'Fuziune/Cesiune'] },
];

export default function DocumentRequest({ citizen }: DocumentRequestProps): React.ReactElement {
  const [docs, setDocs] = useState<OfficialDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [requesting, setRequesting] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>(DOC_TYPES[0].type);
  const [selectedPurpose, setSelectedPurpose] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [fiscalStatus, setFiscalStatus] = useState<FiscalStatus | null>(null);
  const [loadingFiscal, setLoadingFiscal] = useState<boolean>(false);

  const loadDocs = useCallback((): void => {
    setLoading(true);
    fetch(`/api/v1/documents/citizen/${citizen.cnp}`)
      .then(r => r.json())
      .then((data: OfficialDocument[]) => {
        setDocs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [citizen.cnp]);

  useEffect(() => {
    loadDocs();
  }, [citizen.cnp, loadDocs]);

  const currentDocConfig = DOC_TYPES.find(d => d.type === selectedType) || DOC_TYPES[0];

  useEffect(() => {
    if (selectedType === 'Certificat Fiscal' || selectedType === 'Certificat Atestare Fiscală PJ') {
      setLoadingFiscal(true);
      fetch(`/api/v1/documents/fiscal-status/${citizen.cnp}`)
        .then(r => r.json())
        .then((data: FiscalStatus) => {
          setFiscalStatus(data);
          setLoadingFiscal(false);
        })
        .catch(() => setLoadingFiscal(false));
    } else {
      setFiscalStatus(null);
    }
  }, [selectedType, citizen.cnp]);

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setRequesting(true);
    try {
      const citizenDisplayName = citizen.prenume && citizen.nume ? `${citizen.prenume} ${citizen.nume}` : citizen.name || 'Cetățean';
      await fetch('/api/v1/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenCnp: citizen.cnp,
          citizenName: citizenDisplayName,
          documentType: selectedType,
          purpose: selectedPurpose || null,
        })
      });
      setShowForm(false);
      setSelectedPurpose('');
      loadDocs();
    } finally {
      setRequesting(false);
    }
  };

  const handleDownload = (id: string): void => {
    window.open(`/api/v1/documents/${id}/download`, '_blank');
  };

  if (loading) {
    return (
      <div className="text-gray-400 py-8 flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" size={16}/> Se încarcă documentele...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl">
        <div>
          <h3 className="font-black text-blue-900 flex items-center gap-2 text-lg"><Sparkles size={20}/> Smart Registry — Zero Birocrație</h3>
          <p className="text-sm text-blue-700 mt-1">Identitatea ta a fost verificată prin KYC. Documentele sunt aprobate și generate <strong>instantaneu</strong>, fără coadă, fără ghișeu.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white font-black py-2.5 px-5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition flex-shrink-0 shadow-md">
            <Plus size={16}/> Solicită Document
          </button>
        )}
      </div>

      {showForm && (
        <div className="border-2 border-blue-200 p-6 rounded-2xl bg-white shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-gray-900 text-lg">Solicită Document Oficial</h4>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
          </div>

          <form onSubmit={handleRequest} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-3">Selectează Tipul de Document</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DOC_TYPES.map(dt => {
                  const Icon = dt.icon;
                  const isSelected = selectedType === dt.type;
                  return (
                    <button type="button" key={dt.type} onClick={() => { setSelectedType(dt.type); setSelectedPurpose(''); }}
                      className={`text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-300' : 'border-gray-200 hover:border-blue-200 bg-white'}`}>
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Icon size={20} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>{dt.type}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{dt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {currentDocConfig.purposes && currentDocConfig.purposes.length > 0 && (
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Scopul Solicitării (opțional)</label>
                <select value={selectedPurpose} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPurpose(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 font-medium text-sm">
                  <option value="">— Selectează scopul —</option>
                  {currentDocConfig.purposes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            {(selectedType === 'Certificat Fiscal' || selectedType === 'Certificat Atestare Fiscală PJ') && (
              <div className={`p-4 rounded-xl border ${fiscalStatus?.hasDebts ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                {loadingFiscal ? (
                  <p className="text-sm flex items-center gap-2 text-gray-500"><Loader2 size={14} className="animate-spin"/> Se verifică situația fiscală...</p>
                ) : fiscalStatus ? (
                  <div>
                    <p className={`font-bold text-sm ${fiscalStatus.hasDebts ? 'text-yellow-800' : 'text-green-800'}`}>
                      {fiscalStatus.hasDebts ? '⚠️ Atenție: Aveți restanțe la bugetul local!' : '✅ Nu figurați cu datorii la bugetul local'}
                    </p>
                    {fiscalStatus.hasDebts && (
                      <div className="mt-2">
                        <p className="text-xs text-yellow-700">Total restanțe: <strong>{fiscalStatus.totalDebts?.toFixed(2)} RON</strong></p>
                        {fiscalStatus.debtDetails && fiscalStatus.debtDetails.map((d, i) => (
                          <p key={`debt-${i}-${d.substring(0, 8)}`} className="text-xs text-yellow-700 ml-2">• {d}</p>
                        ))}
                        <p className="text-xs text-yellow-600 mt-2 italic">Certificatul Fiscal va fi generat cu mențiunea datoriilor existente.</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition">Anulare</button>
              <button type="submit" disabled={requesting} className="px-5 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-black flex items-center gap-2 transition flex-1 justify-center shadow-md">
                {requesting ? <><Loader2 size={16} className="animate-spin"/> Se generează documentul...</> : <><Sparkles size={16}/> Emite Document Instantaneu</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h4 className="font-black text-gray-800 mb-4 text-lg">Documente Emise ({docs.length})</h4>
        {docs.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <FileText className="mx-auto text-gray-300 mb-3" size={48}/>
            <p className="text-gray-500 font-bold">Nu ai solicitat niciun document încă.</p>
            <p className="text-gray-400 text-sm mt-1">Apasă "Solicită Document" pentru a genera un act oficial.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map(doc => (
              <div key={doc.id} className="flex justify-between items-center border border-gray-200 p-5 rounded-xl bg-white hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100"><FileText className="text-blue-600" size={24}/></div>
                  <div>
                    <h5 className="font-black text-gray-900">{doc.documentType}</h5>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={12}/> {new Date(doc.issuedAt || doc.issueDate || '').toLocaleString('ro-RO')}</span>
                      {doc.registrationNumber && <span className="text-xs text-gray-500 font-mono">Nr. {doc.registrationNumber}</span>}
                      {doc.validUntil && <span className="text-xs text-blue-600 font-bold">Valabil până: {new Date(doc.validUntil).toLocaleDateString('ro-RO')}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-black rounded-md uppercase tracking-wide"><ShieldCheck size={12}/> Aprobat Automat</span>
                      {doc.qrVerificationCode && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md"><QrCode size={12}/> {doc.qrVerificationCode}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDownload(doc.id)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-sm shrink-0">
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
