import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileAudio, FileVideo, FileText, Image, Download, Trash2, Edit2,
  RotateCcw, Upload, X, Check, AlertTriangle, ShieldAlert, History,
  Eye, EyeOff, Music2
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const FILE_TYPES = ['audio', 'video', 'document', 'image'];

const typeIcon = (t) => ({ audio: FileAudio, video: FileVideo, document: FileText, image: Image }[t] || Music2);
const typeColor = (t) => ({ audio: 'text-purple-400 bg-purple-500/10', video: 'text-blue-400 bg-blue-500/10', document: 'text-gold-400 bg-gold-500/10', image: 'text-green-400 bg-green-500/10' }[t] || 'text-purple-400 bg-purple-500/10');

export default function AssetsPage({ projectId: propProjectId, inModal = false }) {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const isProducer = user?.role === 'producer';

  const [projects,   setProjects]   = useState([]);
  const [projectId,  setProjectId]  = useState(propProjectId || '');
  const [assets,     setAssets]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [editForm,   setEditForm]   = useState({ original_name: '', file_type: 'audio' });
  const [showDeleted,setShowDeleted]= useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [file,       setFile]       = useState(null);
  const [fileType,   setFileType]   = useState('audio');
  const [confirm,    setConfirm]    = useState(null); // { type: 'delete'|'hard', id }

  // Load projects list (for selector)
  useEffect(() => {
    if (propProjectId) return;
    const endpoint = isManager ? '/manager/dashboard' : '/producer/tasks';
    api.get(endpoint).then(r => {
      const list = isManager ? (r.data.recent_projects || []) : r.data;
      setProjects(list);
      if (list.length > 0) setProjectId(String(list[0].id));
    }).catch(() => {});
  }, [isManager, propProjectId]);

  const loadAssets = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.get(`/assets/project/${projectId}`);
      setAssets(res.data);
    } catch { toast.error('Failed to load assets'); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const uploadAsset = async (e) => {
    e.preventDefault();
    if (!file || !projectId) { toast.error('Select file and project'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('project_id', projectId);
      fd.append('file_type', fileType);
      await api.post('/producer/upload-asset', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Asset uploaded!');
      setFile(null);
      loadAssets();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const startEdit = (asset) => {
    setEditingId(asset.id);
    setEditForm({ original_name: asset.original_name || asset.file_url.split('/').pop(), file_type: asset.file_type });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/assets/${id}`, editForm);
      toast.success('Asset updated');
      setEditingId(null);
      loadAssets();
    } catch { toast.error('Update failed'); }
  };

  const softDelete = async (id) => {
    try {
      await api.delete(`/assets/${id}`);
      toast.success('Asset deleted');
      setConfirm(null);
      loadAssets();
    } catch { toast.error('Delete failed'); }
  };

  const restore = async (id) => {
    try {
      await api.put(`/assets/${id}/restore`);
      toast.success('Asset restored!');
      loadAssets();
    } catch { toast.error('Restore failed'); }
  };

  const hardDelete = async (id) => {
    try {
      await api.delete(`/assets/${id}/hard`);
      toast.success('Permanently deleted');
      setConfirm(null);
      loadAssets();
    } catch { toast.error('Failed'); }
  };

  const active  = assets.filter(a => !a.is_deleted);
  const deleted = assets.filter(a => a.is_deleted);
  const displayed = showDeleted ? assets : active;

  const layout = inModal ? 'space-y-5' : '';

  const inner = (
    <div className={`space-y-5 ${layout}`}>
      {/* Project selector (only when not injected as prop) */}
      {!propProjectId && projects.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="label-input">Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input-dark">
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          {isManager && deleted.length > 0 && (
            <button onClick={() => setShowDeleted(p => !p)}
              className={`mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-display font-semibold transition-all ${
                showDeleted ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-purple-800/40 text-purple-400 hover:text-white'
              }`}>
              <History size={15} />
              {showDeleted ? 'Hide' : 'Show'} Deleted ({deleted.length})
            </button>
          )}
        </div>
      )}

      {/* Upload (producer or manager can upload) */}
      {(isProducer || isManager) && projectId && (
        <div className="card-dark p-4">
          <p className="text-purple-400 text-xs font-display uppercase tracking-widest mb-3">Upload New Asset</p>
          <form onSubmit={uploadAsset} className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-48">
              <label className="label-input">File</label>
              <input type="file" accept="audio/*,video/*,.pdf,.doc,.docx,.jpg,.png"
                onChange={e => {
                  const f = e.target.files[0];
                  setFile(f);
                  if (f?.type.startsWith('audio')) setFileType('audio');
                  else if (f?.type.startsWith('video')) setFileType('video');
                  else if (f?.type.startsWith('image')) setFileType('image');
                  else setFileType('document');
                }}
                className="input-dark file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-xs cursor-pointer" />
            </div>
            <div>
              <label className="label-input">Type</label>
              <select value={fileType} onChange={e => setFileType(e.target.value)} className="input-dark">
                {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button type="submit" disabled={uploading || !file} className="btn-gold text-sm px-4 py-2.5">
              {uploading ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : <><Upload size={15} /> Upload</>}
            </button>
          </form>
        </div>
      )}

      {/* Assets list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-purple-500">
          <Music2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-display">{active.length === 0 ? 'No assets uploaded yet' : 'No deleted assets'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((asset, i) => {
            const Icon = typeIcon(asset.file_type);
            const colorClass = typeColor(asset.file_type);
            const filename = asset.original_name || asset.file_url.split('/').pop();
            const canEdit = isManager || (isProducer && asset.uploaded_by === user?.id && !asset.is_deleted);
            const canDelete = isManager || (isProducer && asset.uploaded_by === user?.id && !asset.is_deleted);

            return (
              <motion.div key={asset.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`p-4 rounded-xl border transition-all ${
                  asset.is_deleted
                    ? 'border-red-500/20 bg-red-500/5 opacity-70'
                    : 'card-dark hover:border-purple-600/40'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon size={18} />
                  </div>

                  {editingId === asset.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input value={editForm.original_name}
                        onChange={e => setEditForm(p => ({ ...p, original_name: e.target.value }))}
                        className="input-dark flex-1 py-1.5 text-sm" autoFocus />
                      <select value={editForm.file_type}
                        onChange={e => setEditForm(p => ({ ...p, file_type: e.target.value }))}
                        className="input-dark w-28 py-1.5 text-sm">
                        {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button onClick={() => saveEdit(asset.id)} className="p-2 text-green-400 hover:text-green-300">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2 text-purple-400 hover:text-white">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className={`font-display font-semibold text-sm truncate ${asset.is_deleted ? 'line-through text-red-300' : 'text-white'}`}>
                        {filename}
                      </p>
                      <div className="flex items-center gap-3 text-xs mt-0.5">
                        <span className="text-purple-400 capitalize">{asset.file_type}</span>
                        <span className="text-purple-500">by {asset.uploader_name}</span>
                        {asset.is_deleted && (
                          <span className="text-red-400">Deleted by {asset.deleted_by_name} · {new Date(asset.deleted_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {editingId !== asset.id && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!asset.is_deleted && (
                        <a href={`https://delightmusicstudio.onrender.com${asset.file_url}`}
                          download target="_blank" rel="noreferrer"
                          className="p-2 text-purple-400 hover:text-gold-400 transition-colors" title="Download">
                          <Download size={15} />
                        </a>
                      )}
                      {canEdit && !asset.is_deleted && (
                        <button onClick={() => startEdit(asset)}
                          className="p-2 text-purple-400 hover:text-white transition-colors" title="Edit">
                          <Edit2 size={15} />
                        </button>
                      )}
                      {asset.is_deleted && isManager && (
                        <button onClick={() => restore(asset.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs font-display font-semibold transition-all">
                          <RotateCcw size={13} /> Restore
                        </button>
                      )}
                      {canDelete && !asset.is_deleted && (
                        <button onClick={() => setConfirm({ type: 'soft', id: asset.id })}
                          className="p-2 text-purple-500 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      )}
                      {asset.is_deleted && isManager && (
                        <button onClick={() => setConfirm({ type: 'hard', id: asset.id })}
                          className="p-2 text-red-600 hover:text-red-400 transition-colors" title="Permanently delete">
                          <ShieldAlert size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirm(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative glass p-6 w-full max-w-sm text-center">
              <AlertTriangle size={36} className={`mx-auto mb-3 ${confirm.type === 'hard' ? 'text-red-400' : 'text-gold-400'}`} />
              <h3 className="font-display font-bold text-white text-lg mb-2">
                {confirm.type === 'hard' ? 'Permanently Delete?' : 'Delete Asset?'}
              </h3>
              <p className="text-purple-400 text-sm mb-5">
                {confirm.type === 'hard'
                  ? 'This action cannot be undone. The file will be permanently removed.'
                  : isManager
                    ? 'The asset will be soft-deleted. You can restore it later.'
                    : 'The asset will be deleted from this project.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirm(null)} className="btn-outline flex-1 justify-center text-sm py-2">
                  Cancel
                </button>
                <button
                  onClick={() => confirm.type === 'hard' ? hardDelete(confirm.id) : softDelete(confirm.id)}
                  className={`flex-1 justify-center text-sm py-2 rounded-xl font-display font-bold flex items-center gap-2 transition-all ${
                    confirm.type === 'hard'
                      ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                      : 'bg-gold-500/20 border border-gold-500/40 text-gold-400 hover:bg-gold-500/30'
                  }`}>
                  <Trash2 size={15} />
                  {confirm.type === 'hard' ? 'Delete Forever' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  if (inModal) return inner;

  return (
    <DashboardLayout title="Asset Management" subtitle="Manage project files and assets">
      {inner}
    </DashboardLayout>
  );
}
