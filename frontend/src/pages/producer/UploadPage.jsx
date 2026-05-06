import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Music2, FileAudio, FileVideo, FileText, CheckCircle, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

export default function ProducerUploadPage() {
  const [tasks,     setTasks]     = useState([]);
  const [file,      setFile]      = useState(null);
  const [fileType,  setFileType]  = useState('audio');
  const [projectId, setProjectId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploads,   setUploads]   = useState([]);
  const [dragOver,  setDragOver]  = useState(false);

  useEffect(() => {
    api.get('/producer/tasks')
      .then(r => {
        setTasks(r.data);
        if (r.data.length > 0) setProjectId(String(r.data[0].id));
      })
      .catch(() => toast.error('Failed to load projects'));
  }, []);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('audio')) setFileType('audio');
    else if (f.type.startsWith('video')) setFileType('video');
    else if (f.type.startsWith('image')) setFileType('image');
    else setFileType('document');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    if (!projectId) { toast.error('Please select a project'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('project_id', projectId);
      fd.append('file_type', fileType);
      await api.post('/producer/upload-asset', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Asset uploaded successfully!');
      const project = tasks.find(t => String(t.id) === projectId);
      setUploads(prev => [{ name: file.name, type: fileType, project: project?.title || '', time: new Date() }, ...prev]);
      setFile(null);
    } catch { toast.error('Upload failed. Please try again.'); }
    finally { setUploading(false); }
  };

  const typeIcon = { audio: FileAudio, video: FileVideo, document: FileText, image: Music2 };

  return (
    <DashboardLayout title="Upload Assets" subtitle="Upload audio drafts, final mixes, and documents">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload form */}
        <div className="card-dark p-6">
          <h3 className="font-display font-bold text-white text-lg mb-5 flex items-center gap-2">
            <Upload size={20} className="text-purple-400" /> New Upload
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="label-input">Select Project *</label>
              {tasks.length === 0 ? (
                <div className="p-4 rounded-xl bg-dark-800/60 border border-purple-900/20 text-purple-500 text-sm font-display text-center">
                  <FolderKanban size={20} className="mx-auto mb-1 opacity-40" />
                  No projects assigned yet
                </div>
              ) : (
                <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input-dark">
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="label-input">File Type</label>
              <div className="grid grid-cols-4 gap-2">
                {['audio','video','document','image'].map(type => {
                  const Icon = typeIcon[type];
                  return (
                    <button key={type} type="button" onClick={() => setFileType(type)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all text-xs font-display font-semibold capitalize ${
                        fileType === type ? 'border-purple-500 bg-purple-900/30 text-purple-300' : 'border-purple-900/20 text-purple-500 hover:border-purple-700/40'
                      }`}>
                      <Icon size={18} />
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragOver ? 'border-purple-400 bg-purple-900/20' :
                file ? 'border-green-500/50 bg-green-500/5' : 'border-purple-900/40 hover:border-purple-700/60'
              }`}>
              <input type="file" accept="audio/*,video/*,.pdf,.doc,.docx,.jpg,.png"
                onChange={e => handleFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {file ? (
                <div>
                  <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                  <p className="text-green-300 font-display font-semibold text-sm">{file.name}</p>
                  <p className="text-green-500 text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <Upload size={32} className="mx-auto mb-2 text-purple-500 opacity-60" />
                  <p className="text-purple-400 font-display font-semibold text-sm">Drop file here or click to browse</p>
                  <p className="text-purple-600 text-xs mt-1">Audio, Video, PDF, Documents up to 50MB</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={uploading || !file || tasks.length === 0}
              className="btn-gold w-full justify-center py-3">
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <><Upload size={18} /> Upload Asset</>
              )}
            </button>
          </form>
        </div>

        {/* Upload history */}
        <div className="card-dark p-6">
          <h3 className="font-display font-bold text-white text-lg mb-5 flex items-center gap-2">
            <Music2 size={20} className="text-gold-400" /> Recent Uploads
          </h3>
          {uploads.length === 0 ? (
            <div className="text-center py-16 text-purple-500">
              <Upload size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-display">No uploads yet in this session</p>
              <p className="text-sm mt-1">Files you upload will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.map((u, i) => {
                const Icon = typeIcon[u.type] || Music2;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/60 border border-green-500/20">
                    <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-display font-semibold truncate">{u.name}</p>
                      <p className="text-purple-400 text-xs">{u.project} · {u.time.toLocaleTimeString()}</p>
                    </div>
                    <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
