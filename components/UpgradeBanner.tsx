
import React from 'react';

interface UpgradeBannerProps {
  onUpgrade: () => void;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ onUpgrade }) => {
  return (
    <div className="bg-gradient-to-r from-sky-500/90 to-cyan-400/90 rounded-3xl p-6 shadow-xl shadow-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
      <div className="flex items-center gap-4 relative">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-white leading-tight">Unlock Corporate Access</h3>
          <p className="text-white/80 text-sm opacity-90">Unlimited items, cloud sync, and dedicated support for large inventory hubs.</p>
        </div>
      </div>
      <button 
        onClick={onUpgrade}
        className="glass-button w-full md:w-auto px-8 py-3.5 bg-white text-sky-700 font-black rounded-2xl hover:bg-sky-50 transition-all shadow-lg active:scale-95"
      >
        Upgrade Now
      </button>
    </div>
  );
};
