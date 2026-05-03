import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Instagram, Twitter, Facebook, Youtube, Linkedin, MapPin, Mail, Phone } from 'lucide-react';

const Footer = () => (
  <footer className="bg-dark-950 border-t border-purple-900/30">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-gradient flex items-center justify-center">
              <Music size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-md">Delight Music</p>
              <p className="text-gold-400 text-[10px] font-display tracking-wider">STUDIO CENTER</p>
            </div>
          </div>
          <p className="text-purple-300 text-md leading-relaxed mb-5">
            Rwanda's premier music production studio, empowering artists and creators since 2019.
          </p>
          <div className="flex items-center gap-3">
            {[
              { href: '#', icon: Instagram },
              { href: '#', icon: Twitter },
              { href: '#', icon: Facebook },
              { href: '#', icon: Youtube },
              { href: '#', icon: Linkedin },
            ].map(({ href, icon: Icon }, i) => (
              <a key={i} href={href}
                className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-800/40 flex items-center justify-center text-purple-300 hover:text-gold-400 hover:border-gold-500/40 transition-all">
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display font-bold text-white mb-4 text-md uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2.5">
            {[['/', 'Home'], ['/about', 'About Us'], ['/services', 'Services'],
              ['/projects', 'Projects'], ['/testimonials', 'Testimonials'], ['/contact', 'Contact']].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-purple-300 hover:text-gold-400 text-md transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-display font-bold text-white mb-4 text-md uppercase tracking-wider">Services</h4>
          <ul className="space-y-2.5 text-md text-purple-300">
            {['Audio Production', 'Vocal Training', 'Choir Coaching', 'Piano Lessons',
              'Guitar Lessons', 'Drum Lessons', 'Website Development', 'Sonorization'].map(s => (
              <li key={s} className="hover:text-gold-400 transition-colors cursor-pointer">{s}</li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-display font-bold text-white mb-4 text-md uppercase tracking-wider">Contact</h4>
          <ul className="space-y-3 text-md">
            <li className="flex items-start gap-2.5 text-purple-300">
              <MapPin size={15} className="text-gold-400 mt-0.5 flex-shrink-0" />
              Kigali, Rwanda — Gisozi, KG 15 Ave
            </li>
            <li className="flex items-center gap-2.5 text-purple-300">
              <Phone size={15} className="text-gold-400 flex-shrink-0" />
              +250 788 888 001
            </li>
            <li className="flex items-center gap-2.5 text-purple-300">
              <Mail size={15} className="text-gold-400 flex-shrink-0" />
              info@delightmusic.com
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-purple-900/30 mt-10 pt-6">
        <p className="text-purple-400 text-md">© 2025 Delight Music Studio Center. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
