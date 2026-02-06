
import React, { useState, useEffect } from 'react';
import { TargetAudience, InventoryItem, DashboardStats, User, UserFeedback, HealthSensitivity } from './types';
import { analyzeProductImage, analyzeProductInfo } from './services/geminiService';
import { fetchProductInfoByBarcode } from './services/barcodeService';
import { dbService } from './services/dbService';
import { Scanner } from './components/Scanner';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const FeedbackModal: React.FC<{ 
  item: InventoryItem; 
  onClose: () => void; 
  onSubmit: (f: { type: UserFeedback['type'], comment: string }) => void;
}> = ({ item, onClose, onSubmit }) => {
  const [type, setType] = useState<UserFeedback['type']>('Wrong Regulation');
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#051825]/70 backdrop-blur-sm">
      <div className="surface-strong w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
        <h3 className="text-xl font-black text-white mb-2">Report Audit Error</h3>
        <p className="text-sm text-slate-200 mb-6">Help us improve the AI auditor for {item.productName}.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-200/70 uppercase mb-2">Error Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as UserFeedback['type'])}
              className="w-full bg-white/10 border border-white/20 p-3 rounded-xl outline-none focus:ring-2 ring-cyan-300/40 text-white"
            >
              <option value="Incorrect Expiry">Incorrect Expiry</option>
              <option value="Missed Allergen">Missed Allergen</option>
              <option value="Wrong Regulation">Wrong Regulation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-200/70 uppercase mb-2">Details</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explain what the AI missed..."
              className="w-full bg-white/10 border border-white/20 p-3 rounded-xl h-24 outline-none focus:ring-2 ring-cyan-300/40 resize-none text-white placeholder:text-white/50"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="glass-button flex-1 py-3 font-bold text-white/70 hover:bg-white/10 rounded-2xl transition-all">Cancel</button>
          <button 
            onClick={() => onSubmit({ type, comment })}
            className="glass-button flex-1 py-3 bg-cyan-300 text-slate-900 font-bold rounded-2xl hover:bg-cyan-200 shadow-xl shadow-cyan-500/30 transition-all"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

const ComplianceDetail: React.FC<{ item: InventoryItem; onReport: () => void }> = ({ item, onReport }) => {
  return (
    <div className="p-4 sm:p-8 bg-white/5 border-t border-white/10 animate-in slide-in-from-top duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h4 className="text-[10px] sm:text-sm font-black text-white/60 uppercase tracking-widest">Regional Regulation Audit</h4>
            <span className="text-[10px] bg-cyan-300 text-slate-900 px-3 py-1 rounded-full font-black shadow-lg shadow-cyan-500/30">{item.detectedRegion}</span>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {item.detailedChecklist.map((check, idx) => (
              <div key={idx} className="flex items-start gap-3 sm:gap-4 p-4 surface rounded-2xl border border-white/10 shadow-sm hover:border-white/20 transition-colors">
                <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  check.status === 'Passed' ? 'bg-emerald-100 text-emerald-600' : 
                  check.status === 'Failed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {check.status === 'Passed' ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-white text-sm tracking-tight">{check.requirement}</span>
                    <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/60">{check.regulationId}</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{check.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h4 className="text-[10px] sm:text-sm font-black text-white/60 uppercase tracking-widest">Clinical Risk Profile</h4>
            <span className="text-[9px] font-bold text-white/50 uppercase">*Medical Audit</span>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {(['diabetes', 'bp', 'heart'] as const).map((key) => {
              const data = item.healthSensitivity[key];
              const label = key === 'bp' ? 'Hypertension' : key.charAt(0).toUpperCase() + key.slice(1);
              const riskPercent = data.risk === 'High' ? 100 : data.risk === 'Medium' ? 50 : 15;
              const riskColor = data.risk === 'High' ? 'bg-red-500' : data.risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <div key={key} className="p-5 surface rounded-3xl border border-white/10 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${riskColor}`}></span>
                       <span className="text-xs font-black text-white uppercase tracking-tight">{label}</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      data.risk === 'High' ? 'bg-rose-500/20 text-rose-200' :
                      data.risk === 'Medium' ? 'bg-amber-400/20 text-amber-200' :
                      'bg-emerald-400/20 text-emerald-200'
                    }`}>
                      {data.risk}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${riskColor}`} style={{ width: `${riskPercent}%` }}></div>
                  </div>
                  <p className="text-[11px] text-white/60 leading-snug">{data.reason}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] sm:text-sm font-black text-white/60 uppercase tracking-widest mb-4 sm:mb-6">AI Safety Profile</h4>
          <div className="surface p-6 rounded-[2rem] border border-white/10 shadow-sm relative overflow-hidden ring-1 ring-white/10">
            <div className="flex items-center gap-5 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner ${
                item.safetyScore > 80 ? 'bg-emerald-400/20 text-emerald-200' : 
                item.safetyScore > 50 ? 'bg-amber-400/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'
              }`}>
                {item.safetyScore}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">AI Recommendation</div>
                <div className="text-white font-bold leading-tight">{item.recommendation}</div>
              </div>
            </div>

            <button 
              onClick={onReport}
              className="glass-button w-full py-3 border-2 border-dashed border-white/20 text-white/60 hover:border-white/40 hover:text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              Report Audit Correction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<'label' | 'barcode'>('label');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>({});
  const [feedbackItem, setFeedbackItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const activeUser = sessionStorage.getItem('cs_session_active_user');
    if (activeUser) {
      const parsedUser = JSON.parse(activeUser);
      setUser(parsedUser);
      dbService.getInventory(parsedUser.id).then(items => setInventory(items));
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    dbService.getInventory(u.id).then(items => setInventory(items));
  };
  
  const handleLogout = () => {
    setUser(null);
    setInventory([]);
    sessionStorage.removeItem('cs_session_active_user');
  };

  const downloadReport = () => {
    if (inventory.length === 0) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("ComplianceShield Audit Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Auditor: ${user?.phone}`, 14, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);

      const tableData = inventory.map(item => [
        item.productName,
        item.brand,
        item.detectedRegion,
        item.expiryDate || 'N/A',
        `${item.healthSensitivity.diabetes.risk[0]}/${item.healthSensitivity.bp.risk[0]}/${item.healthSensitivity.heart.risk[0]}`,
        `${item.safetyScore}%`,
        item.isRegulatorilyCompliant ? "COMPLIANT" : "NON-COMPLIANT"
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['Product', 'Brand', 'Region', 'Expiry', 'Health Risk (D/B/H)', 'Score', 'Compliance']],
        body: tableData,
        headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
        margin: { top: 50 },
        theme: 'striped'
      });
      doc.save(`Compliance_Report_${Date.now()}.pdf`);
    } catch (err) {
      alert("Could not generate report.");
    }
  };

  const handleScan = async (base64: string) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const result = await analyzeProductImage(base64);
      const newItem: InventoryItem = {
        ...result,
        id: 'aud_' + Math.random().toString(36).substr(2, 9),
        addedAt: Date.now(),
        imageUrl: `data:image/jpeg;base64,${base64}`
      };
      setInventory(prev => [newItem, ...prev]);
      setShowScanner(false);
      await dbService.saveItem(user.id, newItem);
    } catch (error: any) {
      console.error("Full Error Object:", error);
  
  if (error.message?.includes("SAFETY")) {
    alert("Safety Block: Please rephrase your request to be less medical.");
  } else {
    alert("Audit Failed: Ensure the product label is clearly legible.");
  }
    } finally {
      setIsProcessing(false);
    }
  };

  const createBarcodePlaceholder = (barcode: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <rect x="40" y="60" width="240" height="120" fill="#e2e8f0" rx="16"/>
      <text x="160" y="115" font-size="14" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif">Barcode</text>
      <text x="160" y="140" font-size="12" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif">${barcode}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const handleBarcodeScan = async (barcode: string, previewUrl?: string) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const productInfo = await fetchProductInfoByBarcode(barcode);
      const result = await analyzeProductInfo({
        barcode: productInfo.barcode,
        productName: productInfo.productName,
        brand: productInfo.brand,
        ingredientsText: productInfo.ingredientsText,
        categories: productInfo.categories,
        imageUrl: productInfo.imageUrl,
        expirationDate: productInfo.expirationDate,
        quantity: productInfo.quantity,
        countries: productInfo.countries
      });
      const newItem: InventoryItem = {
        ...result,
        id: 'aud_' + Math.random().toString(36).substr(2, 9),
        addedAt: Date.now(),
        imageUrl: productInfo.imageUrl || previewUrl || createBarcodePlaceholder(barcode)
      };
      setInventory(prev => [newItem, ...prev]);
      setShowScanner(false);
      await dbService.saveItem(user.id, newItem);
    } catch (error: any) {
      console.error("Full Error Object:", error);
      alert(error.message || "Barcode audit failed. Try a clearer scan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitFeedback = async (f: { type: UserFeedback['type'], comment: string }) => {
    if (!feedbackItem || !user) return;
    const feedback: UserFeedback = {
      id: 'fb_' + Math.random().toString(36).substr(2, 9),
      itemId: feedbackItem.id,
      type: f.type,
      comment: f.comment,
      submittedAt: Date.now()
    };
    await dbService.submitFeedback(user.id, feedback);
    setInventory(prev => prev.map(item => 
      item.id === feedbackItem.id ? { ...item, feedbackSubmitted: true } : item
    ));
    setFeedbackItem(null);
    alert("Audit Correction Logged.");
  };

  const deleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await dbService.deleteItem(user.id, id);
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const toggleIngredients = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIngredients(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  const stats: DashboardStats = {
    totalItems: inventory.length,
    expiredCount: inventory.filter(i => i.isExpired).length,
    riskyCount: inventory.filter(i => i.riskyIngredients.length > 0).length,
    regulatoryIssuesCount: inventory.filter(i => !i.isRegulatorilyCompliant).length,
    averageSafetyScore: inventory.length > 0 
      ? inventory.reduce((acc, curr) => acc + curr.safetyScore, 0) / inventory.length 
      : 0
  };

  const getRiskUI = (key: 'diabetes' | 'bp' | 'heart', risk: string) => {
    const icon = key === 'diabetes' ? (
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5L12 2 8 9.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
    ) : key === 'bp' ? (
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="10"/></svg>
    ) : (
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    );

    let colorClass = 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40';
    if (risk === 'High') colorClass = 'bg-rose-500/20 text-rose-200 border-rose-400/40';
    if (risk === 'Medium') colorClass = 'bg-amber-400/20 text-amber-200 border-amber-400/40';

    return (
      <div key={key} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border font-black text-[8px] tracking-tight ${colorClass}`}>
        <div className="shrink-0">{icon}</div>
        <span>{key === 'diabetes' ? 'DIA' : key === 'bp' ? 'BP' : 'HRT'}: {risk}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b5688] via-[#0b6ba1] to-[#0a3f66] pb-32 text-slate-100">
      <nav className="sticky top-0 z-[60] bg-white/10 border-b border-white/10 backdrop-blur-md shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-300 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-none">ComplianceShield</h1>
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{user.phone}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="glass-button p-2 text-white/60 hover:text-rose-200 transition-colors rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2">Inventory <span className="text-cyan-200">Audit</span></h2>
          <p className="text-white/60 text-xs font-medium">Production mobile compliance infrastructure.</p>
        </div>

        {showScanner ? (
          <div className="mb-10 animate-in zoom-in duration-300">
            <Scanner
              onScan={handleScan}
              onBarcodeScan={handleBarcodeScan}
              isProcessing={isProcessing}
              initialMode={scanMode}
            />
            <button onClick={() => setShowScanner(false)} className="glass-button w-full mt-4 text-xs font-bold text-white/60 rounded-2xl py-2">Cancel Scan</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-10">
            <button
              onClick={() => {
                setScanMode('label');
                setShowScanner(true);
              }}
              className="glass-button bg-cyan-300 text-slate-900 font-black py-5 rounded-3xl shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Image Upload
            </button>
            <button
              onClick={() => {
                setScanMode('barcode');
                setShowScanner(true);
              }}
              className="glass-button bg-white/10 border border-white/10 text-white/80 font-bold py-5 rounded-3xl shadow-sm flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 7h2v10H3M7 7v10m4-10v10m4-10v10m4-10h2v10h-2" />
              </svg>
              Barcode Scanner
            </button>
            <button onClick={downloadReport} className="glass-button bg-white/10 border border-white/10 text-white/80 font-bold py-4 rounded-3xl text-xs">Export Report</button>
            <div className="bg-white/10 border border-white/10 rounded-3xl flex items-center justify-center text-white font-black text-sm">{inventory.length} SKUs</div>
          </div>
        )}

        <Dashboard stats={stats} />

        <div className="space-y-4">
          {inventory.length === 0 ? (
            <div className="text-center py-20 surface rounded-[2.5rem] border border-white/10 border-dashed">
              <p className="text-white/60 font-black text-xs uppercase tracking-widest">No Active Audits</p>
            </div>
          ) : (
            inventory.map((item) => (
              <div key={item.id} className="surface rounded-[2rem] shadow-sm border border-white/10 overflow-hidden">
                <div onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="p-4 flex items-start gap-4 cursor-pointer hover:bg-white/5 transition-colors">
                  <img src={item.imageUrl} className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-black text-white text-sm truncate pr-2">{item.productName}</h3>
                      <span className={`text-[10px] font-black shrink-0 ${item.safetyScore > 80 ? 'text-emerald-300' : 'text-amber-300'}`}>{item.safetyScore}%</span>
                    </div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-tighter mb-2">{item.brand} • {item.detectedRegion}</p>
                    
                    {/* RESTORED: Expiry and Ingredients in Collapsed View */}
                    <div className="flex flex-col gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ring-1 ${item.isExpired ? 'bg-rose-500 text-white ring-rose-400/50' : 'bg-emerald-400/20 text-emerald-200 ring-emerald-400/40'}`}>
                          {item.expiryDate || 'N/A'}
                        </span>
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{item.targetAudience}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {(expandedIngredients[item.id] ? item.ingredients : item.ingredients.slice(0, 3)).map((ing, i) => (
                          <span
                            key={`${item.id}-${i}`}
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                              item.riskyIngredients.some(ri => ri.name.toLowerCase() === ing.toLowerCase())
                                ? 'bg-amber-100 border-amber-300 text-amber-800'
                                : 'bg-white/10 border-white/10 text-white/80'
                            }`}
                          >
                            {ing}
                          </span>
                        ))}
                        {item.ingredients.length > 3 && (
                          <button
                            onClick={(e) => toggleIngredients(item.id, e)}
                            className="glass-button text-[9px] font-black text-white/60 hover:text-white rounded-lg px-1.5 py-0.5"
                          >
                            {expandedIngredients[item.id]
                              ? "Show less"
                              : `+${item.ingredients.length - 3}`}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(['diabetes', 'bp', 'heart'] as const).map(key => getRiskUI(key, item.healthSensitivity[key].risk))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-between self-stretch py-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.isRegulatorilyCompliant ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>
                      {item.isRegulatorilyCompliant ? <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> : <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/></svg>}
                    </div>
                    <button onClick={(e) => deleteItem(item.id, e)} className="glass-button text-white/40 hover:text-rose-200 transition-colors rounded-xl p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  </div>
                </div>
                {expandedId === item.id && (
                  <ComplianceDetail item={item} onReport={() => setFeedbackItem(item)} />
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {feedbackItem && (
        <FeedbackModal item={feedbackItem} onClose={() => setFeedbackItem(null)} onSubmit={submitFeedback} />
      )}
    </div>
  );
};

export default App;
