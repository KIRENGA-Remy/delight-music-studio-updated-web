import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music2, Mic2, Users, Star, ArrowRight, Play, Headphones,
  Piano, Guitar, Drum, Globe, Volume2, ChevronRight } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';

const SERVICES = [
  { icon: Headphones, title: 'Audio Production',   desc: 'Professional recording, mixing & mastering',   color: 'from-purple-600 to-purple-800' },
  { icon: Mic2,       title: 'Vocal Training',      desc: 'One-on-one and group vocal coaching sessions', color: 'from-gold-500 to-gold-600' },
  { icon: Users,      title: 'Choir Coaching',      desc: 'Expert direction for choirs of all sizes',     color: 'from-blue-600 to-blue-800' },
  { icon: Piano,      title: 'Piano Lessons',       desc: 'Classical and contemporary piano tuition',     color: 'from-pink-600 to-pink-800' },
  { icon: Guitar,     title: 'Guitar Lessons',      desc: 'Acoustic, electric and bass guitar training',  color: 'from-green-600 to-green-800' },
  { icon: Drum,       title: 'Drum Lessons',        desc: 'Rhythm and technique for all skill levels',    color: 'from-orange-600 to-orange-800' },
  { icon: Globe,      title: 'Website Development', desc: 'Custom music portfolio and promo sites',       color: 'from-cyan-600 to-cyan-800' },
  { icon: Volume2,    title: 'Sonorization',        desc: 'Live event sound design and PA systems',       color: 'from-red-600 to-red-800' },
];

const STATS = [
  { value: '500+', label: 'Tracks Produced' },
  { value: '200+', label: 'Artists Trained' },
  { value: '50+',  label: 'Events Sonorized' },
  { value: '6+',   label: 'Years of Excellence' },
];

const FADE_UP = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

export default function HomePage() {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    api.get('/public/testimonials').then(r => setTestimonials(r.data)).catch(() => {});
  }, []);

  return (
    <div className="bg-dark-950 min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80')" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-dark-950/80 via-dark-950/60 to-dark-950" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-24">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/30 mb-6">
            <Star size={14} className="text-gold-400" fill="currentColor" />
            <span className="text-gold-400 text-xs font-display font-bold tracking-wider uppercase">Rwanda's Premier Music Studio</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="font-display font-bold text-5xl md:text-7xl leading-tight mb-6">
            <span className="text-white">Where Music</span>
            <br />
            <span className="gradient-text">Comes Alive</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-purple-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Professional audio production, vocal training, instrument lessons, and live event services in the heart of Kigali, Rwanda.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="btn-gold text-base px-8 py-4 justify-center">
              Start Your Journey <ArrowRight size={18} />
            </Link>
            <Link to="/projects" className="btn-outline text-base px-8 py-4 justify-center">
              <Play size={16} fill="currentColor" /> Listen to Our Work
            </Link>
          </motion.div>
        </div>
        {/* Floating music notes decoration */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-purple-500/30 rounded-full flex items-start justify-center pt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 border-y border-purple-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ value, label }, i) => (
              <motion.div key={i} {...FADE_UP} transition={{ delay: i * 0.1 }} className="text-center">
                <p className="font-display font-bold text-4xl gradient-text mb-1">{value}</p>
                <p className="text-purple-300 text-sm">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div {...FADE_UP} className="text-center mb-14">
            <span className="badge-gold mb-3">What We Offer</span>
            <h2 className="section-title text-white mt-3">
              Our <span className="gradient-text">Services</span>
            </h2>
            <p className="text-purple-300 mt-3 max-w-xl mx-auto">
              From studio recording to live events — we cover every dimension of music production and education.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={i} {...FADE_UP} transition={{ delay: i * 0.07 }}
                className="card-dark p-5 group hover:border-purple-600/50 hover:-translate-y-1 transition-all cursor-pointer">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:shadow-purple transition-shadow`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-display font-bold text-white mb-2 text-sm">{title}</h3>
                <p className="text-purple-400 text-xs leading-relaxed">{desc}</p>
                <div className="mt-4 flex items-center gap-1 text-gold-400 text-xs font-display font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight size={13} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STUDIO IMAGE BANNER */}
      <section className="py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden h-72 md:h-96">
            <img src="https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=1400&q=80"
              alt="Studio" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/40 to-transparent flex items-center px-12">
              <div>
                <span className="badge-gold mb-3">Join Us</span>
                <h2 className="font-display font-bold text-4xl text-white mt-3 mb-4">
                  Ready to Create<br /><span className="gradient-text">Something Amazing?</span>
                </h2>
                <Link to="/contact" className="btn-gold">
                  Book a Session <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS PREVIEW */}
      {testimonials.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div {...FADE_UP} className="text-center mb-12">
              <span className="badge-gold mb-3">Client Love</span>
              <h2 className="section-title text-white mt-3">What They <span className="gradient-text">Say</span></h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.slice(0, 3).map((t, i) => (
                <motion.div key={i} {...FADE_UP} transition={{ delay: i * 0.1 }}
                  className="card-dark p-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(t.rating || 5)].map((_, j) => (
                      <Star key={j} size={14} className="text-gold-400" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-purple-200 text-sm leading-relaxed mb-4">"{t.message}"</p>
                  <p className="text-white font-display font-bold text-sm">— {t.client_name}</p>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/testimonials" className="btn-outline">
                View All Reviews <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
