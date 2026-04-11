import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';

const FADE = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

export const TestimonialsPage = () => {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/public/testimonials').then(r => setItems(r.data)).catch(() => {}); }, []);
  return (
    <div className="bg-dark-950 min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
        <motion.div {...FADE} className="text-center mb-14">
          <span className="badge-gold mb-3">Testimonials</span>
          <h1 className="section-title text-white mt-3">What Our <span className="gradient-text">Clients Say</span></h1>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <motion.div key={i} {...FADE} transition={{ delay: i * 0.07 }} className="card-dark p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(t.rating || 5)].map((_, j) => <Star key={j} size={14} className="text-gold-400" fill="currentColor" />)}
              </div>
              <p className="text-purple-200 text-sm leading-relaxed mb-5">"{t.message}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-purple-900/30">
                <div className="w-9 h-9 rounded-full bg-purple-gradient flex items-center justify-center font-display font-bold text-white text-sm">
                  {t.client_name[0]}
                </div>
                <span className="text-white font-display font-semibold text-sm">{t.client_name}</span>
              </div>
            </motion.div>
          ))}
          {items.length === 0 && (
            <div className="col-span-3 text-center py-16 text-purple-400">
              <Star size={36} className="mx-auto mb-3 opacity-40" />
              <p>No testimonials yet.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  useEffect(() => { api.get('/public/projects-completed').then(r => setProjects(r.data)).catch(() => {}); }, []);
  const IMGS = [
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=600&q=80',
    'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
    'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600&q=80',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=80',
  ];
  return (
    <div className="bg-dark-950 min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
        <motion.div {...FADE} className="text-center mb-14">
          <span className="badge-gold mb-3">Portfolio</span>
          <h1 className="section-title text-white mt-3">Completed <span className="gradient-text">Projects</span></h1>
          <p className="text-purple-300 mt-3">A showcase of our best studio productions.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(projects.length > 0 ? projects : IMGS.map((img, i) => ({ id: i, title: `Studio Project ${i+1}`, description: 'Professional music production', img }))).map((p, i) => (
            <motion.div key={p.id || i} {...FADE} transition={{ delay: i * 0.07 }}
              className="group rounded-2xl overflow-hidden border border-purple-900/30 cursor-pointer hover:border-purple-600/50 transition-all">
              <div className="relative h-48 overflow-hidden">
                <img src={IMGS[i % IMGS.length]} alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent" />
              </div>
              <div className="p-4 bg-dark-800/60">
                <h3 className="font-display font-bold text-white text-sm mb-1">{p.title}</h3>
                <p className="text-purple-400 text-xs">{p.description || 'Music production project'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export const ServicesPage = () => {
  const SERVICES = [
    { title: 'Audio Production', img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80', desc: 'Full-service recording studio with state-of-the-art equipment for recording, mixing, and mastering your music to industry standards.' },
    { title: 'Vocal Training', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80', desc: 'Individual and group vocal coaching for all genres including gospel, RnB, afrobeat, and classical performance.' },
    { title: 'Choir Coaching', img: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80', desc: 'Expert choir direction, arrangement, and performance coaching for church choirs, school ensembles, and competition groups.' },
    { title: 'Piano Lessons', img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80', desc: 'Classical and contemporary piano training for beginners to advanced students with a structured curriculum.' },
    { title: 'Guitar Lessons', img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80', desc: 'Acoustic, electric, and bass guitar lessons tailored to your genre and skill level.' },
    { title: 'Drum Lessons', img: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&q=80', desc: 'Comprehensive drum tuition covering technique, rhythm, and live performance skills.' },
    { title: 'Website Development', img: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80', desc: 'Professional music portfolio websites, booking platforms, and digital presence for artists and studios.' },
    { title: 'Sonorization', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', desc: 'Full sound system setup and live audio management for concerts, weddings, corporate events, and church services.' },
  ];
  return (
    <div className="bg-dark-950 min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
        <motion.div {...FADE} className="text-center mb-14">
          <span className="badge-gold mb-3">Services</span>
          <h1 className="section-title text-white mt-3">What We <span className="gradient-text">Offer</span></h1>
        </motion.div>
        <div className="space-y-10">
          {SERVICES.map(({ title, img, desc }, i) => (
            <motion.div key={i} {...FADE} transition={{ delay: 0.1 }}
              className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 card-dark overflow-hidden rounded-3xl`}>
              <div className="md:w-2/5 h-56 md:h-auto overflow-hidden">
                <img src={img} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="md:w-3/5 p-8 flex flex-col justify-center">
                <h3 className="font-display font-bold text-2xl text-white mb-3">{title}</h3>
                <p className="text-purple-300 leading-relaxed mb-5">{desc}</p>
                <a href="/contact" className="btn-outline self-start text-sm">Book Now →</a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export const AboutPage = () => (
  <div className="bg-dark-950 min-h-screen">
    <Navbar />
    <div className="pt-28 pb-20 px-4 max-w-5xl mx-auto">
      <motion.div {...FADE} className="text-center mb-14">
        <span className="badge-gold mb-3">About Us</span>
        <h1 className="section-title text-white mt-3">The Story of <span className="gradient-text">Delight Music</span></h1>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <motion.div {...FADE}>
          <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80"
            alt="Studio" className="rounded-3xl w-full h-80 object-cover border border-purple-900/30" />
        </motion.div>
        <motion.div {...FADE} transition={{ delay: 0.15 }}>
          <h2 className="font-display font-bold text-3xl text-white mb-4">Our Mission</h2>
          <p className="text-purple-300 leading-relaxed mb-6">
            Delight Music Studio Center exists to unlock and amplify the musical talent of Rwanda and East Africa. 
            We provide world-class facilities, expert tutorship, and professional production services to transform 
            raw talent into polished artistry.
          </p>
          <h2 className="font-display font-bold text-3xl text-white mb-4">Our Vision</h2>
          <p className="text-purple-300 leading-relaxed">
            To become the leading music production and education hub in Africa, nurturing generations of 
            artists, producers, and performers who carry Rwandan music to the global stage.
          </p>
        </motion.div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Innovation', 'Excellence', 'Community'].map((v, i) => (
          <motion.div key={v} {...FADE} transition={{ delay: i * 0.1 }} className="card-dark p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center mx-auto mb-4">
              <Star size={20} className="text-dark-950" fill="currentColor" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-2">{v}</h3>
            <p className="text-purple-400 text-sm">We are committed to {v.toLowerCase()} in every project we undertake.</p>
          </motion.div>
        ))}
      </div>
    </div>
    <Footer />
  </div>
);
