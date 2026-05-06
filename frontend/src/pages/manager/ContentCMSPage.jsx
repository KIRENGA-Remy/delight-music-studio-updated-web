import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Plus, Edit2, Trash2, Eye, EyeOff, Image, Video,
  Type, AlignLeft, LayoutGrid, X, Check, ArrowUp, ArrowDown,
  ExternalLink, Monitor, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const SECTIONS = [
  { key: 'hero',     label: 'Hero Section',    icon: Sparkles,    color: 'text-gold-400' },
  { key: 'gallery',  label: 'Gallery',         icon: Image,       color: 'text-blue-400' },
  { key: 'services', label: 'Services',        icon: LayoutGrid,  color: 'text-purple-400' },
  { key: 'about',    label: 'About',           icon: Type,        color: 'text-green-400' },
  { key: 'stats',    label: 'Stats / Numbers', icon: AlignLeft,   color: 'text-pink-400' },
];

const sectionColor = (s) => ({
  hero:    'border-gold-500/30 bg-gold-500/5',
  gallery: 'border-blue-500/30 bg-blue-500/5',
  services:'border-purple-500/30 bg-purple-500/5',
  about:   'border-green-500/30 bg-green-500/5',
  stats:   'border-pink-500/30 bg-pink-500/5',
}[s] || 'border-purple-900/20');

const EMPTY_FORM = { section: 'gallery', title: '', subtitle: '', body: '', image_url: '', video_url: '', sort_order: 0 };

export default function ContentCMSPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null); // null = new
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [file,    setFile]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [filter,  setFilter]  = useState('all');
  const [delConfirm, setDelConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/manager/content');
      setItems(res.data);
    } catch { toast.error('Failed to load content'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      section:    item.section,
      title:      item.title || '',
      subtitle:   item.subtitle || '',
      body:       item.body || '',
      image_url:  item.image_url || '',
      video_url:  item.video_url || '',
      sort_order: item.sort_order || 0,
    });
    setFile(null);
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.section) { toast.error('Section is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (file) fd.append('image', file);
      if (editing) {
        await api.put(`/manager/content/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Content updated!');
      } else {
        await api.post('/manager/content', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Content created!');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const toggle = async (id) => {
    try {
      await api.put(`/manager/content/${id}/toggle`);
      setItems(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    } catch { toast.error('Failed'); }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/manager/content/${id}`);
      toast.success('Deleted');
      setItems(prev => prev.filter(item => item.id !== id));
      setDelConfirm(null);
    } catch { toast.error('Failed to delete'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = filter === 'all' ? items : items.filter(i => i.section === filter);
  const grouped = SECTIONS.reduce((acc, s) => {
    acc[s.key] = filtered.filter(i => i.section === s.key);
    return acc;
  }, {});

  return (
    <DashboardLayout title="Public Content CMS" subtitle="Manage content visible on your public website">
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-display font-semibold text-sm transition-all ${
              filter === 'all' ? 'bg-purple-gradient text-white' : 'card-dark text-purple-300 hover:text-white'
            }`}>All ({items.length})</button>
          {SECTIONS.map(({ key, label }) => {
            const count = items.filter(i => i.section === key).length;
            return (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl font-display font-semibold text-sm transition-all ${
                  filter === key ? 'bg-purple-gradient text-white' : 'card-dark text-purple-300 hover:text-white'
                }`}>{label} {count > 0 && `(${count})`}</button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <a href="/" target="_blank" rel="noreferrer"
            className="btn-outline text-sm py-2 px-4">
            <ExternalLink size={15} /> Preview Site
          </a>
          <button onClick={openNew} className="btn-gold text-sm px-5 py-2.5">
            <Plus size={17} /> Add Content
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 text-purple-500">
          <Globe size={64} className="mx-auto mb-4 opacity-20" />
          <p className="font-display font-bold text-xl text-purple-400">No content yet</p>
          <p className="text-sm mt-2 text-purple-600 mb-6">Start adding content blocks to customize your public website.</p>
          <button onClick={openNew} className="btn-gold mx-auto">
            <Plus size={18} /> Add First Content Block
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {SECTIONS.map(({ key, label, icon: Icon, color }) => {
            const sectionItems = grouped[key];
            if (sectionItems.length === 0 && filter !== 'all' && filter !== key) return null;
            if (sectionItems.length === 0) return null;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={18} className={color} />
                  <h3 className="font-display font-bold text-white">{label}</h3>
                  <span className="badge-purple ml-1">{sectionItems.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sectionItems.map((item, i) => (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`rounded-2xl border p-4 transition-all ${sectionColor(item.section)} ${!item.is_active ? 'opacity-50' : ''}`}>

                      {/* Image preview */}
                      {item.image_url && (
                        <div className="h-32 rounded-xl overflow-hidden mb-3 bg-dark-800/60">
                          <img src={item.image_url.startsWith('/uploads') ? `https://delightmusicstudio.onrender.com${item.image_url}` : item.image_url}
                            alt={item.title || ''}
                            className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          {item.title && <p className="text-white font-display font-bold text-sm truncate">{item.title}</p>}
                          {item.subtitle && <p className="text-purple-400 text-xs mt-0.5 line-clamp-1">{item.subtitle}</p>}
                          {item.body && !item.title && (
                            <p className="text-purple-300 text-xs line-clamp-2">{item.body}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => toggle(item.id)} title={item.is_active ? 'Hide' : 'Show'}
                            className={`p-1.5 rounded-lg transition-all ${item.is_active ? 'text-green-400 hover:text-green-300' : 'text-purple-600 hover:text-purple-400'}`}>
                            {item.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg text-purple-400 hover:text-white transition-all">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDelConfirm(item.id)}
                            className="p-1.5 rounded-lg text-purple-600 hover:text-red-400 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-purple-600 mt-2">
                        <span>Order: {item.sort_order}</span>
                        {item.video_url && <span className="flex items-center gap-1"><Video size={10} /> Has video</span>}
                        <span className={`ml-auto font-semibold ${item.is_active ? 'text-green-500' : 'text-red-500'}`}>
                          {item.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-xl glass p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                  <Globe size={20} className="text-gold-400" />
                  {editing ? 'Edit Content' : 'Add Content Block'}
                </h3>
                <button onClick={() => setModal(false)} className="text-purple-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-input">Section *</label>
                    <select value={form.section} onChange={e => f('section', e.target.value)} className="input-dark">
                      {SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-input">Sort Order</label>
                    <input type="number" value={form.sort_order} onChange={e => f('sort_order', e.target.value)}
                      className="input-dark" />
                  </div>
                </div>
                <div>
                  <label className="label-input">Title</label>
                  <input value={form.title} onChange={e => f('title', e.target.value)}
                    placeholder="e.g. Professional Audio Production" className="input-dark" />
                </div>
                <div>
                  <label className="label-input">Subtitle</label>
                  <input value={form.subtitle} onChange={e => f('subtitle', e.target.value)}
                    placeholder="Short description line" className="input-dark" />
                </div>
                <div>
                  <label className="label-input">Body / Description</label>
                  <textarea value={form.body} onChange={e => f('body', e.target.value)}
                    rows={3} placeholder="Longer description or content..." className="input-dark resize-none" />
                </div>
                <div>
                  <label className="label-input">Image Upload</label>
                  <input type="file" accept="image/*"
                    onChange={e => setFile(e.target.files[0])}
                    className="input-dark file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-xs cursor-pointer" />
                </div>
                <div>
                  <label className="label-input">Or Image URL</label>
                  <input value={form.image_url} onChange={e => f('image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg" className="input-dark" />
                </div>
                <div>
                  <label className="label-input">Video URL (optional)</label>
                  <input value={form.video_url} onChange={e => f('video_url', e.target.value)}
                    placeholder="https://youtube.com/..." className="input-dark" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-gold flex-1 justify-center">
                    {saving ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : <><Check size={16} /> {editing ? 'Update' : 'Create'}</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {delConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDelConfirm(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="relative glass p-6 text-center w-full max-w-sm">
              <Trash2 size={32} className="text-red-400 mx-auto mb-3" />
              <h3 className="font-display font-bold text-white mb-2">Delete this content?</h3>
              <p className="text-purple-400 text-sm mb-5">This will permanently remove the content block from your public site.</p>
              <div className="flex gap-3">
                <button onClick={() => setDelConfirm(null)} className="btn-outline flex-1 justify-center text-sm py-2">Cancel</button>
                <button onClick={() => deleteItem(delConfirm)} className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-sm font-display font-bold flex items-center gap-2 justify-center transition-all">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
