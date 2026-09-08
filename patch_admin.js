const fs = require('fs');
const file = '/root/CivicOS/frontend/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { PieChart, TrendingUp, Activity')) {
    content = content.replace('import { LayoutDashboard, Calendar', 'import { LayoutDashboard, Calendar, PieChart, TrendingUp, Activity');
}

// Add state for sesizariView
if (!content.includes('const [sesizariView, setSesizariView]')) {
    content = content.replace('const [activeTab, setActiveTab] = useState(\'sesizari\');', "const [activeTab, setActiveTab] = useState('sesizari');\n  const [sesizariView, setSesizariView] = useState('list');");
}

// Analytics rendering logic
const analyticsCode = `
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
                      {Object.entries(requests.reduce((acc, req) => { 
                          const cat = req.aiCategory || 'Nespecificat'; 
                          acc[cat] = (acc[cat] || 0) + 1; 
                          return acc; 
                      }, {})).sort((a,b) => b[1] - a[1]).map(([cat, count], i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                            <span>{cat}</span>
                            <span>{count} ({Math.round(count/requests.length*100)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{width: \`\${(count/requests.length)*100}%\`}}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-gray-200 p-6 rounded-xl bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp size={18}/> Nivel de Urgență</h3>
                    <div className="space-y-4">
                      {Object.entries(requests.reduce((acc, req) => { 
                          const urg = req.aiUrgency ? req.aiUrgency.toUpperCase() : 'NECUNOSCUT'; 
                          acc[urg] = (acc[urg] || 0) + 1; 
                          return acc; 
                      }, {})).sort((a,b) => b[1] - a[1]).map(([urg, count], i) => {
                        let color = 'bg-gray-400';
                        if(urg.includes('URGENT') || urg.includes('CRITIC')) color = 'bg-red-500';
                        else if(urg.includes('MEDIU')) color = 'bg-orange-400';
                        else if(urg.includes('SCAZUT')) color = 'bg-green-500';

                        return (
                        <div key={i}>
                          <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                            <span>{urg}</span>
                            <span>{count} ({Math.round(count/requests.length*100)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                            <div className={\`\${color} h-full rounded-full\`} style={{width: \`\${(count/requests.length)*100}%\`}}></div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
`;

// Find where {activeTab === 'sesizari' && ( starts
const sesizariBlockStart = content.indexOf("{activeTab === 'sesizari' && (");
if (sesizariBlockStart !== -1) {
    const afterSesizariBlockStart = content.substring(sesizariBlockStart + "{activeTab === 'sesizari' && (".length);
    
    // We need to inject the view toggle button above the flex layout.
    // Wait, the flex layout is: <div className="flex flex-col lg:flex-row gap-6">
    // So let's replace that.
    
    const divFlexCol = '<div className="flex flex-col lg:flex-row gap-6">';
    const replacement = `
          <div className="w-full flex flex-col gap-4">
            {sesizariView === 'list' && (
              <div className="flex justify-end">
                <button onClick={() => setSesizariView('analytics')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"><PieChart size={18}/> Vezi Analitică & Rapoarte</button>
              </div>
            )}
            ${analyticsCode}
            <div className="flex flex-col lg:flex-row gap-6">`;
            
    content = content.replace("{activeTab === 'sesizari' && (\n          <div className=\"flex flex-col lg:flex-row gap-6\">", "{activeTab === 'sesizari' && (" + replacement);
    
    // Now we need to close the ternary operator we opened: `) : (`
    // It should close at the end of the sesizari block.
    // The sesizari block ends with:
    //             </div>
    //           </div>
    //         )}
    //       </div>
    //     )}
    // We need to insert `)}</div>` right before `)}` of activeTab === 'sesizari'.
    
    content = content.replace(/(\s*)<\/div>\s*\)\}\s*\{\/\* TAB: SMART REGISTRY \(DOCUMENTE\) \*\/\}/g, "$1</div>)}</div>)}\n\n        {/* TAB: SMART REGISTRY (DOCUMENTE) */}");
}

fs.writeFileSync(file, content);
console.log("Patched AdminDashboard successfully.");
