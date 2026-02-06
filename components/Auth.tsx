
import React, { useState, useEffect, useRef } from 'react';
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
  const otpFirstRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (step === 'otp') {
      const timer = window.setTimeout(() => {
        otpFirstRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [step]);

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
    <div className="min-h-screen login-bg bg-gradient-to-b from-[#0b5688] via-[#0b6ba1] to-[#0a3f66] flex items-center justify-center p-6 text-slate-100">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-cyan-300 rounded-3xl flex items-center justify-center text-slate-900 shadow-2xl shadow-cyan-500/30 mx-auto mb-6 rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">ComplianceShield</h1>
          <p className="text-white/60 font-medium mt-2">Mobile Audit Infrastructure</p>
        </div>

        <div className="glassContainer rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/20 border border-white/10">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-3 ml-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 font-bold border-r border-white/20 pr-3">
                    +91
                  </div>
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter mobile number"
                    className="glassField w-full p-4 pl-16 rounded-2xl outline-none focus:ring-4 ring-cyan-300/30 transition-all font-bold text-lg text-white placeholder:text-white/40"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}

              <button 
                type="submit"
                disabled={loading || phone.length < 10}
                className="glassBtn w-full py-5 bg-cyan-300 text-slate-900 rounded-2xl font-black text-lg shadow-xl shadow-cyan-500/30 hover:bg-cyan-200 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Sending..." : "Request OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="text-center">
                <p className="text-sm font-bold text-white mb-1">Verify Account</p>
                <p className="text-xs text-white/60">Code sent to +91 {phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3')}</p>
              </div>

              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input 
                    key={idx}
                    id={`otp-${idx}`}
                    ref={idx === 0 ? otpFirstRef : undefined}
                    type="number"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    autoFocus={idx === 0}
                    className="glassField w-full aspect-square rounded-xl text-center font-black text-xl focus:border-cyan-300 transition-all outline-none text-white"
                    required
                  />
                ))}
              </div>

              {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}

              <button 
                type="submit"
                disabled={loading || otp.some(v => v === '')}
                className="glassBtn w-full py-5 bg-cyan-300 text-slate-900 rounded-2xl font-black text-lg shadow-xl shadow-cyan-500/30 hover:bg-cyan-200 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Enter"}
              </button>

              <button 
                type="button"
                onClick={() => setStep('phone')}
                className="glassBtn w-full text-xs font-bold text-white/60 hover:text-white transition-colors rounded-2xl py-2"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-white/50 font-bold uppercase tracking-widest mt-10 opacity-50">
          Powered by Gemini AI Engine
        </p>
      </div>
    </div>
  );
};
