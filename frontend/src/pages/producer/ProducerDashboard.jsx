import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Upload, DollarSign, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProgressBar from '../../components/common/ProgressBar';
import api from '../../services/api';

export default function ProducerDashboard() {
  const [tasks,    setTasks]    = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('tasks');
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedTask, setSelTask]  = useState(null);
  const [file,     setFile]    = useState(null);
  const [uploading,setUploading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/producer/tasks'), api.get('/producer/earnings')])
      .then(([t, e]) => { setTasks(t.data); setEarnings(e.data); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status, progress) => {
    try {
      await api.put(`/producer/tasks/${id}/status`, { status, progress_percentage: progress });
      toast.success('Task updated!');
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status, progress_percentage: progress ?? t.progress_percentage } : t));
    } catch { toast.error('Failed to update'); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedTask) { toast.error('Select a file and task'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('project_id', selectedTask);
      fd.append('file_type', 'audio');
      await api.post('/producer/upload-asset', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Asset uploaded!');
      setUploadModal(false); setFile(null);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const statusIcon = (s) => ({
    pending:     <Clock size={18} className="text-gold-400" />,
    in_progress: <FolderKanban size={18} className="text-purple-400" />,
    completed:   <CheckCircle size={18} className="text-green-400" />,
    cancelled:   <AlertCircle size={18} className="text-red-400" />,
  }[s]);

  const active    = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const totalEarned = earnings?.total_earned || 0;

  return (
    <DashboardLayout title="Producer Dashboard" subtitle="Manage your tasks and uploads">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Tasks', value: active, icon: FolderKanban, color: 'text-purple-400' },
          { label: 'Completed',    value: completed, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Total Earned', value: `${Number(totalEarned).toLocaleString()} RWF`, icon: DollarSign, color: 'text-gold-400' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="stat-card">
            <Icon size={24} className={`${color} mb-2`} />
            <p className="font-display font-bold text-2xl text-white">{value}</p>
            <p className="text-purple-400 text-md mt-0.5 font-display">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['tasks', 'earnings'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl font-display font-semibold text-md capitalize transition-all ${
              tab === t ? 'bg-purple-gradient text-white shadow-purple' : 'card-dark text-purple-300 hover:text-white'
            }`}>{t}</button>
        ))}
        <button onClick={() => setUploadModal(true)} className="btn-gold ml-auto text-md px-5 py-2">
          <Upload size={18} /> Upload Asset
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'tasks' && (
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-16 text-purple-500">
                  <FolderKanban size={40} className="mx-auto mb-3 opacity-40" />
                  <p>No tasks assigned yet</p>
                </div>
              ) : tasks.map(task => (
                <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card-dark p-5 hover:border-purple-600/40 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {statusIcon(task.status)}
                        <h3 className="font-display font-bold text-white text-md truncate">{task.title}</h3>
                      </div>
                      <p className="text-purple-400 text-md">Client: {task.client_name}</p>
                      {task.deadline && (
                        <p className="text-gold-400 text-md mt-0.5">
                          Deadline: {new Date(task.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {task.status !== 'completed' && task.status !== 'cancelled' && (
                        <>
                          <button onClick={() => updateStatus(task.id, 'in_progress', Math.min((task.progress_percentage || 0) + 25, 100))}
                            className="text-md btn-outline py-1.5 px-3">+25%</button>
                          <button onClick={() => updateStatus(task.id, 'completed', 100)}
                            className="text-md px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-all">Done</button>
                        </>
                      )}
                    </div>
                  </div>
                  <ProgressBar value={task.progress_percentage || 0} label="Progress" />
                  {/* Progress input */}
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <div className="mt-3 pt-3 border-t border-purple-900/20">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="range" min={0} max={100} step={5}
                          defaultValue={task.progress_percentage || 0}
                          onChange={e => {
                            const v = Number(e.target.value);
                            updateStatus(task.id, v === 100 ? 'completed' : 'in_progress', v);
                          }}
                          className="flex-1 accent-purple-500 cursor-pointer h-1.5"
                        />
                        <span className="text-purple-400 text-xs w-8 text-right tabular-nums">{task.progress_percentage || 0}%</span>
                      </div>
                    </div>
                  )}
                  {task.price && (
                    <p className="text-gold-400 text-sm mt-2 font-semibold">
                      Value: {Number(task.price).toLocaleString()} RWF
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'earnings' && (
            <div className="card-dark overflow-hidden">
              <div className="px-5 py-4 border-b border-purple-900/30">
                <h3 className="font-display font-bold text-white">Earnings Log</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    {['Project', 'Client', 'Status', 'Amount (RWF)'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-md font-display font-bold text-purple-400 uppercase tracking-wider border-b border-purple-900/30">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(earnings?.earnings || []).map(e => (
                      <tr key={e.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                        <td className="px-4 py-3 text-white text-md font-medium">{e.title}</td>
                        <td className="px-4 py-3 text-purple-300 text-md">{e.client_name}</td>
                        <td className="px-4 py-3">
                          <span className={e.status === 'completed' ? 'badge-green' : e.status === 'in_progress' ? 'badge-purple' : 'badge-gold'}>
                            {e.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gold-400 font-display font-bold text-md">
                          {e.price ? Number(e.price).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-purple-800/40">
                      <td colSpan={3} className="px-4 py-3 text-right font-display font-bold text-white text-md">Total Earned:</td>
                      <td className="px-4 py-3 text-gold-400 font-display font-bold">{Number(totalEarned).toLocaleString()} RWF</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setUploadModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md glass p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-xl text-white">Upload Asset</h3>
              <button onClick={() => setUploadModal(false)} className="text-purple-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="label-input">Select Project</label>
                <select value={selectedTask || ''} onChange={e => setSelTask(e.target.value)} className="input-dark">
                  <option value="">Choose a project...</option>
                  {tasks.filter(t => t.status !== 'completed').map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-input">Audio / Draft File</label>
                <input type="file" accept="audio/*,video/*,.pdf,.doc,.docx"
                  onChange={e => setFile(e.target.files[0])}
                  className="input-dark file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-sm cursor-pointer" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setUploadModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-gold flex-1 justify-center">
                  {uploading ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : <><Upload size={18} /> Upload</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
