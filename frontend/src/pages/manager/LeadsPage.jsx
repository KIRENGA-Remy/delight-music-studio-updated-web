import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const statusBadge = (s) => ({
  pending: 'badge-gold', contacted: 'badge-purple', converted: 'badge-green',
}[s] || 'badge-gold');

const statusLabel = { pending: 'Pending', contacted: 'Contacted', converted: 'Converted' };

export default function ManagerLeadsPage() {
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    api.get('/manager/partner-requests')
      .then(r => setLeads(r.data))
      .catch(() => toast.error('Failed to load partner requests'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/manager/partner-requests/${id}/status`, { status });
      toast.success('Status updated');
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch { toast.error('Failed to update'); }
  };

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);
  const counts = { all: leads.length, pending: leads.filter(l => l.status === 'pending').length, contacted: leads.filter(l => l.status === 'contacted').length, converted: leads.filter(l => l.status === 'converted').length };

  return (
    <DashboardLayout title="Partner Requests" subtitle="Manage incoming partnership and collaboration requests">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all','pending','contacted','converted'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-display font-semibold text-sm capitalize transition-all ${
              filter === f ? 'bg-purple-gradient text-white' : 'card-dark text-purple-300 hover:text-white'
            }`}>
            {f} <span className="ml-1 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-purple-500">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-display font-bold text-lg text-purple-400">No {filter === 'all' ? '' : filter} requests</p>
          <p className="text-sm mt-1">Partner requests from your website will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((lead, i) => (
            <motion.div key={lead.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card-dark p-5 hover:border-purple-600/40 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-purple-gradient flex items-center justify-center font-display font-bold text-white flex-shrink-0">
                    {lead.fullname[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-display font-bold text-white">{lead.fullname}</h3>
                      <span className={statusBadge(lead.status)}>{statusLabel[lead.status]}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-purple-400 mb-2">
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={13} /> {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={13} /> {lead.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {lead.message && (
                      <div className="flex items-start gap-2 bg-dark-800/60 rounded-xl p-3">
                        <MessageSquare size={14} className="text-purple-500 flex-shrink-0 mt-0.5" />
                        <p className="text-purple-300 text-sm leading-relaxed">{lead.message}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {lead.status === 'pending' && (
                    <button onClick={() => updateStatus(lead.id, 'contacted')}
                      className="btn-outline text-sm py-1.5 px-3 whitespace-nowrap">
                      <Phone size={14} /> Mark Contacted
                    </button>
                  )}
                  {lead.status !== 'converted' && (
                    <button onClick={() => updateStatus(lead.id, 'converted')}
                      className="text-sm px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/20 transition-all flex items-center gap-2 whitespace-nowrap">
                      <CheckCircle size={14} /> Convert
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
