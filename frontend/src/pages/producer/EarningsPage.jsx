import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, CheckCircle, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

export default function ProducerEarningsPage() {
  const [earnings, setEarnings] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/producer/earnings')
      .then(r => setEarnings(r.data))
      .catch(() => toast.error('Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  const list = earnings?.earnings || [];
  const totalEarned = Number(earnings?.total_earned || 0);
  const completedCount = list.filter(e => e.status === 'completed').length;
  const pendingValue = list.filter(e => e.status !== 'completed').reduce((s, e) => s + Number(e.price || 0), 0);

  return (
    <DashboardLayout title="Earnings" subtitle="Your income from completed projects">
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Earned', value: `${totalEarned.toLocaleString()} RWF`, icon: DollarSign, color: 'text-gold-400', bg: 'bg-gold-500/10' },
              { label: 'Completed Projects', value: completedCount, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Pending Value', value: `${pendingValue.toLocaleString()} RWF`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
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

          {/* Earnings table */}
          <div className="card-dark overflow-hidden">
            <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <FolderKanban size={18} className="text-purple-400" /> Earnings Log
              </h3>
              <span className="text-purple-400 text-sm">{list.length} projects</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  {['Project','Client','Status','Value (RWF)'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-display font-bold text-purple-400 uppercase tracking-wider border-b border-purple-900/30">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-16 text-center text-purple-500">
                        <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
                        <p>No earnings yet. Complete a project to earn.</p>
                      </td>
                    </tr>
                  )}
                  {list.map((e, i) => (
                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                      <td className="px-4 py-3 text-white text-sm font-medium">{e.title}</td>
                      <td className="px-4 py-3 text-purple-300 text-sm">{e.client_name}</td>
                      <td className="px-4 py-3">
                        <span className={e.status === 'completed' ? 'badge-green' : e.status === 'in_progress' ? 'badge-purple' : 'badge-gold'}>
                          {e.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gold-400 font-display font-bold text-sm">
                        {e.price ? Number(e.price).toLocaleString() : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-purple-800/40">
                    <td colSpan={3} className="px-4 py-3 text-right font-display font-bold text-white text-sm">Total Earned:</td>
                    <td className="px-4 py-3 text-gold-400 font-display font-bold">{totalEarned.toLocaleString()} RWF</td>
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
