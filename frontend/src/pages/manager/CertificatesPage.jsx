import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Plus, Upload, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

export default function ManagerCertificatesPage() {
  const [users,   setUsers]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ user_id: '', issued_date: '', certificate_url: '' });
  const [file,    setFile]    = useState(null);
  const [certs,   setCerts]   = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/manager/users'),
    ]).then(([u]) => {
      setUsers(u.data.filter(u => u.role === 'client'));
    }).catch(() => toast.error('Failed to load users'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user_id || !form.issued_date) { toast.error('Select a client and date'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('user_id', form.user_id);
      fd.append('issued_date', form.issued_date);
      if (file) fd.append('certificate', file);
      else if (form.certificate_url) fd.append('certificate_url', form.certificate_url);
      await api.post('/manager/certificates', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Certificate issued!');
      setModal(false);
      setForm({ user_id: '', issued_date: '', certificate_url: '' });
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to issue certificate');
    } finally { setSaving(false); }
  };

  const clientsWithCerts = users;

  return (
    <DashboardLayout title="Certificates" subtitle="Issue and manage client certificates of completion">
      <div className="flex justify-between items-center mb-6">
        <div className="text-purple-400 text-sm font-display">
          {users.length} client{users.length !== 1 ? 's' : ''} registered
        </div>
        <button onClick={() => setModal(true)} className="btn-gold text-sm px-5 py-2.5">
          <Plus size={18} /> Issue Certificate
        </button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-24 text-purple-500">
          <Award size={64} className="mx-auto mb-4 opacity-20" />
          <p className="font-display font-bold text-xl text-purple-400">No clients yet</p>
          <p className="text-sm mt-2 text-purple-600">Create client accounts first, then issue certificates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((client, i) => (
            <motion.div key={client.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card-dark p-5 hover:border-purple-600/40 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-gradient flex items-center justify-center font-display font-bold text-white">
                  {client.fullname[0]}
                </div>
                <div>
                  <p className="text-white font-display font-bold">{client.fullname}</p>
                  <p className="text-purple-400 text-xs capitalize">{client.client_type || 'client'}</p>
                </div>
              </div>
              <p className="text-purple-500 text-xs mb-3">{client.email || client.phone}</p>
              <button
                onClick={() => { setForm(f => ({ ...f, user_id: String(client.id) })); setModal(true); }}
                className="btn-outline w-full justify-center text-sm py-2">
                <Award size={15} /> Issue Certificate
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Issue Certificate Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md glass p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <Award size={22} className="text-gold-400" /> Issue Certificate
              </h3>
              <button onClick={() => setModal(false)} className="text-purple-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-input">Select Client *</label>
                <select value={form.user_id} onChange={e => setForm(p => ({ ...p, user_id: e.target.value }))} className="input-dark">
                  <option value="">Choose a client...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullname}</option>)}
                </select>
              </div>
              <div>
                <label className="label-input">Issue Date *</label>
                <input type="date" value={form.issued_date}
                  onChange={e => setForm(p => ({ ...p, issued_date: e.target.value }))}
                  className="input-dark" />
              </div>
              <div>
                <label className="label-input">Certificate File (optional)</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => setFile(e.target.files[0])}
                  className="input-dark file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-xs cursor-pointer" />
              </div>
              {!file && (
                <div>
                  <label className="label-input">Or Certificate URL</label>
                  <input value={form.certificate_url}
                    onChange={e => setForm(p => ({ ...p, certificate_url: e.target.value }))}
                    placeholder="https://..." className="input-dark" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-gold flex-1 justify-center">
                  {saving ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : <><Award size={16} /> Issue</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
