import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Music2, Clock, CheckCircle, Loader, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProgressBar from '../../components/common/ProgressBar';
import RatingWidget from '../../components/common/RatingWidget';
import api from '../../services/api';

const statusConfig = {
  pending:     { icon: Clock,       color: 'text-gold-400',   badge: 'badge-gold',   label: 'Pending' },
  in_progress: { icon: Loader,      color: 'text-purple-400', badge: 'badge-purple', label: 'In Progress' },
  completed:   { icon: CheckCircle, color: 'text-green-400',  badge: 'badge-green',  label: 'Completed' },
  cancelled:   { icon: Clock,       color: 'text-red-400',    badge: 'badge-red',    label: 'Cancelled' },
};

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    api.get('/client/projects')
      .then(r => setProjects(r.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  return (
    <DashboardLayout title="My Projects" subtitle="All your studio projects in one place">
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['all','All'],['pending','Pending'],['in_progress','In Progress'],['completed','Completed']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl font-display font-semibold text-sm capitalize transition-all ${
              filter === v ? 'bg-purple-gradient text-white shadow-purple' : 'card-dark text-purple-300 hover:text-white'
            }`}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-purple-500">
          <Music2 size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-display">No projects found</p>
          <p className="text-sm mt-1">Contact the studio to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((project, i) => {
            const cfg = statusConfig[project.status] || statusConfig.pending;
            return (
              <motion.div key={project.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card-dark p-5 hover:border-purple-600/40 transition-all">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <cfg.icon size={15} className={cfg.color} />
                      <h3 className="font-display font-bold text-white text-lg truncate">{project.title}</h3>
                    </div>
                    {project.description && (
                      <p className="text-purple-400 text-sm leading-relaxed mb-3 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs flex-wrap">
                      <span className={cfg.badge}>{cfg.label}</span>
                      {project.producer_name && (
                        <span className="text-purple-400">Producer: <span className="text-purple-300">{project.producer_name}</span></span>
                      )}
                      {project.deadline && (
                        <span className="text-gold-400">Due: {new Date(project.deadline).toLocaleDateString()}</span>
                      )}
                      {project.price && (
                        <span className="text-green-400">{Number(project.price).toLocaleString()} RWF</span>
                      )}
                    </div>
                  </div>
                </div>
                <ProgressBar value={project.progress_percentage || 0} label="Progress" />

                {/* Rating - show for all projects so client can rate */}
                <div className="mt-4">
                  <RatingWidget projectId={project.id} projectTitle={project.title} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
