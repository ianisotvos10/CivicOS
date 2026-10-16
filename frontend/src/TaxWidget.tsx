import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Download, CheckCircle2, AlertCircle, Loader2, FileWarning, Scale, Building2, Landmark, ShieldAlert, Clock, Send, X } from 'lucide-react';
import { CitizenUser, Tax, TaxCategory } from './types';

interface TaxWidgetProps {
  citizen: CitizenUser;
}

interface TaxSection {
  id: string;
  label: string;
  count: number;
  total: number | null;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

const CATEGORY_ICONS: Record<TaxCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  IMPOZIT: Landmark,
  TAXA: Building2,
  AMENDA: ShieldAlert,
};

export default function TaxWidget({ citizen }: TaxWidgetProps): React.ReactElement {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [showContestModal, setShowContestModal] = useState<boolean>(false);
  const [contestTax, setContestTax] = useState<Tax | null>(null);
  const [contestMotivation, setContestMotivation] = useState<string>('');
  const [contesting, setContesting] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('impozite');

  const loadTaxes = useCallback((): void => {
    setLoading(true);
    fetch(`/api/v1/taxes/citizen/${citizen.cnp}`)
      .then(r => r.json())
      .then((data: Tax[]) => {
        setTaxes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [citizen.cnp]);

  useEffect(() => {
    fetch(`/api/v1/taxes/mock-populate/${citizen.cnp}`, { method: 'POST' })
      .then(() => loadTaxes())
      .catch(() => loadTaxes());
  }, [citizen.cnp, loadTaxes]);

  const handlePay = (tax: Tax): void => {
    setSelectedTax(tax);
    setShowPayModal(true);
  };

  const processPayment = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!selectedTax) return;
    setPaying(selectedTax.id);
    await new Promise(r => setTimeout(r, 1500));
    try {
      await fetch(`/api/v1/taxes/${selectedTax.id}/pay`, { method: 'POST' });
      setShowPayModal(false);
      loadTaxes();
    } finally {
      setPaying(null);
    }
  };

  const handleContest = (tax: Tax): void => {
    setContestTax(tax);
    setContestMotivation('');
    setShowContestModal(true);
  };

  const submitContestation = async (): Promise<void> => {
    if (!contestMotivation.trim() || !contestTax) return;
    setContesting(true);
    try {
      await fetch(`/api/v1/taxes/${contestTax.id}/contest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivation: contestMotivation })
      });
      setShowContestModal(false);
      loadTaxes();
    } finally {
      setContesting(false);
    }
  };

  const handleDownload = (id: string): void => {
    window.open(`/api/v1/taxes/${id}/receipt`, '_blank');
  };

  if (loading) {
    return (
      <div className="text-gray-400 py-8 flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" size={16}/> Se încarcă situația financiară...
      </div>
    );
  }

  const unpaid = taxes.filter(t => !t.paid && !t.isPaid && t.status !== 'PAID');
  const paid = taxes.filter(t => t.paid || t.isPaid || t.status === 'PAID');
  const impozite = unpaid.filter(t => t.category === 'IMPOZIT');
  const taxeLocale = unpaid.filter(t => t.category === 'TAXA');
  const amenzi = unpaid.filter(t => t.category === 'AMENDA');
  const totalDue = unpaid.reduce((sum, t) => sum + t.amount, 0);
  const totalImpozite = impozite.reduce((s, t) => s + t.amount, 0);
  const totalTaxe = taxeLocale.reduce((s, t) => s + t.amount, 0);
  const totalAmenzi = amenzi.reduce((s, t) => s + t.amount, 0);

  const sections: TaxSection[] = [
    { id: 'impozite', label: 'Impozite', count: impozite.length, total: totalImpozite, icon: Landmark, color: 'blue' },
    { id: 'amenzi', label: 'Amenzi', count: amenzi.length, total: totalAmenzi, icon: ShieldAlert, color: 'red' },
    { id: 'taxe', label: 'Taxe Locale', count: taxeLocale.length, total: totalTaxe, icon: Building2, color: 'purple' },
    { id: 'istoric', label: 'Plăți Efectuate', count: paid.length, total: null, icon: CheckCircle2, color: 'green' },
  ];

  const renderTaxCard = (tax: Tax): React.ReactElement => {
    const isOverdue = new Date(tax.dueDate) < new Date();
    const isAmenda = tax.category === 'AMENDA';
    const hasDiscount = Boolean(isAmenda && tax.discountDeadline && new Date(tax.discountDeadline) > new Date());
    const daysUntilDiscount = hasDiscount && tax.discountDeadline ? Math.ceil((new Date(tax.discountDeadline).getTime() - new Date().getTime()) / 86400000) : 0;
    const Icon = CATEGORY_ICONS[tax.category] || Landmark;

    return (
      <div key={tax.id} className={`p-5 rounded-xl border transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-white'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isAmenda ? 'bg-red-100' : 'bg-blue-50'}`}>
              <Icon size={20} className={isAmenda ? 'text-red-600' : 'text-blue-600'} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">{tax.title || tax.type}</h4>
              <p className={`text-sm flex items-center gap-1 mt-0.5 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                {isOverdue && <AlertCircle size={13}/>}
                Scadență: {new Date(tax.dueDate).toLocaleDateString('ro-RO')}
              </p>
              {isAmenda && tax.processNumber && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><FileWarning size={12}/> Nr. PV: <span className="font-bold text-gray-700">{tax.processNumber}</span></p>
                  {tax.issuedBy && <p className="text-xs text-gray-500">Emis de: <span className="font-medium">{tax.issuedBy}</span></p>}
                  {tax.issuedDate && <p className="text-xs text-gray-500">Data constatării: {new Date(tax.issuedDate).toLocaleDateString('ro-RO')}</p>}
                </div>
              )}
            </div>
          </div>
          <span className="font-black text-xl text-gray-900">{tax.amount.toLocaleString('ro-RO', {minimumFractionDigits: 2})} <span className="text-sm font-bold text-gray-500">RON</span></span>
        </div>

        {hasDiscount && (
          <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <Clock size={16} className="text-green-600 shrink-0"/>
            <div>
              <p className="text-sm font-bold text-green-800">Reducere 50% disponibilă!</p>
              <p className="text-xs text-green-700">Plătește <strong>{(tax.amount / 2).toFixed(2)} RON</strong> în loc de {tax.amount} RON — mai ai <strong>{daysUntilDiscount} zile</strong></p>
            </div>
          </div>
        )}

        {tax.contestationStatus && (
          <div className={`mb-3 rounded-lg p-3 border ${
            tax.contestationStatus === 'PENDING' ? 'bg-yellow-50 border-yellow-200' :
            tax.contestationStatus === 'APPROVED' ? 'bg-green-50 border-green-200' :
            'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm font-bold ${
              tax.contestationStatus === 'PENDING' ? 'text-yellow-800' :
              tax.contestationStatus === 'APPROVED' ? 'text-green-800' : 'text-red-800'
            }`}>
              <Scale size={14} className="inline mr-1"/>
              Contestație: {tax.contestationStatus === 'PENDING' ? 'În analiză...' : tax.contestationStatus === 'APPROVED' ? 'Aprobată ✓' : 'Respinsă ✗'}
            </p>
            {tax.contestationResponse && <p className="text-xs mt-1 text-gray-700 italic">"{tax.contestationResponse}"</p>}
          </div>
        )}

        <div className="flex gap-2">
          {!tax.contestationStatus || tax.contestationStatus === 'REJECTED' ? (
            <>
              <button onClick={() => handlePay(tax)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-1.5">
                <CreditCard size={16}/> Plătește Online
              </button>
              {isAmenda && !tax.contestationStatus && (
                <button onClick={() => handleContest(tax)} className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold rounded-lg transition text-sm flex items-center gap-1.5">
                  <Scale size={16}/> Contestă
                </button>
              )}
            </>
          ) : tax.contestationStatus === 'PENDING' ? (
            <div className="w-full text-center py-2.5 text-yellow-700 bg-yellow-50 rounded-lg font-bold text-sm border border-yellow-200">
              <Loader2 size={14} className="inline animate-spin mr-1"/> Contestația este în curs de analiză
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-blue-100 font-bold text-sm uppercase tracking-wider mb-1">Situație Financiară — Balanță Totală</p>
        <h2 className="text-4xl font-black">{totalDue.toLocaleString('ro-RO', {minimumFractionDigits: 2})} <span className="text-2xl text-blue-200">RON</span></h2>
        <div className="flex gap-6 mt-4">
          <div className="bg-white/10 px-4 py-2 rounded-lg">
            <p className="text-[10px] uppercase text-blue-200 font-bold">Impozite</p>
            <p className="font-black text-lg">{totalImpozite.toLocaleString('ro-RO', {minimumFractionDigits: 2})}</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg">
            <p className="text-[10px] uppercase text-blue-200 font-bold">Taxe</p>
            <p className="font-black text-lg">{totalTaxe.toLocaleString('ro-RO', {minimumFractionDigits: 2})}</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg">
            <p className="text-[10px] uppercase text-red-200 font-bold">Amenzi</p>
            <p className="font-black text-lg">{totalAmenzi.toLocaleString('ro-RO', {minimumFractionDigits: 2})}</p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl overflow-x-auto">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${activeSection === s.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon size={16}/> {s.label} {s.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeSection === s.id ? `bg-${s.color}-100 text-${s.color}-700` : 'bg-gray-200'}`}>{s.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Impozite Section */}
      {activeSection === 'impozite' && (
        <div className="space-y-4">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-2"><Landmark size={20} className="text-blue-600"/> Impozite Locale ({impozite.length})</h3>
          {impozite.length === 0 ? <p className="text-gray-500 text-sm bg-gray-50 p-6 rounded-xl text-center">Nu ai impozite de plată. Felicitări! 🎉</p> :
            <div className="space-y-4">{impozite.map(renderTaxCard)}</div>
          }
        </div>
      )}

      {/* Amenzi Section */}
      {activeSection === 'amenzi' && (
        <div className="space-y-4">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-2"><ShieldAlert size={20} className="text-red-600"/> Amenzi Contravenționale ({amenzi.length})</h3>
          {amenzi.length === 0 ? <p className="text-gray-500 text-sm bg-gray-50 p-6 rounded-xl text-center">Nu ai amenzi active. Bravo! 👏</p> :
            <div className="space-y-4">{amenzi.map(renderTaxCard)}</div>
          }
        </div>
      )}

      {/* Taxe Section */}
      {activeSection === 'taxe' && (
        <div className="space-y-4">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-2"><Building2 size={20} className="text-purple-600"/> Taxe Locale ({taxeLocale.length})</h3>
          {taxeLocale.length === 0 ? <p className="text-gray-500 text-sm bg-gray-50 p-6 rounded-xl text-center">Nu ai taxe locale restante.</p> :
            <div className="space-y-4">{taxeLocale.map(renderTaxCard)}</div>
          }
        </div>
      )}

      {/* Istoric Section */}
      {activeSection === 'istoric' && (
        <div className="space-y-4">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-2"><CheckCircle2 size={20} className="text-green-600"/> Plăți Efectuate ({paid.length})</h3>
          {paid.length === 0 ? <p className="text-gray-500 text-sm bg-gray-50 p-6 rounded-xl text-center">Nicio plată efectuată încă.</p> :
            <div className="space-y-2">
              {paid.map(tax => (
                <div key={tax.id} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-500" size={20}/>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{tax.title || tax.type}</p>
                      <p className="text-xs text-gray-500">{tax.amount} RON — Achitat la {tax.paidAt ? new Date(tax.paidAt).toLocaleDateString('ro-RO') : 'N/A'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDownload(tax.id)} className="flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-bold transition border border-blue-100" title="Descarcă Chitanța">
                    <Download size={16}/> PDF
                  </button>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedTax && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-gray-900">Plată Securizată</h3>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600">Se achită: <strong className="text-gray-900">{selectedTax.title || selectedTax.type}</strong></p>
              <p className="text-2xl font-black text-blue-700 mt-1">{selectedTax.amount} RON</p>
            </div>
            <form onSubmit={processPayment} className="space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Număr Card</label><input required type="text" placeholder="0000 0000 0000 0000" className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mt-1" /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-xs font-bold text-gray-500 uppercase">Expirare</label><input required type="text" placeholder="MM/YY" className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-blue-500 outline-none mt-1" /></div>
                <div className="flex-1"><label className="text-xs font-bold text-gray-500 uppercase">CVV</label><input required type="password" placeholder="•••" className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-blue-500 outline-none mt-1" /></div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition">Anulare</button>
                <button type="submit" disabled={Boolean(paying)} className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-blue-700 transition shadow-md">
                  {paying ? <><Loader2 size={16} className="animate-spin"/> Se procesează...</> : <><CreditCard size={16}/> Confirmă Plata</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contestation Modal */}
      {showContestModal && contestTax && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-gray-900 flex items-center gap-2"><Scale size={22} className="text-orange-600"/> Contestare Amendă</h3>
              <button onClick={() => setShowContestModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-orange-900">{contestTax.title || contestTax.type}</p>
              <p className="text-xs text-orange-700 mt-1">Nr. PV: {contestTax.processNumber} • {contestTax.amount} RON • Emis de: {contestTax.issuedBy}</p>
            </div>
            <div className="mb-6">
              <label className="text-sm font-bold text-gray-700 block mb-2">Motivul contestației *</label>
              <textarea required rows={5} value={contestMotivation} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContestMotivation(e.target.value)}
                placeholder="Descrieți în detaliu motivul pentru care considerați că amenda a fost aplicată incorect. Includeți orice dovezi sau circumstanțe relevante..."
                className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none" />
              <p className="text-xs text-gray-400 mt-1">Contestația va fi analizată de un funcționar public în termen de 30 zile lucrătoare.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowContestModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition">Anulare</button>
              <button onClick={submitContestation} disabled={contesting || !contestMotivation.trim()} className="flex-1 bg-orange-600 text-white font-black py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-orange-700 transition shadow-md disabled:opacity-50">
                {contesting ? <><Loader2 size={16} className="animate-spin"/> Se trimite...</> : <><Send size={16}/> Trimite Contestația</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
