import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function ManagerCalendarPage() {
  const [projects, setProjects] = useState([]);
  const [today]    = useState(new Date());
  const [current,  setCurrent]  = useState(new Date());

  useEffect(() => {
    api.get('/manager/dashboard')
      .then(r => setProjects(r.data.recent_projects || []))
      .catch(() => toast.error('Failed to load projects'));
  }, []);

  const year  = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsOnDay = (day) => {
    const d = new Date(year, month, day);
    return projects.filter(p => {
      if (!p.deadline) return false;
      const dl = new Date(p.deadline);
      return dl.getFullYear() === d.getFullYear() && dl.getMonth() === d.getMonth() && dl.getDate() === d.getDate();
    });
  };

  const statusColor = (s) => ({
    pending: 'bg-gold-400', in_progress: 'bg-purple-400', completed: 'bg-green-400', cancelled: 'bg-red-400'
  }[s] || 'bg-gold-400');

  const upcoming = projects
    .filter(p => p.deadline && new Date(p.deadline) >= today && p.status !== 'completed')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 8);

  const overdue = projects.filter(p => p.deadline && new Date(p.deadline) < today && p.status !== 'completed' && p.status !== 'cancelled');

  return (
    <DashboardLayout title="Calendar" subtitle="Studio project deadlines and schedule">
      {overdue.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-display font-bold text-sm">
              {overdue.length} overdue project{overdue.length !== 1 ? 's' : ''}
            </p>
            <p className="text-red-400 text-xs mt-0.5">{overdue.map(p => p.title).join(', ')}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-dark p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white text-xl">{MONTHS[month]} {year}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrent(new Date(year, month - 1, 1))}
                className="p-2 rounded-xl text-purple-400 hover:text-white hover:bg-purple-800/30 transition-all">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrent(new Date())}
                className="px-3 py-1.5 rounded-xl text-purple-300 hover:text-white border border-purple-800/40 hover:bg-purple-800/30 text-xs font-display transition-all">
                Today
              </button>
              <button onClick={() => setCurrent(new Date(year, month + 1, 1))}
                className="p-2 rounded-xl text-purple-400 hover:text-white hover:bg-purple-800/30 transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-display font-bold text-purple-400 uppercase tracking-widest py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const events = eventsOnDay(day);
              const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <div key={day}
                  className={`min-h-12 p-1.5 rounded-xl border transition-all ${
                    isToday ? 'border-purple-500 bg-purple-900/30' :
                    isPast ? 'border-purple-900/10 opacity-60' : 'border-purple-900/20 hover:border-purple-700/40'
                  }`}>
                  <span className={`text-sm font-display font-semibold ${isToday ? 'text-purple-300' : isPast ? 'text-purple-600' : 'text-purple-200'}`}>
                    {day}
                  </span>
                  {events.slice(0, 2).map(ev => (
                    <div key={ev.id} className={`mt-0.5 h-1.5 rounded-full ${statusColor(ev.status)}`} title={ev.title} />
                  ))}
                  {events.length > 2 && <div className="text-purple-500 text-xs">+{events.length - 2}</div>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 flex-wrap">
            {[['bg-gold-400','Pending'],['bg-purple-400','In Progress'],['bg-green-400','Completed'],['bg-red-400','Cancelled']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-2 text-xs text-purple-400 font-display">
                <div className={`w-2.5 h-2.5 rounded-full ${c}`} />{l}
              </div>
            ))}
          </div>
        </div>

        <div className="card-dark p-5">
          <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-purple-400">
            <Clock size={16} className="text-gold-400" /> Upcoming Deadlines
          </h3>
          {upcoming.length === 0 ? (
            <div className="text-center py-10 text-purple-500">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(p => {
                const dl = new Date(p.deadline);
                const daysLeft = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
                return (
                  <div key={p.id} className="p-3 rounded-xl bg-dark-800/80 border border-purple-900/20">
                    <p className="text-white text-sm font-display font-semibold truncate">{p.title}</p>
                    <p className="text-purple-400 text-xs mt-0.5">Client: {p.client_name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-purple-500 text-xs">{dl.toLocaleDateString()}</p>
                      <p className={`text-xs font-display font-bold ${
                        daysLeft <= 2 ? 'text-red-400' : daysLeft <= 7 ? 'text-gold-400' : 'text-green-400'
                      }`}>
                        {daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
