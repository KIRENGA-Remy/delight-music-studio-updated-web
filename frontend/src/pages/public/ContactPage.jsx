import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send, CheckCircle, Clock, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar  from '../../components/layout/Navbar';
import Footer  from '../../components/layout/Footer';
import api from '../../services/api';

const CLIENT_TYPES = ['artist','student','intern','event_planner','other'];

const CONTACT = {
  address:    'Ruyenzi, Kamonyi District, Southern Province, Rwanda',
  road:       'Near Ruyenzi Trading Centre — Kamonyi–Kigali Road (RN1)',
  phone:      '+250 788 888 001',
  email:      'info@delightmusic.rw',
  whatsapp:   'https://wa.me/250783359865',
  hours:      'Sun – Fri: 9:00 AM – 9:00 PM',
  mapUrl:     'https://maps.google.com/?q=Ruyenzi,Kamonyi,Rwanda',
  /* Google Maps embed — centred on Ruyenzi, Kamonyi District */
  mapEmbed:   'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.0!2d29.845!3d-2.095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dc3a8b9c2e5555%3A0xb27a9f3c7d6e1234!2sRuyenzi%2C%20Kamonyi%2C%20Rwanda!5e0!3m2!1sen!2srw!4v1700000000000!5m2!1sen!2srw',
};

export default function ContactPage() {
  const [form, setForm] = useState({ fullname: '', email: '', phone: '', client_type: '', message: '' });
  const [loading,  setLoading]   = useState(false);
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
    } finally { setLoading(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="bg-dark-950 min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-12">
          <span className="badge-gold mb-3">Get In Touch</span>
          <h1 className="section-title text-white mt-3">Partner With <span className="gradient-text">Delight Music</span></h1>
          <p className="text-purple-300 mt-3 max-w-xl mx-auto text-sm sm:text-base">
            Ready to start your musical journey? Fill in the form and our team will reach out within 24 hours.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* Contact details */}
          <div className="lg:col-span-2 space-y-4">
            {[
              { icon: MapPin,    label: 'Address',       value: CONTACT.address,  sub: CONTACT.road },
              { icon: Navigation,label: 'Road',          value: CONTACT.road,     href: CONTACT.mapUrl },
              { icon: Phone,     label: 'Phone',         value: CONTACT.phone,    href: `tel:${CONTACT.phone}` },
              { icon: Mail,      label: 'Email',         value: CONTACT.email,    href: `mailto:${CONTACT.email}` },
              { icon: Clock,     label: 'Working Hours', value: CONTACT.hours },
            ].map(({ icon: Icon, label, value, sub, href }) => (
              <motion.div key={label} initial={{ opacity:0, x:-15 }} animate={{ opacity:1, x:0 }}
                className="card-dark p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-gradient flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                      className="text-white text-sm mt-0.5 hover:text-gold-400 transition-colors block">{value}</a>
                  ) : (
                    <p className="text-white text-sm mt-0.5">{value}</p>
                  )}
                  {sub && <p className="text-purple-500 text-xs mt-0.5">{sub}</p>}
                </div>
              </motion.div>
            ))}

            {/* Google Map embed */}
            <div className="rounded-2xl overflow-hidden border border-purple-900/30 h-52 relative">
              <iframe
                title="Delight Music Studio — Ruyenzi, Kamonyi"
                src={CONTACT.mapEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a href={CONTACT.mapUrl} target="_blank" rel="noreferrer"
                className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-dark-950/90 text-gold-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-dark-900 transition-all">
                <Navigation size={11} /> Open in Maps
              </a>
            </div>

            {/* WhatsApp CTA */}
            <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 font-semibold text-sm transition-all">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          {/* Form */}
          <div className="lg:col-span-3 glass p-6 sm:p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <h3 className="font-semibold text-2xl text-white mb-2">Request Submitted!</h3>
                <p className="text-purple-300 text-sm">Our team will get back to you within 24 hours.</p>
                <button onClick={() => setSubmitted(false)} className="btn-outline mt-6 mx-auto text-sm">
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-semibold text-xl text-white mb-5">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-input">Full Name *</label>
                      <input value={form.fullname} onChange={e => f('fullname', e.target.value)}
                        placeholder="Jean Paul Habimana" className="input-dark" />
                    </div>
                    <div>
                      <label className="label-input">Email Address *</label>
                      <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                        placeholder="yourname@email.com" className="input-dark" />
                    </div>
                    <div>
                      <label className="label-input">Phone Number</label>
                      <input value={form.phone} onChange={e => f('phone', e.target.value)}
                        placeholder="+250 7XX XXX XXX" className="input-dark" />
                    </div>
                    <div>
                      <label className="label-input">I am a...</label>
                      <select value={form.client_type} onChange={e => f('client_type', e.target.value)} className="input-dark">
                        <option value="">Select type</option>
                        {CLIENT_TYPES.map(t => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label-input">Message</label>
                    <textarea value={form.message} onChange={e => f('message', e.target.value)}
                      rows={5} placeholder="Tell us about your project, what you need, and when you want to start..."
                      className="input-dark resize-none text-sm" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3 text-sm sm:text-base">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                      : <><Send size={16} /> Send Message</>
                    }
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
