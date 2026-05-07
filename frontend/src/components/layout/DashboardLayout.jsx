import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import NotificationBell from '../common/NotificationBell';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = 'https://delightmusicstudio.onrender.com';

const DashboardLayout = ({ children, title, subtitle }) => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);
  const [profile, setProfile]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('dm_user') || '{}'); } catch { return {}; }
  });

  // Listen for profile updates
  useEffect(() => {
    const h = () => {
      try { setProfile(JSON.parse(localStorage.getItem('dm_user') || '{}')); } catch {}
    };
    window.addEventListener('dm_profile_updated', h);
    return () => window.removeEventListener('dm_profile_updated', h);
  }, []);

  const avatarSrc = profile?.avatar_url ? `${BASE_URL}${profile.avatar_url}` : null;
  const initials  = (profile?.fullname || user?.fullname || '?')[0]?.toUpperCase();

  return (
    <div className="flex min-h-screen bg-dark-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <DashboardSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSideOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden flex">
              <DashboardSidebar mobile onClose={() => setSideOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="bg-dark-950/95 backdrop-blur-md border-b border-purple-900/30 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 gap-3">
          {/* Mobile menu button */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSideOpen(true)}
              className="lg:hidden p-2 rounded-xl text-purple-400 hover:text-white hover:bg-purple-800/30 transition-all flex-shrink-0">
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-base sm:text-xl text-white leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-purple-300 mt-0.5 hidden sm:block truncate">{subtitle}</p>}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationBell />
            <button
              onClick={() => navigate(`/dashboard/${user?.role}/settings`)}
              className="p-2 rounded-xl bg-dark-800 border border-purple-800/40 text-purple-400 hover:text-white hover:border-purple-600 transition-all hidden sm:flex">
              <Settings size={16} />
            </button>
            <button
              onClick={() => navigate(`/dashboard/${user?.role}/settings`)}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-purple-900/20 border border-purple-800/30 hover:border-purple-600/50 transition-all">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-purple-gradient flex items-center justify-center font-display font-bold text-white text-sm flex-shrink-0">
                {avatarSrc
                  ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                  : initials}
              </div>
              <span className="text-white text-sm font-display font-semibold hidden md:block max-w-28 truncate">
                {profile?.fullname || user?.fullname}
              </span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;
