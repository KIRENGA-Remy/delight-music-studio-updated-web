import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Download, Award, Music2, Clock, CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProgressBar from '../../components/common/ProgressBar';
import api from '../../services/api';

export default function ClientDashboard() {
  const [projects,  setProjects]  = useState([]);
  const [certs,     setCerts]     = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [assets,    setAssets]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('projects');

  useEffect(() => {
    Promise.all([api.get('/client/projects'), api.get('/client/certificates')])
      .then(([p, c]) => { setProjects(p.data); setCerts(c.data); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const loadAssets = async (projectId) => {
    setSelected(projectId);
    try {
      const res = await api.get(`/client/assets/${projectId}`);
      setAssets(res.data);
      setTab('vault');
    } catch { toast.error('Failed to load files'); }
  };

  const statusConfig = {
    pending:     { icon: Clock,       color: 'text-gold-400',   badge: 'badge-gold',   label: 'Pending' },
    in_progress: { icon: Loader,      color: 'text-purple-400', badge: 'badge-purple', label: 'In Progress' },
    completed:   { icon: CheckCircle, color: 'text-green-400',  badge: 'badge-green',  label: 'Completed' },
    cancelled:   { icon: Clock,       color: 'text-red-400',    badge: 'badge-red',    label: 'Cancelled' },
  };

  const active    = projects.filter(p => p.status === 'in_progress').length;
  const completed = projects.filter(p => p.status === 'completed').length;

  return (
    <DashboardLayout title="My Dashboard" subtitle="Track your projects and downloads">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'My Projects', value: projects.length, icon: FolderKanban, color: 'text-purple-400' },
          { label: 'In Progress', value: active,          icon: Loader,       color: 'text-gold-400' },
          { label: 'Completed',   value: completed,       icon: CheckCircle,  color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="stat-card">
            <Icon size={20} className={`${color} mb-2`} />
            <p className="font-display font-bold text-2xl text-white">{value}</p>
            <p className="text-purple-400 text-xs mt-0.5 font-display">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {['projects', 'vault', 'certificates'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl font-display font-semibold text-sm capitalize transition-all ${
              tab === t ? 'bg-purple-gradient text-white shadow-purple' : 'card-dark text-purple-300 hover:text-white'
            }`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'projects' && (
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-16 text-purple-500">
                  <Music2 size={40} className="mx-auto mb-3 opacity-40" />
                  <p>No projects yet. Contact the studio to get started.</p>
                </div>
              ) : projects.map(project => {
                const cfg = statusConfig[project.status] || statusConfig.pending;
                return (
                  <motion.div key={project.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="card-dark p-5 hover:border-purple-600/40 transition-all">
                    <div className="flex items-start justify-between mb-4 gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <cfg.icon size={15} className={cfg.color} />
                          <h3 className="font-display font-bold text-white text-base truncate">{project.title}</h3>
                        </div>
                        {project.description && (
                          <p className="text-purple-400 text-xs leading-relaxed mb-2 line-clamp-2">{project.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs">
                          <span className={cfg.badge}>{cfg.label}</span>
                          {project.producer_name && (
                            <span className="text-purple-400">Producer: <span className="text-purple-300">{project.producer_name}</span></span>
                          )}
                          {project.deadline && (
                            <span className="text-gold-400">Due: {new Date(project.deadline).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => loadAssets(project.id)}
                        className="btn-outline text-xs px-3 py-1.5 flex-shrink-0">
                        <Download size={12} /> Files
                      </button>
                    </div>
                    <ProgressBar value={project.progress_percentage || 0} label="Progress" />
                  </motion.div>
                );
              })}
            </div>
          )}

          {tab === 'vault' && (
            <div className="space-y-3">
              {!selected && (
                <div className="text-center py-16 card-dark text-purple-500">
                  <Download size={36} className="mx-auto mb-3 opacity-40" />
                  <p>Select a project from "Projects" to view its files</p>
                </div>
              )}
              {selected && assets.length === 0 && (
                <div className="text-center py-16 card-dark text-purple-500">
                  <Music2 size={36} className="mx-auto mb-3 opacity-40" />
                  <p>No files uploaded yet for this project</p>
                </div>
              )}
              {assets.map(asset => (
                <motion.div key={asset.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card-dark p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-gradient flex items-center justify-center flex-shrink-0">
                      <Music2 size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-display font-semibold">{asset.file_url.split('/').pop()}</p>
                      <p className="text-purple-400 text-xs capitalize">{asset.file_type} · {asset.uploader_name}</p>
                    </div>
                  </div>
                  <a href={`https://delightmusicstudio.onrender.com${asset.file_url}`}
                    download target="_blank" rel="noreferrer"
                    className="btn-gold text-xs px-4 py-2 flex-shrink-0">
                    <Download size={13} /> Download
                  </a>
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'certificates' && (
            <div className="space-y-3">
              {certs.length === 0 ? (
                <div className="text-center py-16 card-dark text-purple-500">
                  <Award size={40} className="mx-auto mb-3 opacity-40" />
                  <p>No certificates issued yet</p>
                </div>
              ) : certs.map(cert => (
                <motion.div key={cert.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card-dark p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center">
                      <Award size={18} className="text-dark-950" />
                    </div>
                    <div>
                      <p className="text-white font-display font-bold text-sm">Certificate of Completion</p>
                      <p className="text-purple-400 text-xs">{cert.issued_date ? new Date(cert.issued_date).toLocaleDateString() : 'Date not set'}</p>
                    </div>
                  </div>
                  {cert.certificate_url && (
                    <a href={`https://delightmusicstudio.onrender.com${cert.certificate_url}`}
                      download target="_blank" rel="noreferrer"
                      className="btn-gold text-xs px-4 py-2">
                      <Download size={13} /> Download
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
