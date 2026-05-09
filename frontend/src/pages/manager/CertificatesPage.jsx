import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Printer, X, Edit2, Check, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/* ─── Certificate preview component ─────────────────────── */
function CertificatePreview({ clientName, issuerName, issuerRole, issueDate, studioName }) {
  return (
    <div id="certificate-print" className="bg-white text-gray-900 p-0 print:block" style={{ fontFamily: 'Georgia, serif' }}>
      <div style={{
        width: '100%', minHeight: '540px', border: '12px double #7C3AED',
        padding: '48px', position: 'relative', background: '#fff',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(147,51,234,0.04) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(245,200,66,0.04) 0%, transparent 50%)',
      }}>
        {/* Corners */}
        {[['top-3 left-3','border-t-2 border-l-2'],['top-3 right-3','border-t-2 border-r-2'],['bottom-3 left-3','border-b-2 border-l-2'],['bottom-3 right-3','border-b-2 border-r-2']].map(([pos, cls]) => (
          <div key={pos} className={`absolute ${pos} w-8 h-8 border-purple-600 ${cls}`} />
        ))}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '13px', letterSpacing: '6px', color: '#7C3AED', fontFamily: 'sans-serif', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>
            {studioName || 'Delight Music Studio'}
          </div>
          <div style={{ width: '80px', height: '2px', background: 'linear-gradient(90deg, #7C3AED, #E8B800)', margin: '0 auto 20px' }} />
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#1a1a2e', letterSpacing: '2px', marginBottom: '4px' }}>
            Certificate
          </div>
          <div style={{ fontSize: '16px', color: '#5B21B6', letterSpacing: '4px', fontFamily: 'sans-serif', textTransform: 'uppercase', fontWeight: 500 }}>
            of Completion
          </div>
        </div>

        {/* Body */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '18px', fontFamily: 'sans-serif', letterSpacing: '1px' }}>
            This is to certify that
          </p>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#7C3AED', fontStyle: 'italic', borderBottom: '2px solid #E8B800', display: 'inline-block', padding: '0 32px 8px', marginBottom: '20px' }}>
            {clientName || 'Client Name'}
          </div>
          <p style={{ fontSize: '14px', color: '#555', maxWidth: '480px', margin: '0 auto', lineHeight: '1.8', fontFamily: 'sans-serif' }}>
            has successfully completed a professional project at{' '}
            <strong>{studioName || 'Delight Music Studio'}</strong> and demonstrated
            outstanding commitment, creativity, and musical excellence throughout the engagement.
          </p>
        </div>

        {/* Gold star decoration */}
        <div style={{ textAlign: 'center', fontSize: '28px', marginBottom: '28px', color: '#E8B800' }}>
          ★ ★ ★
        </div>

        {/* Footer - signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ borderTop: '1px solid #999', paddingTop: '8px', marginTop: '48px', minWidth: '160px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a2e', fontFamily: 'sans-serif' }}>{issuerName || 'Studio Manager'}</p>
              <p style={{ fontSize: '11px', color: '#666', fontFamily: 'sans-serif' }}>{issuerRole || 'Manager'}</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              border: '3px solid #7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(124,58,237,0.08)',
            }}>
              <span style={{ fontSize: '10px', color: '#7C3AED', fontWeight: 700, fontFamily: 'sans-serif', textAlign: 'center', lineHeight: 1.2 }}>OFFICIAL<br/>STAMP</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ borderTop: '1px solid #999', paddingTop: '8px', marginTop: '48px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a2e', fontFamily: 'sans-serif' }}>Date of Issue</p>
              <p style={{ fontSize: '12px', color: '#666', fontFamily: 'sans-serif' }}>
                {issueDate ? new Date(issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function ManagerCertificatesPage() {
  const { user } = useAuth();
  const [clients,  setClients]  = useState([]);
  const [modal,    setModal]    = useState(false);
  const [preview,  setPreview]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({
    user_id:     '',
    issued_date: new Date().toISOString().substring(0, 10),
    issuer_name: user?.fullname || '',
    issuer_role: 'Manager',
    studio_name: 'Delight Music Studio',
  });

  useEffect(() => {
    api.get('/manager/users')
      .then(r => setClients(r.data.filter(u => u.role === 'client')))
      .catch(() => toast.error('Failed to load clients'));
  }, []);

  useEffect(() => {
    setForm(p => ({ ...p, issuer_name: user?.fullname || p.issuer_name }));
  }, [user]);

  const selectedClient = clients.find(c => String(c.id) === String(form.user_id));

  const handlePrint = () => {
    if (!form.user_id) { toast.error('Select a client first'); return; }
    window.print();
  };

  const saveCertificate = async (e) => {
    e.preventDefault();
    if (!form.user_id || !form.issued_date) { toast.error('Select client and date'); return; }
    setSaving(true);
    try {
      await api.post('/manager/certificates', {
        user_id:     form.user_id,
        issued_date: form.issued_date,
        certificate_url: null,
      });
      toast.success('Certificate record saved!');
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <DashboardLayout title="Certificates" subtitle="Generate and issue certificates of completion">
      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#print-root) { display: none !important; }
          #certificate-print { display: block !important; }
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
        @media screen {
          #certificate-print { display: none; }
        }
      `}</style>

      <div className="no-print">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-purple-400 text-sm">
            {clients.length} client{clients.length !== 1 ? 's' : ''} registered
          </p>
          <button onClick={() => setModal(true)} className="btn-gold">
            <Plus size={16} /> Generate Certificate
          </button>
        </div>

        {/* Client grid */}
        {clients.length === 0 ? (
          <div className="text-center py-24 text-purple-500">
            <Award size={56} className="mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-lg text-purple-400">No clients yet</p>
            <p className="text-sm mt-2 text-purple-600">Create client accounts first, then generate certificates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client, i) => (
              <motion.div key={client.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card-dark p-5 hover:border-purple-600/40 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-gradient flex items-center justify-center font-bold text-white text-sm">
                    {client.fullname[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{client.fullname}</p>
                    <p className="text-purple-400 text-xs capitalize">{client.client_type || 'client'}</p>
                  </div>
                </div>
                <p className="text-purple-500 text-xs mb-4 truncate">{client.email || client.phone}</p>
                <button
                  onClick={() => {
                    f('user_id', String(client.id));
                    setModal(true);
                  }}
                  className="btn-outline w-full justify-center text-sm py-2">
                  <Award size={14} /> Generate Certificate
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden certificate for printing */}
      <div id="print-root">
        <CertificatePreview
          clientName={selectedClient?.fullname}
          issuerName={form.issuer_name}
          issuerRole={form.issuer_role}
          issueDate={form.issued_date}
          studioName={form.studio_name}
        />
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-dark-900 border border-purple-800/40 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Award size={18} className="text-gold-400" /> Generate Certificate
                </h3>
                <button onClick={() => setModal(false)} className="text-purple-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <form onSubmit={saveCertificate} className="space-y-4">
                  <div>
                    <label className="label-input">Client *</label>
                    <select value={form.user_id} onChange={e => f('user_id', e.target.value)} className="input-dark">
                      <option value="">Select client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.fullname}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-input">Issue Date *</label>
                    <input type="date" value={form.issued_date} onChange={e => f('issued_date', e.target.value)} className="input-dark" />
                  </div>
                  <div>
                    <label className="label-input">Issuer Name</label>
                    <input value={form.issuer_name} onChange={e => f('issuer_name', e.target.value)}
                      placeholder="Your full name" className="input-dark" />
                  </div>
                  <div>
                    <label className="label-input">Issuer Role / Title</label>
                    <input value={form.issuer_role} onChange={e => f('issuer_role', e.target.value)}
                      placeholder="Manager / Director" className="input-dark" />
                  </div>
                  <div>
                    <label className="label-input">Studio Name</label>
                    <input value={form.studio_name} onChange={e => f('studio_name', e.target.value)}
                      placeholder="Delight Music Studio" className="input-dark" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1 justify-center">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="btn-gold flex-1 justify-center">
                      {saving ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : <><Check size={14} /> Save Record</>}
                    </button>
                  </div>
                  <button type="button" onClick={handlePrint}
                    disabled={!form.user_id}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-500/60 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 disabled:opacity-40 font-medium text-sm transition-all">
                    <Printer size={15} /> Print / Download Certificate
                  </button>
                </form>

                {/* Live preview */}
                <div>
                  <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">Live Preview</p>
                  <div className="rounded-xl overflow-hidden border border-purple-900/30 bg-white" style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '181%', height: '340px' }}>
                    <CertificatePreview
                      clientName={selectedClient?.fullname || 'Client Name'}
                      issuerName={form.issuer_name}
                      issuerRole={form.issuer_role}
                      issueDate={form.issued_date}
                      studioName={form.studio_name}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
