import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Music, LayoutDashboard, Users, FolderKanban, Bell, DollarSign,
  Award, Calendar, Upload, MessageSquare, LogOut, ChevronLeft,
  ChevronRight, Globe, FileAudio, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import toast from 'react-hot-toast';
import api from '../../services/api';

const MANAGER_NAV = [
  { to: '/dashboard/manager',              label: 'Overview',         icon: LayoutDashboard },
  { to: '/dashboard/manager/leads',        label: 'Partner Requests', icon: Users },
  { to: '/dashboard/manager/pipeline',     label: 'Pipeline',         icon: FolderKanban },
  { to: '/dashboard/manager/assets',       label: 'Assets',           icon: FileAudio },
  { to: '/dashboard/manager/financials',   label: 'Financials',       icon: DollarSign },
  { to: '/dashboard/manager/certificates', label: 'Certificates',     icon: Award },
  { to: '/dashboard/manager/calendar',     label: 'Calendar',         icon: Calendar },
  { to: '/dashboard/manager/messages',     label: 'Messages',         icon: MessageSquare, badge: true },
  { to: '/dashboard/manager/content',      label: 'Public Content',   icon: Globe },
];

const PRODUCER_NAV = [
  { to: '/dashboard/producer',           label: 'Overview',  icon: LayoutDashboard },
  { to: '/dashboard/producer/tasks',     label: 'My Tasks',  icon: FolderKanban },
  { to: '/dashboard/producer/assets',    label: 'Assets',    icon: FileAudio },
  { to: '/dashboard/producer/upload',    label: 'Upload',    icon: Upload },
  { to: '/dashboard/producer/earnings',  label: 'Earnings',  icon: DollarSign },
  { to: '/dashboard/producer/messages',  label: 'Messages',  icon: MessageSquare, badge: true },
  { to: '/dashboard/producer/calendar',  label: 'Calendar',  icon: Calendar },
];

const CLIENT_NAV = [
  { to: '/dashboard/client',              label: 'Overview',     icon: LayoutDashboard },
  { to: '/dashboard/client/projects',     label: 'My Projects',  icon: FolderKanban },
  { to: '/dashboard/client/vault',        label: 'File Vault',   icon: Upload },
  { to: '/dashboard/client/certificates', label: 'Certificates', icon: Award },
  { to: '/dashboard/client/messages',     label: 'Messages',     icon: MessageSquare, badge: true },
  { to: '/dashboard/client/calendar',     label: 'Calendar',     icon: Calendar },
];

const DashboardSidebar = () => {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unread,    setUnread]    = useState(0);

  useEffect(() => {
    const load = () => {
      api.get('/messages/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const navItems = user?.role === 'manager' ? MANAGER_NAV
    : user?.role === 'producer' ? PRODUCER_NAV : CLIENT_NAV;

  const roleColor = user?.role === 'manager' ? 'text-gold-400'
    : user?.role === 'producer' ? 'text-purple-300' : 'text-green-400';

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-dark-950 border-r border-purple-900/30 min-h-screen flex flex-col transition-all duration-300 flex-shrink-0`}>
      {/* Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-5 border-b border-purple-900/30`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-gradient flex items-center justify-center">
              <Music size={24} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-xl leading-none">Delight</p>
              <p className="text-gold-400 text-[10px] font-display tracking-wider">MUSIC STUDIO</p>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(p => !p)}
          className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-800/30 transition-all">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-purple-900/20 border border-purple-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-gradient flex items-center justify-center font-display font-bold text-white text-md flex-shrink-0">
              {user?.fullname?.[0]}
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-white text-md truncate">{user?.fullname}</p>
              <p className={`text-[10px] font-display font-bold uppercase tracking-wider ${roleColor}`}>{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} end
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? label : undefined}>
            <div className="relative flex-shrink-0">
              <Icon size={17} />
              {badge && unread > 0 && collapsed && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold-500 text-dark-950 text-[8px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            {!collapsed && (
              <>
                <span className="flex-1">{label}</span>
                {badge && unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-gold-500 text-dark-950 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className={`px-2 pb-4 pt-2 border-t border-purple-900/30 space-y-1`}>
        {!collapsed && (
          <div className="px-3 pb-2">
            <NotificationBell />
          </div>
        )}
        <button onClick={handleLogout}
          className={`nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}>
          <LogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
