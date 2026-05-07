import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Camera, Lock, Save, Eye, EyeOff, Check,
  Shield, Bell, Palette, LogOut, Edit2, X, Phone, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const BASE_URL = 'https://delightmusicstudio.onrender.com';

const TABS = [
  { key: 'profile',  label: 'Profile',   icon: User },
  { key: 'security', label: 'Security',  icon: Shield },
  { key: 'notifs',   label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const fileRef = useRef();

  const [tab,        setTab]        = useState('profile');
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [avatarPrev, setAvatarPrev] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Profile form
  const [pForm, setPForm] = useState({ fullname: '', bio: '', phone: '', client_type: '' });

  // Security form
  const [sForm, setSForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [passStrength, setPassStrength] = useState(0);

  useEffect(() => {
    api.get('/profile')
      .then(r => {
        setProfile(r.data);
        setPForm({
          fullname:    r.data.fullname    || '',
          bio:         r.data.bio         || '',
          phone:       r.data.phone       || '',
          client_type: r.data.client_type || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setAvatarFile(file);
    setAvatarPrev(URL.createObjectURL(file));
  };

  const calcStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8)  s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!pForm.fullname.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('fullname', pForm.fullname);
      fd.append('bio', pForm.bio);
      if (pForm.phone) fd.append('phone', pForm.phone);
      if (pForm.client_type) fd.append('client_type', pForm.client_type);
      if (avatarFile) fd.append('avatar', avatarFile);

      const res = await api.put('/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(res.data.user);

      // Update localStorage so AuthContext reflects new name/avatar
      const stored = JSON.parse(localStorage.getItem('dm_user') || '{}');
      localStorage.setItem('dm_user', JSON.stringify({ ...stored, ...res.data.user }));
      window.dispatchEvent(new Event('dm_profile_updated'));

      toast.success('Profile updated!');
      setAvatarFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (sForm.new_password !== sForm.confirm_password) {
      toast.error('Passwords do not match'); return;
    }
    if (passStrength < 2) { toast.error('Password is too weak'); return; }
    setSaving(true);
    try {
      await api.put('/profile/password', {
        current_password: sForm.current_password,
        new_password:     sForm.new_password,
      });
      toast.success('Password changed!');
      setSForm({ current_password: '', new_password: '', confirm_password: '' });
      setPassStrength(0);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const avatarSrc = avatarPrev
    || (profile?.avatar_url ? `${BASE_URL}${profile.avatar_url}` : null);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passStrength];
  const strengthColor = ['', 'bg-red-500', 'bg-gold-400', 'bg-blue-400', 'bg-green-400'][passStrength];

  if (loading) {
    return (
      <DashboardLayout title="Settings" subtitle="Manage your account">
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-2xl mx-auto">
        {/* Tab nav */}
        <div className="flex gap-1 mb-6 card-dark p-1 rounded-2xl w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-all ${
                tab === key ? 'bg-purple-gradient text-white shadow-purple' : 'text-purple-400 hover:text-white'
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── PROFILE TAB ── */}
          {tab === 'profile' && (
            <motion.div key="profile"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <form onSubmit={saveProfile} className="card-dark p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-purple-gradient flex items-center justify-center flex-shrink-0 ring-2 ring-purple-500/30">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-3xl text-white">
                          {profile?.fullname?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <p className="text-white font-display font-bold text-lg">{profile?.fullname}</p>
                    <p className="text-purple-400 text-sm capitalize mt-0.5">{profile?.role}</p>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="mt-2 text-xs text-purple-400 hover:text-gold-400 transition-colors font-display flex items-center gap-1.5">
                      <Camera size={12} /> Change photo
                    </button>
                    {avatarPrev && (
                      <button type="button" onClick={() => { setAvatarPrev(null); setAvatarFile(null); }}
                        className="mt-1 text-xs text-red-400 hover:text-red-300 transition-colors font-display flex items-center gap-1">
                        <X size={11} /> Remove new photo
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label-input">Full Name *</label>
                    <input value={pForm.fullname} onChange={e => setPForm(p => ({ ...p, fullname: e.target.value }))}
                      placeholder="Your full name" className="input-dark" />
                  </div>

                  <div>
                    <label className="label-input">
                      <Mail size={11} className="inline mr-1" /> Email
                    </label>
                    <input value={profile?.email || ''} disabled
                      className="input-dark opacity-50 cursor-not-allowed" />
                    <p className="text-purple-600 text-xs mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="label-input">
                      <Phone size={11} className="inline mr-1" /> Phone
                    </label>
                    <input value={pForm.phone} onChange={e => setPForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+250 7XX XXX XXX" className="input-dark" />
                  </div>

                  {profile?.role === 'client' && (
                    <div>
                      <label className="label-input">Client Type</label>
                      <select value={pForm.client_type} onChange={e => setPForm(p => ({ ...p, client_type: e.target.value }))} className="input-dark">
                        <option value="">Select...</option>
                        {['artist','student','intern','event_planner','other'].map(t => (
                          <option key={t} value={t}>{t.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="label-input">Bio</label>
                    <textarea value={pForm.bio} onChange={e => setPForm(p => ({ ...p, bio: e.target.value }))}
                      rows={3} placeholder="Tell us about yourself..."
                      className="input-dark resize-none text-sm" />
                  </div>
                </div>

                {/* Read-only info */}
                <div className="p-4 rounded-xl bg-dark-800/40 border border-purple-900/20 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-purple-500 text-xs font-display uppercase tracking-wider">Role</p>
                    <p className="text-white font-display font-semibold capitalize mt-0.5">{profile?.role}</p>
                  </div>
                  <div>
                    <p className="text-purple-500 text-xs font-display uppercase tracking-wider">Member Since</p>
                    <p className="text-white font-display font-semibold mt-0.5">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>

                <button type="submit" disabled={saving} className="btn-gold w-full justify-center py-3">
                  {saving
                    ? <div className="w-5 h-5 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                    : <><Save size={16} /> Save Changes</>
                  }
                </button>
              </form>
            </motion.div>
          )}

          {/* ── SECURITY TAB ── */}
          {tab === 'security' && (
            <motion.div key="security"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <form onSubmit={changePassword} className="card-dark p-6 space-y-5">
                <div>
                  <h3 className="font-display font-bold text-white text-lg mb-1">Change Password</h3>
                  <p className="text-purple-400 text-sm">Use a strong, unique password to keep your account safe.</p>
                </div>

                {[
                  { key: 'current', label: 'Current Password', field: 'current_password' },
                  { key: 'new',     label: 'New Password',     field: 'new_password' },
                  { key: 'confirm', label: 'Confirm New Password', field: 'confirm_password' },
                ].map(({ key, label, field }) => (
                  <div key={key}>
                    <label className="label-input">{label}</label>
                    <div className="relative">
                      <input
                        type={showPass[key] ? 'text' : 'password'}
                        value={sForm[field]}
                        onChange={e => {
                          setSForm(p => ({ ...p, [field]: e.target.value }));
                          if (field === 'new_password') setPassStrength(calcStrength(e.target.value));
                        }}
                        placeholder={label}
                        className="input-dark pr-11"
                      />
                      <button type="button"
                        onClick={() => setShowPass(p => ({ ...p, [key]: !p[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-300 transition-colors">
                        {showPass[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {field === 'new_password' && sForm.new_password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passStrength ? strengthColor : 'bg-dark-800'}`} />
                          ))}
                        </div>
                        <p className={`text-xs font-display font-semibold ${strengthColor.replace('bg-', 'text-')}`}>
                          {strengthLabel}
                        </p>
                      </div>
                    )}
                    {field === 'confirm_password' && sForm.confirm_password && (
                      <p className={`text-xs mt-1 font-display ${sForm.new_password === sForm.confirm_password ? 'text-green-400' : 'text-red-400'}`}>
                        {sForm.new_password === sForm.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>
                ))}

                <div className="p-3 rounded-xl bg-purple-900/10 border border-purple-800/20">
                  <p className="text-purple-400 text-xs font-display font-semibold mb-1">Password requirements:</p>
                  {[
                    ['At least 8 characters',         sForm.new_password.length >= 8],
                    ['One uppercase letter',           /[A-Z]/.test(sForm.new_password)],
                    ['One number',                     /[0-9]/.test(sForm.new_password)],
                    ['One special character',          /[^A-Za-z0-9]/.test(sForm.new_password)],
                  ].map(([text, met]) => (
                    <div key={text} className={`flex items-center gap-2 text-xs mt-1 ${met ? 'text-green-400' : 'text-purple-600'}`}>
                      <Check size={11} className={met ? 'opacity-100' : 'opacity-30'} />
                      {text}
                    </div>
                  ))}
                </div>

                <button type="submit" disabled={saving} className="btn-gold w-full justify-center py-3">
                  {saving
                    ? <div className="w-5 h-5 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                    : <><Lock size={16} /> Update Password</>
                  }
                </button>
              </form>

              {/* Danger zone */}
              <div className="card-dark p-5 mt-4 border-red-500/20">
                <h3 className="font-display font-bold text-red-400 mb-3 flex items-center gap-2">
                  <Shield size={16} /> Session
                </h3>
                <p className="text-purple-400 text-sm mb-4">Sign out of your account on this device.</p>
                <button onClick={logout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-display font-semibold text-sm transition-all">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </motion.div>
          )}

          {/* ── NOTIFICATIONS PREFS TAB ── */}
          {tab === 'notifs' && (
            <motion.div key="notifs"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="card-dark p-6 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-white text-lg mb-1">Notification Preferences</h3>
                  <p className="text-purple-400 text-sm">Control which notifications you receive.</p>
                </div>
                {[
                  { label: 'Task assignments & updates',  sub: 'When a project or task is assigned or updated', def: true },
                  { label: 'Messages',                   sub: 'New direct messages from team members', def: true },
                  { label: 'Project completions',        sub: 'When a project status changes to completed', def: true },
                  { label: 'New partner requests',       sub: 'Incoming partnership enquiries (manager only)', def: user?.role === 'manager' },
                  { label: 'System announcements',       sub: 'Important platform updates and news', def: true },
                ].map(({ label, sub, def }) => (
                  <NotifToggle key={label} label={label} sub={sub} defaultOn={def} />
                ))}
                <p className="text-purple-600 text-xs pt-2 border-t border-purple-900/20">
                  Note: Notification preferences are stored locally on this device.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function NotifToggle({ label, sub, defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-purple-900/20 last:border-0">
      <div>
        <p className="text-white font-display font-semibold text-sm">{label}</p>
        <p className="text-purple-500 text-xs mt-0.5">{sub}</p>
      </div>
      <button onClick={() => setOn(p => !p)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-purple-gradient' : 'bg-dark-800 border border-purple-800'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
