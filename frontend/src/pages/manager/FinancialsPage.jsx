import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, FolderKanban, Users, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProgressBar from '../../components/common/ProgressBar';
import api from '../../services/api';

export default function ManagerFinancialsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/manager/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load financials'))
      .finally(() => setLoading(false));
  }, []);

  const completedProjects = data?.recent_projects?.filter(p => p.status === 'completed') || [];
  const totalRevenue = Number(data?.total_revenue || 0);
  const avgProjectValue = completedProjects.length
    ? completedProjects.reduce((s, p) => s + Number(p.price || 0), 0) / completedProjects.length
    : 0;

  return (
    <DashboardLayout title="Financials" subtitle="Revenue overview and project earnings">
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: `${totalRevenue.toLocaleString()} RWF`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Completed Projects', value: data?.completed_projects || 0, icon: FolderKanban, color: 'text-gold-400', bg: 'bg-gold-500/10' },
              { label: 'Active Projects', value: data?.active_projects || 0, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Avg Project Value', value: `${Math.round(avgProjectValue).toLocaleString()} RWF`, icon: ArrowUpRight, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            ].map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="stat-card">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={22} className={color} />
                </div>
                <p className="font-display font-bold text-2xl text-white">{value}</p>
                <p className="text-purple-400 text-xs mt-1 uppercase tracking-wide font-display">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Revenue by Producer */}
          {data?.producers?.length > 0 && (
            <div className="card-dark p-5">
              <h3 className="font-display font-bold text-white text-lg mb-4 flex items-center gap-2">
                <Users size={20} className="text-purple-400" /> Producer Performance
              </h3>
              <div className="space-y-4">
                {data.producers.map(p => (
                  <div key={p.id} className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-purple-gradient flex items-center justify-center font-display font-bold text-white text-sm flex-shrink-0">
                      {p.fullname[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white font-display font-semibold truncate">{p.fullname}</span>
                        <span className="text-purple-400 flex-shrink-0 ml-2">{p.project_count} projects</span>
                      </div>
                      <ProgressBar value={Math.round(p.avg_progress)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects earnings table */}
          <div className="card-dark overflow-hidden">
            <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between">
              <h3 className="font-display font-bold text-white">Project Earnings</h3>
              <span className="badge-green">{completedProjects.length} completed</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  {['Project','Client','Producer','Status','Value (RWF)'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-display font-bold text-purple-400 uppercase tracking-wider border-b border-purple-900/30">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(data?.recent_projects || []).map(p => (
                    <tr key={p.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                      <td className="px-4 py-3 text-white text-sm font-medium">{p.title}</td>
                      <td className="px-4 py-3 text-purple-300 text-sm">{p.client_name}</td>
                      <td className="px-4 py-3 text-purple-300 text-sm">{p.producer_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={{
                          completed: 'badge-green', in_progress: 'badge-purple',
                          pending: 'badge-gold', cancelled: 'badge-red'
                        }[p.status] || 'badge-gold'}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gold-400 font-display font-bold text-sm">
                        {p.price ? Number(p.price).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {(data?.recent_projects || []).length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-purple-500 text-sm">No projects yet</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-purple-800/40">
                    <td colSpan={4} className="px-4 py-3 text-right font-display font-bold text-white text-sm">Total Revenue:</td>
                    <td className="px-4 py-3 text-gold-400 font-display font-bold">{totalRevenue.toLocaleString()} RWF</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
