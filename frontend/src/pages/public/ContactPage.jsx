import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';

const CLIENT_TYPES = ['artist', 'student', 'intern', 'event_planner', 'other'];

export default function ContactPage() {
  const [form, setForm] = useState({ fullname: '', email: '', phone: '', client_type: '', message: '' });
  const [loading,  setLoading]  = useState(false);
  const [submitted,setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullname || !form.email) { toast.error('Name and email are required'); return; }
    setLoading(true);
    try {
      await api.post('/public/partner-request', form);
      setSubmitted(true);
      toast.success('Request submitted! We will contact you soon.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-950 min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <span className="badge-gold mb-3">Get In Touch</span>
          <h1 className="section-title text-white mt-3">Partner With <span className="gradient-text">Delight Music</span></h1>
          <p className="text-purple-300 mt-3 max-w-xl mx-auto">
            Ready to start your musical journey? Fill in the form and our team will reach out to you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            {[
              { icon: MapPin, label: 'Address', value: 'Gisozi, KG 15 Ave, Kigali, Rwanda' },
              { icon: Phone,  label: 'Phone',   value: '+250 788 888 001' },
              { icon: Mail,   label: 'Email',   value: 'info@delightmusic.com' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="card-dark p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-gradient flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-purple-400 text-xs font-display font-semibold uppercase tracking-wider">{label}</p>
                  <p className="text-white text-sm mt-1">{value}</p>
                </div>
              </div>
            ))}
            {/* Map embed placeholder */}
            <div className="rounded-2xl overflow-hidden border border-purple-900/30 h-52 bg-dark-800/60 flex items-center justify-center">
              <div className="text-center text-purple-500">
                <MapPin size={32} className="mx-auto mb-2 text-gold-400" />
                <p className="text-sm">Kigali, Rwanda</p>
                <p className="text-xs mt-1">Gisozi, KG 15 Ave</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3 glass p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <h3 className="font-display font-bold text-2xl text-white mb-2">Request Submitted!</h3>
                <p className="text-purple-300">Our team will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-input">Full Name *</label>
                    <input value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))}
                      placeholder="Jean Habimana" className="input-dark" />
                  </div>
                  <div>
                    <label className="label-input">Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com" className="input-dark" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-input">Phone</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+250 788 000 000" className="input-dark" />
                  </div>
                  <div>
                    <label className="label-input">I am a...</label>
                    <select value={form.client_type} onChange={e => setForm(p => ({ ...p, client_type: e.target.value }))}
                      className="input-dark">
                      <option value="">Select type...</option>
                      {CLIENT_TYPES.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label-input">Message</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us about your project or goals..." rows={5}
                    className="input-dark resize-none" />
                </div>
                <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                    : <><Send size={16} /> Send Request</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
