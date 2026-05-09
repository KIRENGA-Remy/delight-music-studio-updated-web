import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Plus, X, Users, Calendar, Edit2, Trash2,
  Star, FileAudio, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProgressBar from '../../components/common/ProgressBar';
import { SlidersHorizontal } from 'lucide-react';
import RatingWidget from '../../components/common/RatingWidget';
import AssetsPage from '../shared/AssetsPage';
import api from '../../services/api';

const FADE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const statusColor = (s) => ({ pending: 'border-gold-500/30 bg-gold-500/5', in_progress: 'border-purple-500/30 bg-purple-500/5', completed: 'border-green-500/30 bg-green-500/5', cancelled: 'border-red-500/30 bg-red-500/5' }[s] || 'border-purple-900/20');
const statusDot   = (s) => ({ pending: 'bg-gold-400', in_progress: 'bg-purple-400', completed: 'bg-green-400', cancelled: 'bg-red-400' }[s] || 'bg-gold-400');
const COLS = [{ key: 'pending', label: 'Pending' }, { key: 'in_progress', label: 'In Progress' }, { key: 'completed', label: 'Completed' }];

const EMPTY = { client_id: '', producer_id: '', title: '', description: '', price: '', deadline: '' };

export default function ManagerPipelinePage() {
  const [projects,  setProjects]  = useState([]);
  const [clients,   setClients]   = useState([]);
  const [producers, setProducers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [delConfirm,setDelConfirm]= useState(null);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [editForm,  setEditForm]  = useState(EMPTY);
  const [expanded,  setExpanded]  = useState({});
  const [assetsFor, setAssetsFor] = useState(null);
  const [progEdit,  setProgEdit]  = useState({});

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, u] = await Promise.all([api.get('/manager/dashboard'), api.get('/manager/users')]);
      const projs = d.data.recent_projects || [];
      setProjects(projs);
      const initProg = {};
      projs.forEach(p => { initProg[p.id] = p.progress_percentage || 0; });
      setProgEdit(initProg);
      setClients(u.data.filter(u => u.role === 'client'));
      setProducers(u.data.filter(u => u.role === 'producer'));
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const saveProgress = async (id) => {
    const pct = Number(progEdit[id] || 0);
    try {
      await api.put(`/manager/projects/${id}`, { progress_percentage: pct, status: pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'pending' });
      toast.success('Progress saved');
      setProjects(prev => prev.map(p => p.id === id ? { ...p, progress_percentage: pct } : p));
    } catch { toast.error('Failed'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.client_id || !form.title) { toast.error('Client and title required'); return; }
    setSaving(true);
    try {
      await api.post('/manager/projects', { ...form, price: form.price || null, deadline: form.deadline || null, producer_id: form.producer_id || null });
      toast.success('Project created!');
      setModal(false); setForm(EMPTY); fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/manager/projects/${editModal.id}`, { ...editForm, price: editForm.price || null, deadline: editForm.deadline || null, producer_id: editForm.producer_id || null });
      toast.success('Project updated!');
      setEditModal(null); fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/manager/projects/${id}`);
      toast.success('Project deleted');
      setDelConfirm(null); fetchAll();
    } catch { toast.error('Failed'); }
  };

  const openEdit = (p) => {
    setEditForm({ client_id: p.client_id || '', producer_id: p.producer_id || '', title: p.title, description: p.description || '', price: p.price || '', deadline: p.deadline ? p.deadline.substring(0,10) : '', status: p.status });
    setEditModal(p);
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <DashboardLayout title="Pipeline" subtitle="Manage and track all studio projects">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3 text-sm text-purple-400 font-display">
          <span>{projects.length} total</span>·
          <span className="text-purple-300">{projects.filter(p=>p.status==='in_progress').length} active</span>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold text-sm px-5 py-2.5">
          <Plus size={18} /> New Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COLS.map(({ key, label }) => {
            const cols = projects.filter(p => p.status === key);
            return (
              <div key={key} className="card-dark p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${statusDot(key)}`} />
                  <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">{label}</h3>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 font-display font-bold">{cols.length}</span>
                </div>
                <div className="space-y-3">
                  {cols.length === 0 && (
                    <div className="text-center py-8 text-purple-600 text-sm font-display">No {label.toLowerCase()} projects</div>
                  )}
                  {cols.map((p, i) => (
                    <motion.div key={p.id} {...FADE} transition={{ delay: i * 0.04 }}
                      className={`p-4 rounded-xl border ${statusColor(p.status)} transition-all`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-white font-display font-bold text-sm leading-tight">{p.title}</h4>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => toggleExpand(p.id)} className="p-1 text-purple-500 hover:text-purple-300 transition-colors">
                            {expanded[p.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1 text-purple-400 hover:text-white transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setDelConfirm(p.id)} className="p-1 text-purple-600 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-purple-400 mb-1">
                        <Users size={11} /> {p.client_name}
                      </div>
                      {p.producer_name && p.producer_name !== 'Unassigned' && (
                        <p className="text-purple-500 text-xs mb-1">Producer: {p.producer_name}</p>
                      )}
                      {p.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gold-400 mb-2">
                          <Calendar size={11} /> {new Date(p.deadline).toLocaleDateString()}
                        </div>
                      )}
                      <ProgressBar value={progEdit[p.id] ?? p.progress_percentage ?? 0} size="sm" />
                      {p.price && <p className="text-green-400 text-xs mt-1.5 font-semibold">{Number(p.price).toLocaleString()} RWF</p>}

                      <AnimatePresence>
                        {expanded[p.id] && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="mt-3 pt-3 border-t border-purple-900/20 space-y-3">
                              {/* Progress slider */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-purple-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1"><SlidersHorizontal size={10}/> Progress</p>
                                  <div className="flex items-center gap-1">
                                    <input type="number" min={0} max={100}
                                      value={progEdit[p.id] ?? 0}
                                      onChange={e => setProgEdit(prev => ({...prev, [p.id]: Math.min(100,Math.max(0,Number(e.target.value)))}))}
                                      className="w-12 text-center bg-dark-800 border border-purple-800/50 rounded px-1 py-0.5 text-white text-xs focus:outline-none focus:border-purple-500" />
                                    <span className="text-purple-500 text-xs">%</span>
                                  </div>
                                </div>
                                <input type="range" min={0} max={100} step={5}
                                  value={progEdit[p.id] ?? 0}
                                  onChange={e => setProgEdit(prev => ({...prev, [p.id]: Number(e.target.value)}))}
                                  className="w-full accent-purple-500 cursor-pointer h-1" />
                                <button onClick={() => saveProgress(p.id)}
                                  className="mt-1.5 w-full py-1 text-xs rounded-lg bg-purple-gradient text-white font-medium transition-all hover:opacity-90">
                                  Save Progress
                                </button>
                              </div>
                              {/* Rating widget */}
                              <RatingWidget projectId={p.id} projectTitle={p.title} />
                              {/* Assets quick access */}
                              <button onClick={() => setAssetsFor(p.id === assetsFor ? null : p.id)}
                                className="w-full flex items-center gap-2 text-xs text-purple-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg border border-purple-900/20 hover:border-purple-700/40">
                                <FileAudio size={12} />
                                {assetsFor === p.id ? 'Hide' : 'Manage'} Assets
                              </button>
                              {assetsFor === p.id && (
                                <div className="mt-2">
                                  <AssetsPage projectId={String(p.id)} inModal />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg glass p-7 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <FolderKanban size={22} className="text-gold-400" /> New Project
              </h3>
              <button onClick={() => setModal(false)} className="text-purple-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label-input">Project Title *</label>
                <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Album Recording" className="input-dark" />
              </div>
              <div>
                <label className="label-input">Description</label>
                <textarea value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} rows={3} className="input-dark resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-input">Client *</label>
                  <select value={form.client_id} onChange={e => setForm(p=>({...p,client_id:e.target.value}))} className="input-dark">
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.fullname}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-input">Assign Producer</label>
                  <select value={form.producer_id} onChange={e => setForm(p=>({...p,producer_id:e.target.value}))} className="input-dark">
                    <option value="">Unassigned</option>
                    {producers.map(pr => <option key={pr.id} value={pr.id}>{pr.fullname}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-input">Price (RWF)</label>
                  <input type="number" value={form.price} onChange={e => setForm(p=>({...p,price:e.target.value}))} placeholder="50000" className="input-dark" />
                </div>
                <div>
                  <label className="label-input">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(p=>({...p,deadline:e.target.value}))} className="input-dark" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-gold flex-1 justify-center">
                  {saving ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : <><Plus size={18} /> Create</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditModal(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg glass p-7 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <Edit2 size={20} className="text-purple-400" /> Edit Project
              </h3>
              <button onClick={() => setEditModal(null)} className="text-purple-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="label-input">Title</label>
                <input value={editForm.title} onChange={e => setEditForm(p=>({...p,title:e.target.value}))} className="input-dark" />
              </div>
              <div>
                <label className="label-input">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p=>({...p,description:e.target.value}))} rows={3} className="input-dark resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-input">Client</label>
                  <select value={editForm.client_id} onChange={e => setEditForm(p=>({...p,client_id:e.target.value}))} className="input-dark">
                    {clients.map(c => <option key={c.id} value={c.id}>{c.fullname}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-input">Producer</label>
                  <select value={editForm.producer_id} onChange={e => setEditForm(p=>({...p,producer_id:e.target.value}))} className="input-dark">
                    <option value="">Unassigned</option>
                    {producers.map(pr => <option key={pr.id} value={pr.id}>{pr.fullname}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-input">Price (RWF)</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm(p=>({...p,price:e.target.value}))} className="input-dark" />
                </div>
                <div>
                  <label className="label-input">Deadline</label>
                  <input type="date" value={editForm.deadline} onChange={e => setEditForm(p=>({...p,deadline:e.target.value}))} className="input-dark" />
                </div>
              </div>
              <div>
                <label className="label-input">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(p=>({...p,status:e.target.value}))} className="input-dark">
                  {['pending','in_progress','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(null)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-gold flex-1 justify-center">
                  {saving ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : 'Update'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete confirmation */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDelConfirm(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="relative glass p-6 text-center w-full max-w-sm">
            <AlertTriangle size={36} className="text-red-400 mx-auto mb-3" />
            <h3 className="font-display font-bold text-white mb-2">Delete Project?</h3>
            <p className="text-purple-400 text-sm mb-5">This will permanently delete the project and all its associated data.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)} className="btn-outline flex-1 justify-center text-sm py-2">Cancel</button>
              <button onClick={() => handleDelete(delConfirm)} className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-sm font-display font-bold flex items-center gap-2 justify-center transition-all">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
