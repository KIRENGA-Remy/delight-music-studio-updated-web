import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Music, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { to: '/',            label: 'Home' },
  { to: '/about',       label: 'About' },
  { to: '/services',    label: 'Services' },
  { to: '/projects',    label: 'Projects' },
  { to: '/testimonials',label: 'Testimonials' },
  { to: '/contact',     label: 'Contact' },
];

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  const dashPath = user?.role === 'manager' ? '/dashboard/manager'
    : user?.role === 'producer' ? '/dashboard/producer'
    : '/dashboard/client';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-dark-950/95 backdrop-blur-xl border-b border-purple-900/40 shadow-glow'
               : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-purple-gradient flex items-center justify-center shadow-purple group-hover:shadow-gold transition-all">
              <Music size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-display font-bold text-white text-sm leading-none">Delight</p>
              <p className="font-display text-gold-400 text-[11px] tracking-wider uppercase">Music Studio</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-4 py-2 rounded-lg font-display font-semibold text-sm transition-all ${
                  location.pathname === to
                    ? 'text-gold-400 bg-gold-500/10'
                    : 'text-purple-200 hover:text-white hover:bg-white/5'
                }`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <button onClick={() => navigate(dashPath)} className="btn-gold text-sm px-5 py-2.5">
                Dashboard
              </button>
            ) : (
              <Link to="/login" className="btn-outline text-sm px-5 py-2.5">
                <LogIn size={15} /> Sign In
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(p => !p)}
            className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-dark-950/98 border-b border-purple-900/40 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to}
                  className={`block px-4 py-3 rounded-xl font-display font-semibold text-sm transition-all ${
                    location.pathname === to
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-purple-200 hover:text-white hover:bg-white/5'
                  }`}>
                  {label}
                </Link>
              ))}
              <div className="pt-2">
                {isAuthenticated ? (
                  <button onClick={() => navigate(dashPath)} className="btn-gold w-full justify-center text-sm">
                    Go to Dashboard
                  </button>
                ) : (
                  <Link to="/login" className="btn-outline w-full justify-center text-sm">
                    <LogIn size={15} /> Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
