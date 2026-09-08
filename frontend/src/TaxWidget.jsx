import React, { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function TaxWidget({ citizen }) {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null); // id of tax being paid
  const [showModal, setShowModal] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);

  useEffect(() => {
    // Populate mock taxes on first load if empty
    fetch(`/api/v1/taxes/mock-populate/${citizen.cnp}`, { method: 'POST' }).then(() => loadTaxes());
  }, [citizen]);

  const loadTaxes = () => {
    setLoading(true);
    fetch(`/api/v1/taxes/citizen/${citizen.cnp}`)
      .then(r => r.json())
      .then(data => { setTaxes(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handlePay = (tax) => {
    setSelectedTax(tax);
    setShowModal(true);
  };

  const processPayment = async (e) => {
    e.preventDefault();
    setPaying(selectedTax.id);
    // Simulam delay de procesare
    await new Promise(r => setTimeout(r, 1500));
    try {
      await fetch(`/api/v1/taxes/${selectedTax.id}/pay`, { method: 'POST' });
      setShowModal(false);
      loadTaxes();
    } finally {
      setPaying(null);
    }
  };

  const handleDownload = (id) => {
    window.open(`/api/v1/taxes/${id}/receipt`, '_blank');
  };

  if (loading) return <div className="text-gray-400 py-4 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Se încarcă balanța financiară...</div>;

  const unpaid = taxes.filter(t => !t.paid);
  const paid = taxes.filter(t => t.paid);
  const totalDue = unpaid.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md flex justify-between items-center">
        <div>
          <p className="text-blue-100 font-medium">Total de Plată</p>
          <h2 className="text-3xl font-bold">{totalDue.toFixed(2)} RON</h2>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
          <CreditCard size={32} />
        </div>
      </div>

      {unpaid.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Sume Datorate</h3>
          <div className="space-y-3">
            {unpaid.map(tax => {
              const isOverdue = new Date(tax.dueDate) < new Date();
              return (
                <div key={tax.id} className={`p-4 rounded-xl border ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{tax.type}</h4>
                      <p className={`text-sm flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {isOverdue && <AlertCircle size={14}/>} 
                        Scadență: {new Date(tax.dueDate).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                    <span className="font-bold text-lg text-gray-900">{tax.amount} RON</span>
                  </div>
                  <button onClick={() => handlePay(tax)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition text-sm">
                    Plătește Acum
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {paid.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Istoric Plăți</h3>
          <div className="space-y-2">
            {paid.map(tax => (
              <div key={tax.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-500" size={20}/>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{tax.type}</p>
                    <p className="text-xs text-gray-500">{new Date(tax.paidAt).toLocaleDateString('ro-RO')}</p>
                  </div>
                </div>
                <button onClick={() => handleDownload(tax.id)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition" title="Descarcă Chitanța (PDF)">
                  <Download size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal Mock */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Plată Securizată</h3>
              <CreditCard className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Se achită <strong>{selectedTax.type}</strong> în valoare de <strong>{selectedTax.amount} RON</strong>.</p>
            
            <form onSubmit={processPayment} className="space-y-3">
              <div><label className="text-xs font-bold text-gray-500">Număr Card</label><input required type="text" placeholder="0000 0000 0000 0000" className="w-full border rounded p-2 text-sm" /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-xs font-bold text-gray-500">Expirare</label><input required type="text" placeholder="MM/YY" className="w-full border rounded p-2 text-sm" /></div>
                <div className="flex-1"><label className="text-xs font-bold text-gray-500">CVV</label><input required type="password" placeholder="***" className="w-full border rounded p-2 text-sm" /></div>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded">Anulare</button>
                <button type="submit" disabled={paying} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded flex justify-center items-center gap-2">
                  {paying ? <><Loader2 size={16} className="animate-spin"/> Se procesează</> : 'Confirmă Plata'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
