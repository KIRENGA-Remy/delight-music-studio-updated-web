import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function OTPVerifyPage() {
  const { activateOTP } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [otp,        setOtp]        = useState(['', '', '', '', '']);
  const [loading,    setLoading]    = useState(false);
  const inputRefs = useRef([]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 4) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 5) { toast.error('Enter the full 5-digit OTP'); return; }
    if (!identifier)     { toast.error('Enter your email or phone'); return; }
    if (!password)       { toast.error('Set a new password'); return; }
    setLoading(true);
    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail
        ? { email: identifier, otp: code, password }
        : { phone: identifier, otp: code, password };
      const user = await activateOTP(payload);
      toast.success('Account activated! Welcome!');
      if (user.role === 'manager')  navigate('/dashboard/manager');
      else if (user.role === 'producer') navigate('/dashboard/producer');
      else navigate('/dashboard/client');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-music-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mx-auto mb-4 shadow-gold">
            <ShieldCheck size={28} className="text-dark-950" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Activate Account</h1>
          <p className="text-purple-300 text-sm mt-1">Enter the OTP sent by the studio manager</p>
        </div>

        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-input">Email or Phone</label>
              <input value={identifier} onChange={e => setIdentifier(e.target.value)}
                placeholder="your@email.com or +250788..." className="input-dark" />
            </div>

            <div>
              <label className="label-input">Enter OTP Code</label>
              <div className="flex gap-3 justify-between mt-1">
                {otp.map((digit, i) => (
                  <input key={i}
                    ref={el => inputRefs.current[i] = el}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    maxLength={1} type="text" inputMode="numeric"
                    className="w-12 h-14 text-center text-2xl font-display font-bold bg-dark-800 border border-purple-700/50 rounded-xl text-gold-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all" />
                ))}
              </div>
            </div>

            <div>
              <label className="label-input">Set New Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)}
                type="password" placeholder="Create a secure password"
                className="input-dark" autoComplete="new-password" />
              <p className="text-xs text-purple-500 mt-1">This will become your login password</p>
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3">
              {loading
                ? <div className="w-5 h-5 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                : <><span>Activate Account</span><ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
