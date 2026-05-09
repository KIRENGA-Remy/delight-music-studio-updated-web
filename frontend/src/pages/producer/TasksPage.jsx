import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Clock, CheckCircle, AlertCircle, Users, Calendar,
  ChevronDown, ChevronUp, FileAudio, SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProgressBar from '../../components/common/ProgressBar';
import AssetsPage from '../shared/AssetsPage';
import api from '../../services/api';

const statusIcon = (s) => ({
  pending:     <Clock size={15} className="text-gold-400" />,
  in_progress: <FolderKanban size={15} className="text-purple-400" />,
  completed:   <CheckCircle size={15} className="text-green-400" />,
  cancelled:   <AlertCircle size={15} className="text-red-400" />,
}[s]);

const statusBadge = (s) => ({
  pending: 'badge-gold', in_progress: 'badge-purple', completed: 'badge-green', cancelled: 'badge-red'
}[s] || 'badge-gold');

export default function ProducerTasksPage() {
  const [tasks,      setTasks]    = useState([]);
  const [loading,    setLoading]  = useState(true);
  const [filter,     setFilter]   = useState('all');
  const [expanded,   setExpanded] = useState({});
  const [progEdit,   setProgEdit] = useState({}); // { [id]: draftProgress }

  useEffect(() => {
    api.get('/producer/tasks')
      .then(r => {
        setTasks(r.data);
        const init = {};
        r.data.forEach(t => { init[t.id] = t.progress_percentage || 0; });
        setProgEdit(init);
      })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status, progress) => {
    try {
      const pct = progress ?? progEdit[id] ?? 0;
      await api.put(`/producer/tasks/${id}/status`, {
        status,
        progress_percentage: Number(pct),
      });
      toast.success('Task updated!');
      setTasks(prev => prev.map(t => t.id === id
        ? { ...t, status, progress_percentage: Number(pct) }
        : t
      ));
    } catch { toast.error('Failed to update task'); }
  };

  const saveProgress = async (id) => {
    const pct = Number(progEdit[id] || 0);
    const task = tasks.find(t => t.id === id);
    const status = pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : (task?.status || 'pending');
    await updateStatus(id, status, pct);
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <DashboardLayout title="My Tasks" subtitle="Projects assigned to you">
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['all','All'],['pending','Pending'],['in_progress','In Progress'],['completed','Completed']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl font-medium text-sm capitalize transition-all ${
              filter === v ? 'bg-purple-gradient text-white' : 'card-dark text-purple-300 hover:text-white'
            }`}>
            {l} <span className="opacity-60 ml-1">({(v === 'all' ? tasks : tasks.filter(t => t.status === v)).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-purple-500">
          <FolderKanban size={44} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-base">No tasks found</p>
          <p className="text-sm mt-1">Tasks appear here when the manager assigns you to a project</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task, i) => (
            <motion.div key={task.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card-dark p-4 sm:p-5 hover:border-purple-600/40 transition-all">

              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {statusIcon(task.status)}
                    <h3 className="font-semibold text-white text-base truncate">{task.title}</h3>
                    <span className={statusBadge(task.status)}>{task.status.replace('_', ' ')}</span>
                  </div>
                  {task.description && (
                    <p className="text-purple-400 text-sm mb-2 leading-relaxed line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-purple-400">
                    <span className="flex items-center gap-1"><Users size={11} /> {task.client_name}</span>
                    {task.deadline && (
                      <span className="flex items-center gap-1 text-gold-400">
                        <Calendar size={11} /> {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {task.price && (
                      <span className="text-green-400 font-semibold">{Number(task.price).toLocaleString()} RWF</span>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <button onClick={() => updateStatus(task.id, 'completed', 100)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-all">
                      <CheckCircle size={12} /> Done
                    </button>
                  )}
                  <button onClick={() => toggleExpand(task.id)}
                    className="p-1.5 text-purple-400 hover:text-white transition-colors">
                    {expanded[task.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Progress bar display */}
              <ProgressBar value={progEdit[task.id] ?? task.progress_percentage ?? 0} label="Progress" />

              {/* Expanded: progress slider + assets */}
              <AnimatePresence>
                {expanded[task.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-4 pt-4 border-t border-purple-900/20 space-y-5">

                      {/* Progress control */}
                      {task.status !== 'completed' && task.status !== 'cancelled' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                              <SlidersHorizontal size={12} /> Set Progress
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min={0} max={100}
                                value={progEdit[task.id] ?? 0}
                                onChange={e => {
                                  const v = Math.min(100, Math.max(0, Number(e.target.value)));
                                  setProgEdit(p => ({ ...p, [task.id]: v }));
                                }}
                                className="w-14 text-center bg-dark-800 border border-purple-800/50 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500"
                              />
                              <span className="text-purple-400 text-xs">%</span>
                            </div>
                          </div>
                          <input
                            type="range" min={0} max={100} step={5}
                            value={progEdit[task.id] ?? 0}
                            onChange={e => setProgEdit(p => ({ ...p, [task.id]: Number(e.target.value) }))}
                            className="w-full accent-purple-500 cursor-pointer h-1.5"
                          />
                          <div className="flex justify-between text-purple-700 text-xs mt-1">
                            <span>0%</span><span>50%</span><span>100%</span>
                          </div>
                          <button
                            onClick={() => saveProgress(task.id)}
                            className="mt-2 btn-purple text-xs px-4 py-1.5 w-full justify-center">
                            Save Progress
                          </button>
                        </div>
                      )}

                      {/* Assets */}
                      <div>
                        <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileAudio size={12} /> Project Assets
                        </p>
                        <AssetsPage projectId={String(task.id)} inModal />
                      </div>
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
