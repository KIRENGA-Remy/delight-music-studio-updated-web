import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, CheckCheck, Trash2, Send, Plus, X,
  Users, RefreshCw, Info, AlertCircle, CheckCircle, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TYPE_CONFIG = {
  lead:        { icon: Zap,          color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Lead' },
  task_update: { icon: CheckCircle,  color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Task Update' },
  question:    { icon: Info,         color: 'text-gold-400',   bg: 'bg-gold-500/10',   label: 'Question' },
  report:      { icon: AlertCircle,  color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Report' },
  approval:    { icon: CheckCheck,   color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Approval' },
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [notifs,   setNotifs]   = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [modal,    setModal]    = useState(false);
  const [sending,  setSending]  = useState(false);
  const [form,     setForm]     = useState({
    receiver_id: '', message: '', type: 'task_update',
    broadcast: false, broadcast_role: ''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [n, c] = await Promise.all([
        api.get('/notifications'),
        api.get('/messages/contacts'),
      ]);
      setNotifs(n.data);
      setContacts(c.data);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifs(p => p.map(n => ({ ...n, is_read: true })));
    toast.success('All marked as read');
  };

  const deleteOne = async (id) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifs(p => p.filter(n => n.id !== id));
    toast.success('Removed');
  };

  const deleteAll = async () => {
    await api.delete('/notifications/all').catch(() => {});
    setNotifs([]);
    toast.success('All cleared');
  };

  const sendNotif = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) { toast.error('Write a message'); return; }
    if (!form.broadcast && !form.receiver_id) { toast.error('Select a recipient'); return; }
    setSending(true);
    try {
      if (form.broadcast && isManager) {
        await api.post('/notifications/broadcast', {
          message: form.message,
          type: form.type,
          role: form.broadcast_role || undefined,
        });
        toast.success('Broadcast sent!');
      } else {
        await api.post('/notifications/send', {
          receiver_id: form.receiver_id,
          message: form.message,
          type: form.type,
        });
        toast.success('Notification sent!');
      }
      setModal(false);
      setForm({ receiver_id: '', message: '', type: 'task_update', broadcast: false, broadcast_role: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send');
    } finally { setSending(false); }
  };

  const unread   = notifs.filter(n => !n.is_read).length;
  const filtered = filter === 'all'   ? notifs
    : filter === 'unread' ? notifs.filter(n => !n.is_read)
    : notifs.filter(n => n.type === filter);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <DashboardLayout title="Notifications" subtitle="System alerts, updates and messages">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all','unread','task_update','question','approval','lead','report'].map(k => {
            const count = k === 'all' ? notifs.length : k === 'unread' ? unread : notifs.filter(n => n.type === k).length;
            return (
              <button key={k} onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-xl font-display font-semibold text-xs capitalize transition-all ${
                  filter === k ? 'bg-purple-gradient text-white' : 'card-dark text-purple-400 hover:text-white'
                }`}>
                {k.replace('_', ' ')} {count > 0 && <span className="opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-purple-400 hover:text-white transition-colors card-dark rounded-xl">
            <RefreshCw size={15} />
          </button>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-outline text-xs py-2 px-3">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button onClick={deleteAll} className="text-xs px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1.5 font-display font-semibold">
              <Trash2 size={14} /> Clear all
            </button>
          )}
          <button onClick={() => setModal(true)} className="btn-gold text-sm px-4 py-2">
            <Plus size={15} /> Send
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-purple-500">
          <BellOff size={56} className="mx-auto mb-4 opacity-20" />
          <p className="font-display font-bold text-xl text-purple-400">
            {filter === 'unread' ? 'All caught up!' : 'No notifications'}
          </p>
          <p className="text-sm mt-2 text-purple-600">
            {filter === 'unread' ? 'No unread notifications.' : 'Notifications will appear here when received.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.task_update;
            const Icon = cfg.icon;
            return (
              <motion.div key={n.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  !n.is_read
                    ? 'border-purple-500/30 bg-purple-900/10 hover:bg-purple-900/20'
                    : 'card-dark hover:border-purple-700/40'
                }`}>
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={18} className={cfg.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />}
                    <span className={`text-xs font-display font-bold uppercase tracking-wider ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {n.sender_name && (
                      <span className="text-purple-500 text-xs">from {n.sender_name}</span>
                    )}
                    <span className="text-purple-600 text-xs ml-auto">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-white' : 'text-purple-200'}`}>
                    {n.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.is_read && (
                    <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      className="p-1.5 text-purple-400 hover:text-green-400 transition-colors" title="Mark read">
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}
                    className="p-1.5 text-purple-500 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Send Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md glass p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
                  <Bell size={18} className="text-gold-400" />
                  Send Notification
                </h3>
                <button onClick={() => setModal(false)} className="text-purple-400 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={sendNotif} className="space-y-4">
                {/* Broadcast toggle (manager only) */}
                {isManager && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/60 border border-purple-900/20">
                    <input type="checkbox" id="broadcast" checked={form.broadcast}
                      onChange={e => f('broadcast', e.target.checked)}
                      className="w-4 h-4 accent-purple-500" />
                    <label htmlFor="broadcast" className="text-purple-300 text-sm font-display cursor-pointer">
                      Broadcast to all users
                    </label>
                  </div>
                )}

                {/* Recipient or broadcast role */}
                {!form.broadcast ? (
                  <div>
                    <label className="label-input">Recipient *</label>
                    <select value={form.receiver_id} onChange={e => f('receiver_id', e.target.value)} className="input-dark">
                      <option value="">Select recipient...</option>
                      {Object.entries(
                        contacts.reduce((acc, c) => { (acc[c.role] = acc[c.role] || []).push(c); return acc; }, {})
                      ).map(([role, users]) => (
                        <optgroup key={role} label={role.charAt(0).toUpperCase() + role.slice(1) + 's'}>
                          {users.map(u => <option key={u.id} value={u.id}>{u.fullname}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="label-input">Target Role (blank = everyone)</label>
                    <select value={form.broadcast_role} onChange={e => f('broadcast_role', e.target.value)} className="input-dark">
                      <option value="">All users</option>
                      <option value="producer">All Producers</option>
                      <option value="client">All Clients</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="label-input">Type</label>
                  <select value={form.type} onChange={e => f('type', e.target.value)} className="input-dark">
                    <option value="task_update">Task Update</option>
                    <option value="question">Question</option>
                    <option value="approval">Approval</option>
                    <option value="report">Report</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div>
                  <label className="label-input">Message *</label>
                  <textarea value={form.message} onChange={e => f('message', e.target.value)}
                    rows={4} placeholder="Write your notification message..."
                    className="input-dark resize-none text-sm" />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1 justify-center text-sm py-2.5">
                    Cancel
                  </button>
                  <button type="submit" disabled={sending} className="btn-gold flex-1 justify-center text-sm">
                    {sending
                      ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                      : <><Send size={15} /> {form.broadcast ? 'Broadcast' : 'Send'}</>
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
