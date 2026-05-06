import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function ClientCalendarPage() {
  const [projects, setProjects] = useState([]);
  const [today]    = useState(new Date());
  const [current,  setCurrent] = useState(new Date());

  useEffect(() => {
    api.get('/client/projects')
      .then(r => setProjects(r.data))
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

  const statusColor = (s) => ({ pending: 'bg-gold-400', in_progress: 'bg-purple-400', completed: 'bg-green-400', cancelled: 'bg-red-400' }[s] || 'bg-gold-400');

  const upcomingDeadlines = projects
    .filter(p => p.deadline && new Date(p.deadline) >= today)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  return (
    <DashboardLayout title="Calendar" subtitle="Track your project deadlines">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card-dark p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white text-xl">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrent(new Date(year, month - 1, 1))}
                className="p-2 rounded-xl text-purple-400 hover:text-white hover:bg-purple-800/30 transition-all">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrent(new Date())}
                className="px-3 py-1.5 rounded-xl text-purple-300 hover:text-white border border-purple-800/40 hover:bg-purple-800/30 text-sm font-display transition-all">
                Today
              </button>
              <button onClick={() => setCurrent(new Date(year, month + 1, 1))}
                className="p-2 rounded-xl text-purple-400 hover:text-white hover:bg-purple-800/30 transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-display font-bold text-purple-400 uppercase tracking-widest py-2">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const events = eventsOnDay(day);
              return (
                <motion.div key={day} whileHover={{ scale: 1.05 }}
                  className={`min-h-12 p-1.5 rounded-xl border transition-all cursor-default ${
                    isToday ? 'border-purple-500 bg-purple-900/30' : 'border-purple-900/20 hover:border-purple-700/40'
                  }`}>
                  <span className={`text-sm font-display font-semibold ${isToday ? 'text-purple-300' : 'text-purple-200'}`}>
                    {day}
                  </span>
                  {events.map(ev => (
                    <div key={ev.id} className={`mt-0.5 h-1.5 rounded-full ${statusColor(ev.status)}`} title={ev.title} />
                  ))}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 flex-wrap">
            {[['bg-gold-400','Pending'],['bg-purple-400','In Progress'],['bg-green-400','Completed']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-2 text-xs text-purple-400 font-display">
                <div className={`w-2.5 h-2.5 rounded-full ${c}`} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="card-dark p-5">
          <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gold-400" /> Upcoming Deadlines
          </h3>
          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-10 text-purple-500">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map(p => {
                const dl = new Date(p.deadline);
                const daysLeft = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-xl bg-dark-800/80 border border-purple-900/20">
                    <p className="text-white text-sm font-display font-semibold truncate">{p.title}</p>
                    <p className="text-purple-400 text-xs mt-0.5">{dl.toLocaleDateString()}</p>
                    <p className={`text-xs font-display font-bold mt-1 ${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-gold-400' : 'text-green-400'}`}>
                      {daysLeft === 0 ? 'Today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* All projects list */}
          <h3 className="font-display font-bold text-white mt-6 mb-3 text-sm uppercase tracking-widest text-purple-400">All Projects</h3>
          <div className="space-y-2">
            {projects.length === 0 && <p className="text-purple-500 text-sm">No projects yet</p>}
            {projects.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor(p.status)}`} />
                <p className="text-purple-300 text-sm truncate">{p.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
