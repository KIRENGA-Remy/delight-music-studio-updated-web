import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'timeout') {
      toast('You were logged out after 1 hour of inactivity.', {
        icon: '⏱️',
        duration: 5000,
      });
      // Clean the URL
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]       = useState({ identifier: '', password: '' });
  const [usePhone, setUsePhone] = useState(false);
  const [showPwd,  setShowPwd] = useState(false);
  const [loading,  setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) { toast.error('All fields required'); return; }
    setLoading(true);
    try {
      const payload = usePhone
        ? { phone: form.identifier, password: form.password }
        : { email: form.identifier, password: form.password };
      const user = await login(payload);
      toast.success(`Welcome back, ${user.fullname}!`);
      if (user.role === 'manager')  navigate('/dashboard/manager');
      else if (user.role === 'producer') navigate('/dashboard/producer');
      else navigate('/dashboard/client');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-music-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-gradient flex items-center justify-center mx-auto mb-4 shadow-purple">
            <Music size={28} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Delight Music</h1>
          <p className="text-purple-300 text-md mt-1">Sign in to your studio portal</p>
        </div>

        <div className="glass p-8">
          {/* Toggle email/phone */}
          <div className="flex gap-2 mb-6 p-1 bg-dark-800/60 rounded-xl">
            <button onClick={() => setUsePhone(false)}
              className={`flex-1 py-2 rounded-lg text-md font-display font-semibold transition-all ${!usePhone ? 'bg-purple-gradient text-white shadow-purple' : 'text-purple-300 hover:text-white'}`}>
              Email
            </button>
            <button onClick={() => setUsePhone(true)}
              className={`flex-1 py-2 rounded-lg text-md font-display font-semibold transition-all ${usePhone ? 'bg-purple-gradient text-white shadow-purple' : 'text-purple-300 hover:text-white'}`}>
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-input">{usePhone ? 'Phone Number' : 'Email Address'}</label>
              <div className="relative">
                {usePhone ? <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                  : <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />}
                <input
                  value={form.identifier}
                  onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))}
                  placeholder={usePhone ? '+250 788 000 000' : 'you@example.com'}
                  className="input-dark pl-10" type={usePhone ? 'tel' : 'email'}
                  autoComplete={usePhone ? 'tel' : 'email'} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-input mb-0">Password</label>
                <Link to="/forgot-password" className="text-md text-gold-400 hover:text-gold-300 font-display font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Your password"
                  className="input-dark pl-10 pr-10"
                  autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
              ) : (
                <><span>Sign In</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 p-3 bg-dark-800/60 rounded-xl border border-purple-800/30 text-center">
            <p className="text-md text-purple-400">
              Don't have an account? Contact the studio manager to get access.
            </p>
          </div>

          <div className="mt-5 text-center">
            <p className="text-md text-purple-500">
              First time? Use <span className="text-gold-400 font-semibold">OTP Verification</span>
              {' → '}
              <Link to="/otp-verify" className="text-gold-400 hover:text-gold-300 font-semibold">Click here</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
