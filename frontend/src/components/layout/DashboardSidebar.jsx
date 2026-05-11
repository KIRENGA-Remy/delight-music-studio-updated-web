import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Music, LayoutDashboard, Users, FolderKanban, DollarSign,
  Award, Calendar, Upload, MessageSquare, LogOut, ChevronLeft,
  ChevronRight, Globe, FileAudio, Bell, Settings, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

const BASE_URL = 'https://delightmusicstudio.onrender.com';

const MANAGER_NAV = [
  { to: '/dashboard/manager',              label: 'Overview',         icon: LayoutDashboard },
  { to: '/dashboard/manager/leads',        label: 'Partner Requests', icon: Users },
  { to: '/dashboard/manager/pipeline',     label: 'Pipeline',         icon: FolderKanban },
  { to: '/dashboard/manager/assets',       label: 'Assets',           icon: FileAudio },
  { to: '/dashboard/manager/financials',   label: 'Financials',       icon: DollarSign },
  { to: '/dashboard/manager/certificates', label: 'Certificates',     icon: Award },
  { to: '/dashboard/manager/calendar',     label: 'Calendar',         icon: Calendar },
  { to: '/dashboard/manager/notifications',label: 'Notifications',    icon: Bell,           badge: 'notif' },
  { to: '/dashboard/manager/messages',     label: 'Messages',         icon: MessageSquare,  badge: 'msg' },
  { to: '/dashboard/manager/testimonials', label: 'Testimonials',     icon: Star },
  { to: '/dashboard/manager/content',      label: 'Public Content',   icon: Globe },
];

const PRODUCER_NAV = [
  { to: '/dashboard/producer',             label: 'Overview',      icon: LayoutDashboard },
  { to: '/dashboard/producer/tasks',       label: 'My Tasks',      icon: FolderKanban },
  { to: '/dashboard/producer/assets',      label: 'Assets',        icon: FileAudio },
  { to: '/dashboard/producer/upload',      label: 'Upload',        icon: Upload },
  { to: '/dashboard/producer/earnings',    label: 'Earnings',      icon: DollarSign },
  { to: '/dashboard/producer/notifications',label:'Notifications', icon: Bell,           badge: 'notif' },
  { to: '/dashboard/producer/messages',    label: 'Messages',      icon: MessageSquare,  badge: 'msg' },
  { to: '/dashboard/producer/calendar',    label: 'Calendar',      icon: Calendar },
];

const CLIENT_NAV = [
  { to: '/dashboard/client',               label: 'Overview',      icon: LayoutDashboard },
  { to: '/dashboard/client/projects',      label: 'My Projects',   icon: FolderKanban },
  { to: '/dashboard/client/vault',         label: 'File Vault',    icon: Upload },
  { to: '/dashboard/client/certificates',  label: 'Certificates',  icon: Award },
  { to: '/dashboard/client/notifications', label: 'Notifications', icon: Bell,           badge: 'notif' },
  { to: '/dashboard/client/messages',      label: 'Messages',      icon: MessageSquare,  badge: 'msg' },
  { to: '/dashboard/client/calendar',      label: 'Calendar',      icon: Calendar },
];

export default function DashboardSidebar({ mobile = false, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadMsg,  setUnreadMsg]  = useState(0);
  const [unreadNotif,setUnreadNotif]= useState(0);
  const [profile,    setProfile]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('dm_user') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    const h = () => {
      try { setProfile(JSON.parse(localStorage.getItem('dm_user') || '{}')); } catch {}
    };
    window.addEventListener('dm_profile_updated', h);
    return () => window.removeEventListener('dm_profile_updated', h);
  }, []);

  useEffect(() => {
    const load = () => {
      api.get('/messages/unread-count').then(r => setUnreadMsg(r.data.count)).catch(() => {});
      api.get('/notifications/unread-count').then(r => setUnreadNotif(r.data.count)).catch(() => {});
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const nav = user?.role === 'manager' ? MANAGER_NAV
    : user?.role === 'producer' ? PRODUCER_NAV : CLIENT_NAV;

  const roleColor = { manager: 'text-gold-400', producer: 'text-purple-300', client: 'text-green-400' }[user?.role] || 'text-purple-300';

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  const getBadgeCount = (badge) => badge === 'msg' ? unreadMsg : unreadNotif;
  const avatarSrc = profile?.avatar_url ? `${BASE_URL}${profile.avatar_url}` : null;

  // On mobile: always expanded; on desktop: collapsible
  const isCollapsed = !mobile && collapsed;

  return (
    <aside className={`
      ${isCollapsed ? 'w-16' : 'w-60'}
      bg-dark-950 border-r border-purple-900/30 min-h-screen flex flex-col
      transition-all duration-300 flex-shrink-0
      ${mobile ? 'w-72 shadow-2xl' : ''}
    `}>
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} py-4 border-b border-purple-900/30`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-gradient flex items-center justify-center flex-shrink-0">
              <Music size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-white text-lg leading-none">Delight</p>
              <p className="text-gold-400 text-[9px] font-display tracking-widest">MUSIC STUDIO</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          {mobile && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-purple-400 hover:text-white transition-all">
              <X size={16} />
            </button>
          )}
          {!mobile && (
            <button onClick={() => setCollapsed(p => !p)}
              className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-800/30 transition-all">
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* User info */}
      {!isCollapsed && (
        <button
          onClick={() => { navigate(`/dashboard/${user?.role}/settings`); onClose?.(); }}
          className="mx-3 mt-3 p-3 rounded-xl bg-purple-900/20 border border-purple-800/30 hover:border-purple-600/50 transition-all text-left group">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-gradient flex items-center justify-center font-display font-bold text-white text-sm flex-shrink-0">
              {avatarSrc
                ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                : (profile?.fullname || user?.fullname || '?')[0]?.toUpperCase()
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-white text-sm truncate group-hover:text-gold-400 transition-colors">
                {profile?.fullname || user?.fullname}
              </p>
              <p className={`text-[9px] font-display font-bold uppercase tracking-wider ${roleColor}`}>{user?.role}</p>
            </div>
            <Settings size={12} className="text-purple-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </div>
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, badge }) => {
          const count = badge ? getBadgeCount(badge) : 0;
          return (
            <NavLink key={to} to={to} end
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-medium text-sm transition-all cursor-pointer ${
                  isActive ? 'text-white bg-purple-gradient shadow-purple' : 'text-purple-300 hover:text-white hover:bg-purple-800/30'
                } ${isCollapsed ? 'justify-center px-2' : ''}`
              }
              title={isCollapsed ? label : undefined}>
              <div className="relative flex-shrink-0">
                <Icon size={17} />
                {count > 0 && isCollapsed && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold-500 text-dark-950 text-[8px] font-bold flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-gold-500 text-dark-950 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 pt-2 border-t border-purple-900/30 space-y-1">
        <NavLink to={`/dashboard/${user?.role}/settings`} end onClick={() => onClose?.()}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-medium text-sm transition-all ${
              isActive ? 'text-white bg-purple-gradient' : 'text-purple-400 hover:text-white hover:bg-purple-800/30'
            } ${isCollapsed ? 'justify-center' : ''}`
          }
          title={isCollapsed ? 'Settings' : undefined}>
          <Settings size={16} className="flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
        <button onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Logout' : undefined}>
          <LogOut size={16} className="flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
