import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Plus, Edit2, Trash2, X, Check, Eye, EyeOff, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const EMPTY = { client_name: '', message: '', rating: 5, is_approved: true };

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-125">
          <Star size={22}
            className={s <= (hovered || value) ? 'text-gold-400' : 'text-purple-700'}
            fill={s <= (hovered || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
      <span className="ml-2 text-gold-400 text-sm font-semibold self-center">
        {['','Poor','Fair','Good','Great','Excellent'][value]}
      </span>
    </div>
  );
}

export default function ManagerTestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [delId,    setDelId]    = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/manager/testimonials')
      .then(r => setTestimonials(r.data))
      .catch(() => toast.error('Failed to load testimonials'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ client_name: t.client_name, message: t.message, rating: t.rating, is_approved: t.is_approved });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim() || !form.message.trim()) {
      toast.error('Name and message are required'); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/manager/testimonials/${editing.id}`, form);
        toast.success('Testimonial updated!');
      } else {
        await api.post('/manager/testimonials', form);
        toast.success('Testimonial added!');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/manager/testimonials/${id}`);
      toast.success('Deleted');
      setDelId(null);
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const toggleApproved = async (t) => {
    try {
      await api.put(`/manager/testimonials/${t.id}`, { is_approved: !t.is_approved });
      setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, is_approved: !x.is_approved } : x));
    } catch { toast.error('Failed'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <DashboardLayout title="Testimonials" subtitle="Manage client testimonials shown on the public website">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-3 text-sm text-purple-400">
          <span>{testimonials.length} total</span>
          <span>·</span>
          <span className="text-green-400">{testimonials.filter(t => t.is_approved).length} visible</span>
          <span>·</span>
          <span className="text-purple-500">{testimonials.filter(t => !t.is_approved).length} hidden</span>
        </div>
        <button onClick={openNew} className="btn-gold text-sm px-5 py-2.5">
          <Plus size={16} /> Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-24 text-purple-500">
          <MessageSquare size={56} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-xl text-purple-400">No testimonials yet</p>
          <p className="text-sm mt-2 text-purple-600 mb-6">Add placeholder testimonials to display on the homepage.</p>
          <button onClick={openNew} className="btn-gold mx-auto">
            <Plus size={16} /> Add First Testimonial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`card-dark p-5 transition-all ${!t.is_approved ? 'opacity-60' : 'hover:border-purple-600/40'}`}>
              {/* Stars */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={13}
                      className={s <= t.rating ? 'text-gold-400' : 'text-purple-700'}
                      fill={s <= t.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  t.is_approved ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {t.is_approved ? 'Visible' : 'Hidden'}
                </span>
              </div>

              {/* Message */}
              <p className="text-purple-200 text-sm leading-relaxed mb-4 line-clamp-4">
                "{t.message}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-2 pt-3 border-t border-purple-900/20 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-gradient flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {t.client_name[0].toUpperCase()}
                </div>
                <span className="text-white font-semibold text-sm">{t.client_name}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => toggleApproved(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    t.is_approved
                      ? 'border-purple-800/40 text-purple-400 hover:bg-purple-800/20'
                      : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                  }`}>
                  {t.is_approved ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                </button>
                <button onClick={() => openEdit(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-purple-800/40 text-purple-400 hover:text-white hover:bg-purple-800/20 text-xs font-semibold transition-all">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => setDelId(t.id)}
                  className="px-3 py-1.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-dark-900 border border-purple-800/40 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                  <MessageSquare size={18} className="text-gold-400" />
                  {editing ? 'Edit Testimonial' : 'Add Testimonial'}
                </h3>
                <button onClick={() => setModal(false)} className="text-purple-400 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="label-input">Client Name *</label>
                  <input value={form.client_name} onChange={e => f('client_name', e.target.value)}
                    placeholder="e.g. Jean Paul Habimana" className="input-dark" />
                </div>
                <div>
                  <label className="label-input">Testimonial Message *</label>
                  <textarea value={form.message} onChange={e => f('message', e.target.value)}
                    rows={4} placeholder="What the client said about Delight Music Studio..."
                    className="input-dark resize-none text-sm" />
                </div>
                <div>
                  <label className="label-input">Rating</label>
                  <StarPicker value={form.rating} onChange={v => f('rating', v)} />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/60 border border-purple-900/20">
                  <input type="checkbox" id="approved" checked={form.is_approved}
                    onChange={e => f('is_approved', e.target.checked)}
                    className="w-4 h-4 accent-purple-500" />
                  <label htmlFor="approved" className="text-purple-300 text-sm cursor-pointer">
                    Show on public website
                  </label>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1 justify-center text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-gold flex-1 justify-center text-sm">
                    {saving
                      ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                      : <><Check size={15} /> {editing ? 'Update' : 'Add'}</>
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {delId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDelId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="relative bg-dark-900 border border-purple-800/40 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
              <Trash2 size={32} className="text-red-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Delete Testimonial?</h3>
              <p className="text-purple-400 text-sm mb-5">This will permanently remove the testimonial from the website.</p>
              <div className="flex gap-3">
                <button onClick={() => setDelId(null)} className="btn-outline flex-1 justify-center text-sm py-2">Cancel</button>
                <button onClick={() => handleDelete(delId)}
                  className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 font-semibold text-sm transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
