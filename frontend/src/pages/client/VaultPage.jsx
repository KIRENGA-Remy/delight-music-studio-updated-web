import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Music2, FolderOpen, FileAudio, FileVideo, FileText, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const fileIcon = (type) => ({
  audio: FileAudio, video: FileVideo, document: FileText, image: Image
}[type] || Music2);

export default function ClientVaultPage() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [assets,   setAssets]   = useState([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingA, setLoadingA] = useState(false);

  useEffect(() => {
    api.get('/client/projects')
      .then(r => setProjects(r.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoadingP(false));
  }, []);

  const loadAssets = async (project) => {
    setSelected(project);
    setLoadingA(true);
    try {
      const res = await api.get(`/client/assets/${project.id}`);
      setAssets(res.data);
    } catch { toast.error('Failed to load files'); }
    finally { setLoadingA(false); }
  };

  return (
    <DashboardLayout title="File Vault" subtitle="Download your project files and assets">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project list */}
        <div className="card-dark p-4">
          <h3 className="font-display font-bold text-white mb-3 text-sm uppercase tracking-widest text-purple-400">
            Select Project
          </h3>
          {loadingP ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-10 text-purple-500">
              <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map(p => (
                <button key={p.id} onClick={() => loadAssets(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selected?.id === p.id
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-purple-900/20 text-purple-300 hover:border-purple-700/40 hover:text-white'
                  }`}>
                  <p className="font-display font-semibold text-sm truncate">{p.title}</p>
                  <p className={`text-xs mt-0.5 ${
                    p.status === 'completed' ? 'text-green-400' : p.status === 'in_progress' ? 'text-purple-400' : 'text-gold-400'
                  }`}>{p.status.replace('_', ' ')}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assets */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card-dark p-16 text-center text-purple-500">
              <FolderOpen size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-display font-semibold">Select a project to view files</p>
              <p className="text-sm mt-1">Your downloadable assets will appear here</p>
            </div>
          ) : loadingA ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="card-dark p-16 text-center text-purple-500">
              <Music2 size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-display font-semibold">No files uploaded yet</p>
              <p className="text-sm mt-1">Files will appear here once your producer uploads them</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-white">{selected.title}</h3>
                <span className="text-purple-400 text-sm">{assets.length} file{assets.length !== 1 ? 's' : ''}</span>
              </div>
              {assets.map((asset, i) => {
                const FileIcon = fileIcon(asset.file_type);
                const filename = asset.file_url.split('/').pop();
                return (
                  <motion.div key={asset.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card-dark p-4 flex items-center justify-between gap-4 hover:border-purple-600/40 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-gradient flex items-center justify-center flex-shrink-0">
                        <FileIcon size={18} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-display font-semibold truncate">{filename}</p>
                        <p className="text-purple-400 text-xs capitalize mt-0.5">
                          {asset.file_type} · Uploaded by {asset.uploader_name}
                        </p>
                      </div>
                    </div>
                    <a href={`https://delightmusicstudio.onrender.com${asset.file_url}`}
                      download target="_blank" rel="noreferrer"
                      className="btn-gold text-sm px-4 py-2 flex-shrink-0">
                      <Download size={16} /> Download
                    </a>
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
