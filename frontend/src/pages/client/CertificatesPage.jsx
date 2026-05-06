import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

export default function ClientCertificatesPage() {
  const [certs, setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/client/certificates')
      .then(r => setCerts(r.data))
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Certificates" subtitle="Your certificates of completion from Delight Music Studio">
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : certs.length === 0 ? (
        <div className="text-center py-24 text-purple-500">
          <Award size={64} className="mx-auto mb-4 opacity-20" />
          <p className="font-display font-bold text-xl text-purple-400">No certificates yet</p>
          <p className="text-sm mt-2 text-purple-600">
            Complete a project to earn your certificate of achievement from Delight Music Studio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {certs.map((cert, i) => (
            <motion.div key={cert.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="card-dark p-6 hover:border-gold-500/30 transition-all group">
              {/* Certificate header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform">
                  <Award size={28} className="text-dark-950" />
                </div>
                <div>
                  <p className="font-display font-bold text-white text-lg">Certificate of Completion</p>
                  <p className="text-purple-400 text-sm">Delight Music Studio</p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-dark-800/60 rounded-xl p-4 mb-4 border border-gold-500/10">
                <div className="flex items-center gap-2 text-sm text-purple-300 mb-2">
                  <Shield size={14} className="text-gold-400" />
                  <span className="font-display font-semibold">Issued by Delight Music Studio</span>
                </div>
                <p className="text-purple-400 text-xs">
                  Date: {cert.issued_date ? new Date(cert.issued_date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  }) : 'Date not specified'}
                </p>
              </div>

              {cert.certificate_url ? (
                <a href={`https://delightmusicstudio.onrender.com${cert.certificate_url}`}
                  download target="_blank" rel="noreferrer"
                  className="btn-gold w-full justify-center text-sm py-2.5">
                  <Download size={16} /> Download Certificate
                </a>
              ) : (
                <div className="w-full py-2.5 rounded-xl bg-purple-900/20 border border-purple-800/30 text-purple-400 text-sm font-display font-semibold text-center">
                  Certificate pending upload
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
