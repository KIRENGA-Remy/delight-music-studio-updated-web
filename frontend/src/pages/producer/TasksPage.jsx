import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Clock, CheckCircle, AlertCircle, Users, Calendar, ChevronDown, ChevronUp, FileAudio } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProgressBar from '../../components/common/ProgressBar';
import AssetsPage from '../shared/AssetsPage';
import api from '../../services/api';

const statusIcon = (s) => ({
  pending:     <Clock size={16} className="text-gold-400" />,
  in_progress: <FolderKanban size={16} className="text-purple-400" />,
  completed:   <CheckCircle size={16} className="text-green-400" />,
  cancelled:   <AlertCircle size={16} className="text-red-400" />,
}[s]);

const statusBadge = (s) => ({
  pending: 'badge-gold', in_progress: 'badge-purple', completed: 'badge-green', cancelled: 'badge-red'
}[s] || 'badge-gold');

export default function ProducerTasksPage() {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [expanded, setExpanded] = useState({});
  const [assetsFor,setAssetsFor]= useState(null);

  useEffect(() => {
    api.get('/producer/tasks')
      .then(r => setTasks(r.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status, progress) => {
    try {
      await api.put(`/producer/tasks/${id}/status`, { status, progress_percentage: progress });
      toast.success('Task updated!');
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status, progress_percentage: progress ?? t.progress_percentage } : t));
    } catch { toast.error('Failed to update task'); }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <DashboardLayout title="My Tasks" subtitle="Projects assigned to you">
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['all','All'],['pending','Pending'],['in_progress','In Progress'],['completed','Completed']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl font-display font-semibold text-sm capitalize transition-all ${
              filter === v ? 'bg-purple-gradient text-white' : 'card-dark text-purple-300 hover:text-white'
            }`}>
            {l} <span className="opacity-60 ml-1">({(v === 'all' ? tasks : tasks.filter(t => t.status === v)).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-purple-500">
          <FolderKanban size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-display font-bold text-lg">No tasks found</p>
          <p className="text-sm mt-1">Tasks appear here when the manager assigns you to a project</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((task, i) => (
            <motion.div key={task.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card-dark p-5 hover:border-purple-600/40 transition-all">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {statusIcon(task.status)}
                    <h3 className="font-display font-bold text-white text-lg truncate">{task.title}</h3>
                    <span className={`${statusBadge(task.status)} ml-1`}>{task.status.replace('_', ' ')}</span>
                  </div>
                  {task.description && (
                    <p className="text-purple-400 text-sm mb-3 leading-relaxed line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-purple-400">
                      <Users size={13} /> Client: <span className="text-purple-300">{task.client_name}</span>
                    </span>
                    {task.deadline && (
                      <span className="flex items-center gap-1.5 text-gold-400">
                        <Calendar size={13} /> Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {task.price && (
                      <span className="text-green-400 font-display font-bold">
                        {Number(task.price).toLocaleString()} RWF
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <>
                      <button onClick={() => updateStatus(task.id, 'in_progress', Math.min((task.progress_percentage || 0) + 25, 100))}
                        className="btn-outline text-sm py-1.5 px-3 whitespace-nowrap">
                        +25%
                      </button>
                      <button onClick={() => updateStatus(task.id, 'completed', 100)}
                        className="text-sm px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/20 transition-all flex items-center gap-2 whitespace-nowrap">
                        <CheckCircle size={14} /> Done
                      </button>
                    </>
                  )}
                  <button onClick={() => toggleExpand(task.id)}
                    className="text-purple-400 hover:text-white transition-colors p-1.5 self-center">
                    {expanded[task.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>
              <ProgressBar value={task.progress_percentage || 0} label="Progress" />

              <AnimatePresence>
                {expanded[task.id] && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-4 pt-4 border-t border-purple-900/20">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-purple-400 text-xs font-display uppercase tracking-widest flex items-center gap-2">
                          <FileAudio size={13} /> Project Assets
                        </p>
                        <button onClick={() => setAssetsFor(assetsFor === task.id ? null : task.id)}
                          className="text-xs text-purple-400 hover:text-white transition-colors">
                          {assetsFor === task.id ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                      <AssetsPage projectId={String(task.id)} inModal />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
