import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

import st1 from '../../assets/st1.png';
import st2 from '../../assets/st2.png';
import st3 from '../../assets/st3.png';
import st4 from '../../assets/st4.png';
import st5 from '../../assets/st5.png';
import st6 from '../../assets/st6.png';
import st7 from '../../assets/st7.png';
import st8 from '../../assets/st8.png';
import st9 from '../../assets/st9.png';
import st10 from '../../assets/st10.png';

const PHOTOS = [st1, st2, st3, st4, st5, st6, st7, st8, st9, st10];

const PANEL_W = 60;                 
const PANEL_LEFT = 100 - PANEL_W;   
const SEAM_TOP = 60;                
const SEAM_BOT = 40;                
const SEAM_AMP = 2;                 
const toPanel = (sx) => ((sx - PANEL_LEFT) / PANEL_W) * 100;
const SEAM = Array.from({ length: 41 }, (_, k) => {
  const y = k * 2.5; 
  const baseScreen = SEAM_TOP + (SEAM_BOT - SEAM_TOP) * (y / 100);
  const screenX = baseScreen + SEAM_AMP * Math.sin((y / 100) * Math.PI * 2);
  return [Math.round(toPanel(screenX) * 100) / 100, y];
});

const CLIP = `polygon(${SEAM.map(([x, y]) => `${x}% ${y}%`).join(', ')}, 100% 100%, 100% 0%)`;
const SEAM_PATH = 'M' + SEAM.map(([x, y]) => `${x} ${y}`).join(' L');

function PhotoSlideshow({ interval = 3500 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % PHOTOS.length), interval);
    return () => clearInterval(id);
  }, [interval]);

  return (
    <div className="absolute inset-0">
      <AnimatePresence>
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${PHOTOS[i]}')` }}
        />
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'timeout') {
      toast('You were logged out after 1 hour of inactivity.', { icon: '⏱️', duration: 5000 });
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [usePhone, setUsePhone] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

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
      if (user.role === 'manager') navigate('/dashboard/manager');
      else if (user.role === 'producer') navigate('/dashboard/producer');
      else navigate('/dashboard/client');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-music-gradient flex relative overflow-hidden">

      <div className="lg:hidden absolute inset-0">
        <PhotoSlideshow />
        <div className="absolute inset-0 bg-dark-950/85" />
      </div>

      <div
        className="hidden lg:block absolute top-0 bottom-0 right-0"
        style={{ width: `${PANEL_W}%` }}
      >
        <div className="absolute inset-0" style={{ clipPath: CLIP }}>
          <PhotoSlideshow />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950/70 via-dark-950/5 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-dark-950/25" />
        </div>

        <div className="absolute bottom-10 right-10 text-right max-w-xs">
          <p className="font-display font-bold text-2xl text-white drop-shadow-lg">
            Where Music <span className="gradient-text">Comes Alive</span>
          </p>
          <p className="text-purple-100/90 text-sm mt-1 drop-shadow">
            Ruyenzi, Kamonyi
          </p>
        </div>
        
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="seamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="seamGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={SEAM_PATH}
            fill="none"
            stroke="url(#seamGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            filter="url(#seamGlow)"
          />
        </svg>
      </div>

      <div className="absolute top-1/4 left-[12%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-[5%] w-80 h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-gradient flex items-center justify-center mx-auto mb-4 shadow-purple">
              <Music size={28} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl text-white">Delight Music</h1>
            <p className="text-purple-300 text-md mt-1">Sign in to your studio portal</p>
          </div>

          <div className="glass p-8">
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
    </div>
  );
}
