
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { dbService } from '../services/dbService';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setError(null);
    setLoading(true);
    // Simulate sending OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setStep('otp');
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some(v => v === '')) return;
    
    setLoading(true);
    setError(null);
    try {
      // In production, verify OTP with backend. Here we accept any 6 digits.
      await new Promise(resolve => setTimeout(resolve, 1200));
      const user = await dbService.loginWithPhone(phone);
      onLogin(user);
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-slate-700 rounded-3xl flex items-center justify-center text-white shadow-2xl mx-auto mb-6 rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ComplianceShield</h1>
          <p className="text-slate-500 font-medium mt-2">Mobile Audit Infrastructure</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-100">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r border-slate-200 pr-3">
                    +91
                  </div>
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter mobile number"
                    className="w-full bg-slate-50 border border-slate-200 p-4 pl-16 rounded-2xl outline-none focus:ring-4 ring-slate-400/10 transition-all font-bold text-lg"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}

              <button 
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-5 bg-slate-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Sending..." : "Request OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900 mb-1">Verify Account</p>
                <p className="text-xs text-slate-400">Code sent to +91 {phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3')}</p>
              </div>

              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input 
                    key={idx}
                    id={`otp-${idx}`}
                    type="number"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    className="w-full aspect-square bg-slate-50 border-2 border-slate-100 rounded-xl text-center font-black text-xl focus:border-slate-500 focus:bg-white transition-all outline-none"
                    required
                  />
                ))}
              </div>

              {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}

              <button 
                type="submit"
                disabled={loading || otp.some(v => v === '')}
                className="w-full py-5 bg-slate-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Enter"}
              </button>

              <button 
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-10 opacity-50">
          Powered by Gemini AI Engine
        </p>
      </div>
    </div>
  );
};
