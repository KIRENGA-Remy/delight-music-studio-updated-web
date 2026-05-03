import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [open,   setOpen]   = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!user) return;
    const endpoint = user.role === 'manager' ? '/manager/notifications'
      : user.role === 'producer' ? '/producer/notifications'
      : '/client/notifications';
    api.get(endpoint).then(r => setNotifs(r.data)).catch(() => {});
    const interval = setInterval(() => {
      api.get(endpoint).then(r => setNotifs(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.is_read).length;

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(p => !p)}
        className="relative p-2 rounded-xl bg-dark-800 border border-purple-800/40 text-purple-300 hover:text-white hover:border-purple-600 transition-all">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full text-dark-950 text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-dark-900 border border-purple-800/40 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-purple-900/40 flex items-center justify-between">
            <span className="font-display font-bold text-white text-md">Notifications</span>
            {unread > 0 && <span className="badge-gold">{unread} new</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-center text-purple-400 text-md py-8">No notifications yet</p>
            ) : notifs.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)}
                className={`px-4 py-3 border-b border-purple-900/20 cursor-pointer hover:bg-purple-900/10 transition-colors ${!n.is_read ? 'bg-purple-900/10' : ''}`}>
                <div className="flex items-start gap-3">
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-gold-400 mt-1.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="text-md text-white leading-snug">{n.message}</p>
                    <p className="text-sm text-purple-400 mt-1">{n.sender_name} · {new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
