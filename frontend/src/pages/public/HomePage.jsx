import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Music2, Mic2, Users, Star, ArrowRight, Play, Headphones,
  Piano, Guitar, Drum, Globe, Volume2, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import Navbar  from '../../components/layout/Navbar';
import Footer  from '../../components/layout/Footer';
import api, { fileUrl } from '../../services/api';

/* ─── Fallback static data ─────────────────────────────── */
const STATIC_SERVICES = [
  { icon: Headphones, title: 'Audio Production',   desc: 'Professional recording, mixing & mastering',   color: 'from-purple-600 to-purple-800' },
  { icon: Mic2,       title: 'Vocal Training',      desc: 'One-on-one and group vocal coaching sessions', color: 'from-gold-500 to-gold-600' },
  { icon: Users,      title: 'Choir Coaching',      desc: 'Expert direction for choirs of all sizes',     color: 'from-blue-600 to-blue-800' },
  { icon: Piano,      title: 'Piano Lessons',       desc: 'Classical and contemporary piano tuition',     color: 'from-pink-600 to-pink-800' },
  { icon: Guitar,     title: 'Guitar Lessons',      desc: 'Acoustic, electric and bass guitar training',  color: 'from-green-600 to-green-800' },
  { icon: Drum,       title: 'Drum Lessons',        desc: 'Rhythm and technique for all skill levels',    color: 'from-orange-600 to-orange-800' },
  { icon: Globe,      title: 'Website Development', desc: 'Custom music portfolio and promo sites',       color: 'from-cyan-600 to-cyan-800' },
  { icon: Volume2,    title: 'Sonorization',        desc: 'Live event sound design and PA systems',       color: 'from-red-600 to-red-800' },
];
const STATIC_STATS = [
  { value: '500+', label: 'Tracks Produced' },
  { value: '200+', label: 'Artists Trained' },
  { value: '50+',  label: 'Events Sonorized' },
  { value: '6+',   label: 'Years of Excellence' },
];
const ICON_MAP = { Headphones, Mic2, Users, Piano, Guitar, Drum, Globe, Volume2 };
const GRAD_COLORS = [
  'from-purple-600 to-purple-800','from-gold-500 to-gold-600','from-blue-600 to-blue-800',
  'from-pink-600 to-pink-800','from-green-600 to-green-800','from-orange-600 to-orange-800',
  'from-cyan-600 to-cyan-800','from-red-600 to-red-800',
];
const FADE_UP = { initial:{opacity:0,y:30}, whileInView:{opacity:1,y:0}, viewport:{once:true}, transition:{duration:0.5} };

export default function HomePage() {
  const [testimonials, setTestimonials] = useState([]);
  const [cmsContent,   setCmsContent]   = useState({});

  useEffect(() => {
    api.get('/public/testimonials').then(r => setTestimonials(r.data)).catch(() => {});
    api.get('/public/content').then(r => {
      // Group by section
      const grouped = {};
      (r.data || []).forEach(item => {
        if (!grouped[item.section]) grouped[item.section] = [];
        grouped[item.section].push(item);
      });
      setCmsContent(grouped);
    }).catch(() => {});
  }, []);

  // CMS helpers
  const heroItems    = cmsContent.hero     || [];
  const galleryItems = cmsContent.gallery  || [];
  const serviceItems = cmsContent.services || [];
  const aboutItems   = cmsContent.about    || [];
  const statsItems   = cmsContent.stats    || [];

  const heroMain  = heroItems[0];
  const heroTitle = heroMain?.title || 'Where Music Comes Alive';
  const heroSub   = heroMain?.subtitle || 'Professional audio production, vocal training, instrument lessons, and live event services in the heart of Kigali, Rwanda.';
  const heroBg    = heroMain?.image_url ? fileUrl(heroMain.image_url) : 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80';

  const displayStats = statsItems.length > 0
    ? statsItems.map(s => ({ value: s.title, label: s.subtitle }))
    : STATIC_STATS;

  const displayServices = serviceItems.length > 0
    ? serviceItems.map((s, i) => ({
        icon: ICON_MAP[s.subtitle] || Headphones,
        title: s.title,
        desc:  s.body,
        color: GRAD_COLORS[i % GRAD_COLORS.length],
        img:   s.image_url,
      }))
    : STATIC_SERVICES;

  const aboutMain = aboutItems[0];

  return (
    <div className="bg-dark-950 min-h-screen">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{ backgroundImage: `url('${heroBg}')` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-dark-950/80 via-dark-950/60 to-dark-950" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24">
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/30 mb-6">
            <Star size={13} className="text-gold-400" fill="currentColor" />
            <span className="text-gold-400 text-xs font-bold tracking-wider uppercase">Rwanda's Premier Music Studio</span>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            className="font-bold text-4xl sm:text-5xl md:text-7xl leading-tight mb-6">
            <span className="text-white">{heroTitle.split(' ').slice(0,-2).join(' ') || 'Where Music'}</span>
            <br />
            <span className="gradient-text">{heroTitle.split(' ').slice(-2).join(' ') || 'Comes Alive'}</span>
          </motion.h1>

          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
            className="text-purple-200 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {heroSub}
          </motion.p>

          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="btn-gold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 justify-center">
              Start Your Journey <ArrowRight size={18} />
            </Link>
            <Link to="/projects" className="btn-outline text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 justify-center">
              <Play size={16} fill="currentColor" /> Listen to Our Work
            </Link>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <div className="w-5 h-8 border-2 border-purple-500/40 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-1 rounded-full bg-purple-400" />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 border-y border-purple-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {displayStats.map(({ value, label }, i) => (
              <motion.div key={i} {...FADE_UP} transition={{ delay: i * 0.1 }} className="text-center">
                <p className="font-bold text-3xl sm:text-4xl gradient-text mb-1">{value}</p>
                <p className="text-purple-300 text-sm">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY (if CMS has gallery items) ── */}
      {galleryItems.length > 0 && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div {...FADE_UP} className="text-center mb-10">
              <span className="badge-gold mb-3">Gallery</span>
              <h2 className="section-title text-white mt-3">Our <span className="gradient-text">Studio</span></h2>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryItems.map((item, i) => (
                <motion.div key={item.id} {...FADE_UP} transition={{ delay: i * 0.06 }}
                  className="relative aspect-square rounded-2xl overflow-hidden group">
                  {item.image_url ? (
                    <img src={fileUrl(item.image_url)} alt={item.title || 'Gallery'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-dark-800 flex items-center justify-center">
                      <ImageIcon size={32} className="text-purple-700" />
                    </div>
                  )}
                  {item.title && (
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-semibold text-sm">{item.title}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SERVICES ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...FADE_UP} className="text-center mb-12">
            <span className="badge-gold mb-3">What We Offer</span>
            <h2 className="section-title text-white mt-3">Our <span className="gradient-text">Services</span></h2>
            <p className="text-purple-300 mt-3 max-w-xl mx-auto text-sm sm:text-base">
              From studio recording to live events — we cover every dimension of music production and education.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {displayServices.map(({ icon: Icon, title, desc, color, img }, i) => (
              <motion.div key={i} {...FADE_UP} transition={{ delay: i * 0.06 }}
                className="card-dark p-5 group hover:border-purple-600/50 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden">
                {img && (
                  <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                    <img src={fileUrl(img)} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="relative font-semibold text-white mb-2 text-sm sm:text-base">{title}</h3>
                <p className="relative text-purple-400 text-xs sm:text-sm leading-relaxed">{desc}</p>
                <div className="relative mt-3 flex items-center gap-1 text-gold-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT (if CMS has about content) ── */}
      {aboutMain && (
        <section className="py-16 px-4 sm:px-6 bg-dark-900/40">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {aboutMain.image_url && (
                <motion.div {...FADE_UP} className="rounded-2xl overflow-hidden">
                  <img src={fileUrl(aboutMain.image_url)} alt={aboutMain.title || 'About'}
                    className="w-full h-72 object-cover rounded-2xl" />
                </motion.div>
              )}
              <motion.div {...FADE_UP} className={aboutMain.image_url ? '' : 'md:col-span-2 text-center'}>
                <span className="badge-gold mb-3">About Us</span>
                <h2 className="section-title text-white mt-3 mb-4">
                  {aboutMain.title || 'About'} <span className="gradient-text">{aboutMain.subtitle || 'Delight Studio'}</span>
                </h2>
                {aboutMain.body && (
                  <p className="text-purple-300 leading-relaxed text-sm sm:text-base">{aboutMain.body}</p>
                )}
                {aboutItems.slice(1).map(item => item.body && (
                  <p key={item.id} className="text-purple-400 leading-relaxed mt-3 text-sm">{item.body}</p>
                ))}
                <Link to="/contact" className="btn-gold mt-6 inline-flex">
                  Get in Touch <ArrowRight size={15} />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── STUDIO BANNER ── */}
      <section className="py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-56 sm:h-72 md:h-96">
            <img
              src="https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=1400&q=80"
              alt="Studio" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/50 to-transparent flex items-center px-8 sm:px-12">
              <div>
                <span className="badge-gold mb-3">Join Us</span>
                <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl text-white mt-3 mb-4">
                  Ready to Create<br /><span className="gradient-text">Something Amazing?</span>
                </h2>
                <Link to="/contact" className="btn-gold text-sm sm:text-base">
                  Book a Session <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {testimonials.length > 0 && (
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div {...FADE_UP} className="text-center mb-10">
              <span className="badge-gold mb-3">Client Love</span>
              <h2 className="section-title text-white mt-3">What They <span className="gradient-text">Say</span></h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
              {testimonials.slice(0, 3).map((t, i) => (
                <motion.div key={i} {...FADE_UP} transition={{ delay: i * 0.1 }} className="card-dark p-5 sm:p-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(t.rating || 5)].map((_, j) => (
                      <Star key={j} size={13} className="text-gold-400" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-purple-200 text-sm leading-relaxed mb-4">"{t.message}"</p>
                  <p className="text-white font-semibold text-sm">— {t.client_name}</p>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/testimonials" className="btn-outline text-sm">
                View All Reviews <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
