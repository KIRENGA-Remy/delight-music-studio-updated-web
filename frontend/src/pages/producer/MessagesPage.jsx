import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Bell, Clock, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

export default function ProducerMessagesPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/producer/notifications')
      .then(r => setNotifications(r.data))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => api.put(`/notifications/${n.id}/read`).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All marked as read');
  };

  const typeColors = {
    lead: 'text-blue-400 bg-blue-500/10',
    task_update: 'text-purple-400 bg-purple-500/10',
    question: 'text-gold-400 bg-gold-500/10',
    report: 'text-green-400 bg-green-500/10',
    approval: 'text-green-400 bg-green-500/10',
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardLayout title="Messages" subtitle="Notifications and updates from the studio">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="badge-purple">{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-outline text-sm py-2 px-4">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-24 text-purple-500">
          <MessageSquare size={64} className="mx-auto mb-4 opacity-20" />
          <p className="font-display font-bold text-xl text-purple-400">No messages yet</p>
          <p className="text-sm mt-2 text-purple-600">You'll receive notifications here when the manager sends updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <motion.div key={n.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`card-dark p-4 transition-all cursor-pointer hover:border-purple-600/40 ${
                !n.is_read ? 'border-purple-500/30 bg-purple-900/10' : ''
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[n.type] || 'text-purple-400 bg-purple-500/10'}`}>
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-purple-400 text-xs font-display font-semibold capitalize">{n.type?.replace('_', ' ')} · {n.sender_name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                      <span className="text-purple-500 text-xs flex items-center gap-1">
                        <Clock size={11} /> {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed ${n.is_read ? 'text-purple-300' : 'text-white font-medium'}`}>
                    {n.message}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
