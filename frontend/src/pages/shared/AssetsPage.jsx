import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileAudio, FileVideo, FileText, Image, Download, Trash2, Edit2,
  RotateCcw, Upload, X, Check, AlertTriangle, ShieldAlert,
  History, Play, Share2, Music2, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AssetPlayer from '../../components/common/AssetPlayer';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const BASE_URL = 'https://delightmusicstudio.onrender.com';
const FILE_TYPES = ['audio','video','document','image'];

const typeIcon  = (t) => ({ audio: FileAudio, video: FileVideo, document: FileText, image: Image }[t] || Music2);
const typeColor = (t) => ({ audio: 'text-purple-400 bg-purple-500/10', video: 'text-blue-400 bg-blue-500/10', document: 'text-gold-400 bg-gold-500/10', image: 'text-green-400 bg-green-500/10' }[t] || 'text-purple-400 bg-purple-500/10');

const canPlay   = (t) => ['audio','video'].includes(t);
const canView   = (t) => ['image'].includes(t);

export default function AssetsPage({ projectId: propProjectId, inModal = false }) {
  const { user } = useAuth();
  const isManager  = user?.role === 'manager';
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
  const [confirm,    setConfirm]    = useState(null);
  const [player,     setPlayer]     = useState(null); // asset to play/view

  // Load project list
  useEffect(() => {
    if (propProjectId) return;
    const ep = isManager ? '/manager/dashboard' : '/producer/tasks';
    api.get(ep).then(r => {
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

  const saveEdit = async (id) => {
    try {
      await api.put(`/assets/${id}`, editForm);
      toast.success('Updated');
      setEditingId(null);
      loadAssets();
    } catch { toast.error('Update failed'); }
  };

  const softDelete = async (id) => {
    try {
      await api.delete(`/assets/${id}`);
      toast.success('Deleted');
      setConfirm(null);
      loadAssets();
    } catch { toast.error('Delete failed'); }
  };

  const restore = async (id) => {
    try {
      await api.put(`/assets/${id}/restore`);
      toast.success('Restored!');
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

  const handleShare = async (asset) => {
    const url = asset.file_url.startsWith('http') ? asset.file_url : `${BASE_URL}${asset.file_url}`;
    if (navigator.share) {
      try { await navigator.share({ title: asset.original_name || 'Asset', url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success('Link copied!');
  };

  const playableAssets = assets.filter(a => !a.is_deleted && (canPlay(a.file_type) || canView(a.file_type)));
  const displayed = showDeleted ? assets : assets.filter(a => !a.is_deleted);

  const inner = (
    <div className="space-y-4">
      {/* Project selector */}
      {!propProjectId && projects.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-40">
            <label className="label-input">Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input-dark">
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          {isManager && assets.filter(a => a.is_deleted).length > 0 && (
            <button onClick={() => setShowDeleted(p => !p)}
              className={`mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-display font-semibold transition-all ${
                showDeleted ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-purple-800/40 text-purple-400 hover:text-white'
              }`}>
              <History size={14} />
              {showDeleted ? 'Hide' : 'Show'} Deleted ({assets.filter(a=>a.is_deleted).length})
            </button>
          )}
        </div>
      )}

      {/* Upload form (producer + manager) */}
      {(isProducer || isManager) && projectId && (
        <div className="card-dark p-4">
          <p className="text-purple-400 text-xs font-display uppercase tracking-widest mb-3">Upload Asset</p>
          <form onSubmit={uploadAsset} className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-48">
              <input type="file" accept="audio/*,video/*,.pdf,.doc,.docx,.jpg,.png,.jpeg"
                onChange={e => {
                  const f = e.target.files[0];
                  setFile(f);
                  if (!f) return;
                  if (f.type.startsWith('audio')) setFileType('audio');
                  else if (f.type.startsWith('video')) setFileType('video');
                  else if (f.type.startsWith('image')) setFileType('image');
                  else setFileType('document');
                }}
                className="input-dark file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-xs cursor-pointer text-sm" />
            </div>
            <div className="w-28">
              <select value={fileType} onChange={e => setFileType(e.target.value)} className="input-dark text-sm">
                {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button type="submit" disabled={uploading || !file} className="btn-gold text-sm px-4 py-2.5">
              {uploading
                ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                : <><Upload size={14} /> Upload</>
              }
            </button>
          </form>
        </div>
      )}

      {/* Asset grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-purple-500">
          <Music2 size={36} className="mx-auto mb-2 opacity-30" />
          <p className="font-display text-sm">No assets yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((asset, i) => {
            const Icon = typeIcon(asset.file_type);
            const color = typeColor(asset.file_type);
            const filename = asset.original_name || asset.file_url.split('/').pop();
            const canEditThis = isManager || (isProducer && asset.uploaded_by === user?.id && !asset.is_deleted);
            const canDeleteThis = isManager || (isProducer && asset.uploaded_by === user?.id && !asset.is_deleted);
            const playable = canPlay(asset.file_type) || canView(asset.file_type);

            return (
              <motion.div key={asset.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`p-3 rounded-xl border transition-all group ${
                  asset.is_deleted
                    ? 'border-red-500/20 bg-red-500/5 opacity-60'
                    : 'card-dark hover:border-purple-600/40'
                }`}>
                <div className="flex items-center gap-3">
                  {/* Type icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={16} />
                  </div>

                  {/* Image preview thumbnail */}
                  {asset.file_type === 'image' && !asset.is_deleted && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-dark-800 border border-purple-900/20">
                      <img
                        src={asset.file_url.startsWith('http') ? asset.file_url : `${BASE_URL}${asset.file_url}`}
                        alt="" className="w-full h-full object-cover"
                        onError={e => { e.target.parentElement.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Edit inline */}
                  {editingId === asset.id ? (
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <input value={editForm.original_name}
                        onChange={e => setEditForm(p => ({ ...p, original_name: e.target.value }))}
                        className="input-dark flex-1 py-1.5 text-sm min-w-32" autoFocus />
                      <select value={editForm.file_type}
                        onChange={e => setEditForm(p => ({ ...p, file_type: e.target.value }))}
                        className="input-dark w-24 py-1.5 text-sm">
                        {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button onClick={() => saveEdit(asset.id)} className="p-2 text-green-400 hover:text-green-300"><Check size={15} /></button>
                      <button onClick={() => setEditingId(null)} className="p-2 text-purple-400 hover:text-white"><X size={15} /></button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className={`font-display font-semibold text-sm truncate ${asset.is_deleted ? 'line-through text-red-300' : 'text-white'}`}>
                        {filename}
                      </p>
                      <p className="text-purple-500 text-xs capitalize mt-0.5">
                        {asset.file_type} · {asset.uploader_name}
                        {asset.is_deleted && ` · deleted by ${asset.deleted_by_name}`}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {editingId !== asset.id && (
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      {/* Play/View */}
                      {playable && !asset.is_deleted && (
                        <button
                          onClick={() => setPlayer(asset)}
                          className={`p-1.5 rounded-lg transition-all ${
                            canPlay(asset.file_type)
                              ? 'text-purple-400 hover:text-white hover:bg-purple-500/20'
                              : 'text-green-400 hover:text-white hover:bg-green-500/20'
                          }`}
                          title={canPlay(asset.file_type) ? 'Play' : 'View'}>
                          {canPlay(asset.file_type) ? <Play size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                      {/* Download */}
                      {!asset.is_deleted && (
                        <a href={asset.file_url.startsWith('http') ? asset.file_url : `${BASE_URL}${asset.file_url}`}
                          download target="_blank" rel="noreferrer"
                          className="p-1.5 text-purple-400 hover:text-gold-400 transition-colors" title="Download">
                          <Download size={14} />
                        </a>
                      )}
                      {/* Share */}
                      {!asset.is_deleted && (
                        <button onClick={() => handleShare(asset)}
                          className="p-1.5 text-purple-400 hover:text-blue-400 transition-colors" title="Share">
                          <Share2 size={14} />
                        </button>
                      )}
                      {/* Edit */}
                      {canEditThis && (
                        <button onClick={() => { setEditingId(asset.id); setEditForm({ original_name: filename, file_type: asset.file_type }); }}
                          className="p-1.5 text-purple-400 hover:text-white transition-colors" title="Rename">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {/* Restore */}
                      {asset.is_deleted && isManager && (
                        <button onClick={() => restore(asset.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs font-display font-semibold transition-all">
                          <RotateCcw size={11} /> Restore
                        </button>
                      )}
                      {/* Soft delete */}
                      {canDeleteThis && !asset.is_deleted && (
                        <button onClick={() => setConfirm({ type: 'soft', id: asset.id })}
                          className="p-1.5 text-purple-600 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                      {/* Hard delete */}
                      {asset.is_deleted && isManager && (
                        <button onClick={() => setConfirm({ type: 'hard', id: asset.id })}
                          className="p-1.5 text-red-700 hover:text-red-400 transition-colors" title="Permanent delete">
                          <ShieldAlert size={14} />
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

      {/* Delete Confirmation */}
      <AnimatePresence>
        {confirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirm(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative glass p-6 w-full max-w-sm text-center">
              <AlertTriangle size={32} className={`mx-auto mb-3 ${confirm.type === 'hard' ? 'text-red-400' : 'text-gold-400'}`} />
              <h3 className="font-display font-bold text-white text-lg mb-2">
                {confirm.type === 'hard' ? 'Permanently Delete?' : 'Delete Asset?'}
              </h3>
              <p className="text-purple-400 text-sm mb-5">
                {confirm.type === 'hard'
                  ? 'This cannot be undone. The file will be gone forever.'
                  : isManager ? 'Asset will be soft-deleted. You can restore it.' : 'Asset will be removed from this project.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirm(null)} className="btn-outline flex-1 justify-center text-sm py-2">Cancel</button>
                <button
                  onClick={() => confirm.type === 'hard' ? hardDelete(confirm.id) : softDelete(confirm.id)}
                  className={`flex-1 py-2 rounded-xl font-display font-bold flex items-center gap-2 justify-center text-sm transition-all ${
                    confirm.type === 'hard'
                      ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                      : 'bg-gold-500/20 border border-gold-500/40 text-gold-400 hover:bg-gold-500/30'
                  }`}>
                  <Trash2 size={14} />
                  {confirm.type === 'hard' ? 'Delete Forever' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Asset Player */}
      {player && (
        <AssetPlayer
          asset={player}
          allAssets={playableAssets}
          onClose={() => setPlayer(null)}
        />
      )}
    </div>
  );

  if (inModal) return inner;
  return (
    <DashboardLayout title="Asset Management" subtitle="Upload, play, manage and share project files">
      {inner}
    </DashboardLayout>
  );
}
