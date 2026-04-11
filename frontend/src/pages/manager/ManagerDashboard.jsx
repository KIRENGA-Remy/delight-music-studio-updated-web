import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FolderKanban, DollarSign, TrendingUp, Plus, Eye,
  CheckCircle, Clock, UserPlus, X, ChevronRight, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProgressBar from '../../components/common/ProgressBar';
import api from '../../services/api';

const ROLES    = ['producer', 'client'];
const CLI_TYPES = ['artist', 'student', 'intern', 'event_planner', 'other'];
const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function ManagerDashboard() {
  const [data,    setData]    = useState(null);
  const [leads,   setLeads]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ fullname: '', email: '', phone: '', role: 'client', client_type: '' });
  const [saving,  setSaving]  = useState(false);
  const [activeTab, setTab]   = useState('overview');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, l, u] = await Promise.all([
        api.get('/manager/dashboard'),
        api.get('/manager/partner-requests'),
        api.get('/manager/users'),
      ]);
      setData(d.data); setLeads(l.data); setUsers(u.data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.fullname || !form.role || (!form.email && !form.phone)) {
      toast.error('Name, role, and email or phone required'); return;
    }
    setSaving(true);
    try {
      const res = await api.post('/manager/create-user', form);
      toast.success(`User created! OTP: ${res.data.otp_preview}`);
      setModal(false);
      setForm({ fullname: '', email: '', phone: '', role: 'client', client_type: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const updateLeadStatus = async (id, status) => {
    await api.put(`/manager/partner-requests/${id}/status`, { status });
    toast.success('Status updated');
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const STAT_CARDS = data ? [
    { label: 'Total Users',       value: data.total_users,        icon: Users,         color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Active Projects',   value: data.active_projects,    icon: FolderKanban,  color: 'text-gold-400',   bg: 'bg-gold-500/10' },
    { label: 'Pending Leads',     value: data.pending_leads,      icon: TrendingUp,    color: 'text-blue-400',   bg: 'bg-blue-500/10' },
    { label: 'Revenue (RWF)',     value: `${Number(data.total_revenue||0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
  ] : [];

  const statusBadge = (s) => ({
    pending:   'badge-red', contacted: 'badge-purple', converted: 'badge-green',
    in_progress: 'badge-purple', completed: 'badge-green', cancelled: 'badge-red', pending_status: 'badge-gold',
  }[s] || 'badge-gold');

  const TABS = ['overview', 'leads', 'pipeline', 'users'];

  return (
    <DashboardLayout title="Manager Dashboard" subtitle="Studio overview and management">

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl font-display font-semibold text-sm capitalize transition-all ${
              activeTab === t ? 'bg-purple-gradient text-white shadow-purple' : 'card-dark text-purple-300 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
        <button onClick={() => setModal(true)}
          className="btn-gold ml-auto text-sm px-5 py-2">
          <UserPlus size={15} /> New User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }, i) => (
                  <motion.div key={i} {...FADE} transition={{ delay: i * 0.08 }} className="stat-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                        <Icon size={18} className={color} />
                      </div>
                    </div>
                    <p className="font-display font-bold text-2xl text-white">{value}</p>
                    <p className="text-purple-400 text-xs mt-1 uppercase tracking-wide font-display">{label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Producers pipeline */}
              {data?.producers?.length > 0 && (
                <div className="card-dark p-5">
                  <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                    <FolderKanban size={16} className="text-gold-400" /> Producer Pipeline
                  </h3>
                  <div className="space-y-4">
                    {data.producers.map(p => (
                      <div key={p.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-purple-gradient flex items-center justify-center font-display font-bold text-white text-xs flex-shrink-0">
                          {p.fullname[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-1">
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

              {/* Recent projects */}
              {data?.recent_projects?.length > 0 && (
                <div className="card-dark overflow-hidden">
                  <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between">
                    <h3 className="font-display font-bold text-white">Recent Projects</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr>
                        {['Title','Client','Producer','Status','Progress'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-display font-bold text-purple-400 uppercase tracking-wider border-b border-purple-900/30">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {data.recent_projects.map(p => (
                          <tr key={p.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                            <td className="px-4 py-3 text-white text-sm font-medium">{p.title}</td>
                            <td className="px-4 py-3 text-purple-300 text-sm">{p.client_name}</td>
                            <td className="px-4 py-3 text-purple-300 text-sm">{p.producer_name}</td>
                            <td className="px-4 py-3"><span className={statusBadge(p.status)}>{p.status}</span></td>
                            <td className="px-4 py-3 min-w-32"><ProgressBar value={p.progress_percentage} size="sm" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LEADS */}
          {activeTab === 'leads' && (
            <div className="card-dark overflow-hidden">
              <div className="px-5 py-4 border-b border-purple-900/30">
                <h3 className="font-display font-bold text-white">Partner Requests ({leads.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    {['Name','Email','Phone','Message','Status','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-display font-bold text-purple-400 uppercase tracking-wider border-b border-purple-900/30">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                        <td className="px-4 py-3 text-white text-sm font-medium">{lead.fullname}</td>
                        <td className="px-4 py-3 text-purple-300 text-xs">{lead.email}</td>
                        <td className="px-4 py-3 text-purple-300 text-xs">{lead.phone || '—'}</td>
                        <td className="px-4 py-3 text-purple-400 text-xs max-w-48 truncate">{lead.message || '—'}</td>
                        <td className="px-4 py-3"><span className={statusBadge(lead.status)}>{lead.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {lead.status === 'pending' && (
                              <button onClick={() => updateLeadStatus(lead.id, 'contacted')}
                                className="text-xs btn-outline py-1 px-2.5">Contacted</button>
                            )}
                            {lead.status !== 'converted' && (
                              <button onClick={() => updateLeadStatus(lead.id, 'converted')}
                                className="text-xs px-2.5 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-all">Convert</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-purple-500 text-sm">No leads yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div className="card-dark overflow-hidden">
              <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between">
                <h3 className="font-display font-bold text-white">All Users ({users.length})</h3>
                <button onClick={() => setModal(true)} className="btn-gold text-xs px-4 py-2">
                  <Plus size={13} /> Add User
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    {['Name','Email/Phone','Role','Type','Joined'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-display font-bold text-purple-400 uppercase tracking-wider border-b border-purple-900/30">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-gradient flex items-center justify-center font-display font-bold text-white text-xs flex-shrink-0">
                              {u.fullname[0]}
                            </div>
                            <span className="text-white text-sm font-medium">{u.fullname}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-purple-300 text-xs">{u.email || u.phone}</td>
                        <td className="px-4 py-3"><span className={u.role === 'producer' ? 'badge-purple' : 'badge-gold'}>{u.role}</span></td>
                        <td className="px-4 py-3 text-purple-400 text-xs capitalize">{u.client_type || '—'}</td>
                        <td className="px-4 py-3 text-purple-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-purple-500 text-sm">No users yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PIPELINE tab */}
          {activeTab === 'pipeline' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['pending', 'in_progress', 'completed'].map(status => (
                <div key={status} className="card-dark p-4">
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status === 'pending' ? 'bg-gold-400' : status === 'in_progress' ? 'bg-purple-400' : 'bg-green-400'}`} />
                    <span className="text-white">{status.replace('_', ' ')}</span>
                    <span className="badge-gray ml-auto">
                      {data?.recent_projects?.filter(p => p.status === status).length || 0}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {data?.recent_projects?.filter(p => p.status === status).map(p => (
                      <div key={p.id} className="bg-dark-800/60 border border-purple-900/20 rounded-xl p-3">
                        <p className="text-white font-display font-semibold text-sm mb-1">{p.title}</p>
                        <p className="text-purple-400 text-xs mb-2">{p.client_name}</p>
                        <ProgressBar value={p.progress_percentage} size="sm" />
                      </div>
                    ))}
                    {(data?.recent_projects?.filter(p => p.status === status).length || 0) === 0 && (
                      <p className="text-purple-600 text-xs text-center py-4">No projects</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create User Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md glass p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-xl text-white">Create New User</h3>
              <button onClick={() => setModal(false)} className="text-purple-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="label-input">Full Name *</label>
                <input value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))}
                  placeholder="Jean Habimana" className="input-dark" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-input">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="user@example.com" className="input-dark" />
                </div>
                <div>
                  <label className="label-input">Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+250788000000" className="input-dark" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-input">Role *</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input-dark">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {form.role === 'client' && (
                  <div>
                    <label className="label-input">Client Type</label>
                    <select value={form.client_type} onChange={e => setForm(p => ({ ...p, client_type: e.target.value }))} className="input-dark">
                      <option value="">Select type</option>
                      {CLI_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-gold flex-1 justify-center">
                  {saving ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : 'Create & Send OTP'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
