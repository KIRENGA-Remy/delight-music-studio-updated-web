import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BellOff, CheckCheck, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TYPE_COLORS = {
  lead: 'bg-blue-500/20 text-blue-400',
  task_update: 'bg-purple-500/20 text-purple-400',
  question: 'bg-gold-500/20 text-gold-400',
  report: 'bg-green-500/20 text-green-400',
  approval: 'bg-green-500/20 text-green-400',
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [notifs, setNotifs]   = useState([]);
  const [open,   setOpen]     = useState(false);
  const ref = useRef();

  const load = useCallback(() => {
    if (!user) return;
    api.get('/notifications').then(r => setNotifs(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const markRead = async (id, e) => {
    e?.stopPropagation();
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const deleteOne = async (id, e) => {
    e?.stopPropagation();
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifs(p => p.filter(n => n.id !== id));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifs(p => p.map(n => ({ ...n, is_read: true })));
  };

  const goToAll = () => {
    setOpen(false);
    navigate(`/dashboard/${user?.role}/notifications`);
  };

  const unread = notifs.filter(n => !n.is_read).length;
  const recent = notifs.slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="relative p-2 rounded-xl bg-dark-800 border border-purple-800/40 text-purple-300 hover:text-white hover:border-purple-600 transition-all">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full text-dark-950 text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-dark-900 border border-purple-800/40 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-purple-900/30 flex items-center justify-between">
            <span className="font-display font-bold text-white">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <>
                  <span className="badge-gold">{unread}</span>
                  <button onClick={markAllRead} title="Mark all read"
                    className="p-1 text-purple-400 hover:text-green-400 transition-colors">
                    <CheckCheck size={14} />
                  </button>
                </>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-purple-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="py-10 text-center text-purple-500">
                <BellOff size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-display">No notifications</p>
              </div>
            ) : recent.map(n => (
              <div key={n.id}
                onClick={() => markRead(n.id)}
                className={`group px-4 py-3 border-b border-purple-900/20 cursor-pointer hover:bg-purple-900/10 transition-colors ${!n.is_read ? 'bg-purple-900/10' : ''}`}>
                <div className="flex items-start gap-3">
                  {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-gold-400 mt-2 flex-shrink-0" />}
                  <div className={`flex-1 ${n.is_read ? 'pl-3' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-display font-bold uppercase px-1.5 py-0.5 rounded-md ${TYPE_COLORS[n.type] || TYPE_COLORS.task_update}`}>
                        {n.type?.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => deleteOne(n.id, e)}
                          className="p-0.5 text-purple-600 hover:text-red-400 transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <span className="text-purple-600 text-[10px] ml-auto">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className={`text-sm mt-1 leading-snug ${!n.is_read ? 'text-white' : 'text-purple-200'}`}>
                      {n.message}
                    </p>
                    {n.sender_name && (
                      <p className="text-purple-500 text-xs mt-0.5">{n.sender_name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <button onClick={goToAll}
            className="w-full px-4 py-3 text-center text-purple-400 hover:text-white font-display font-semibold text-sm transition-colors hover:bg-purple-900/20 border-t border-purple-900/30">
            View all notifications →
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
