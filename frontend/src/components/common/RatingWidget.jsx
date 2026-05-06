import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, Trash2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function RatingWidget({ projectId, projectTitle, onRated }) {
  const { user } = useAuth();
  const [data,     setData]    = useState(null);
  const [hovered,  setHovered] = useState(0);
  const [score,    setScore]   = useState(0);
  const [comment,  setComment] = useState('');
  const [saving,   setSaving]  = useState(false);
  const [expanded, setExpanded]= useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/ratings/project/${projectId}`);
      setData(res.data);
      // Pre-fill my rating if it exists
      const mine = res.data.ratings.find(r => r.rated_by === user?.id);
      if (mine) { setScore(mine.score); setComment(mine.comment || ''); }
    } catch {}
  };

  useEffect(() => { if (projectId) load(); }, [projectId]);

  const submit = async () => {
    if (!score) { toast.error('Select a star rating'); return; }
    setSaving(true);
    try {
      await api.post('/ratings', { project_id: projectId, score, comment });
      toast.success('Rating submitted!');
      await load();
      onRated?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const deleteRating = async (id) => {
    try {
      await api.delete(`/ratings/${id}`);
      toast.success('Rating removed');
      setScore(0); setComment('');
      await load();
    } catch { toast.error('Failed'); }
  };

  const avg = data?.average ? parseFloat(data.average) : 0;
  const myRating = data?.ratings?.find(r => r.rated_by === user?.id);

  return (
    <div className="card-dark p-4">
      <button onClick={() => setExpanded(p => !p)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-gold-400" fill={avg > 0 ? 'currentColor' : 'none'} />
          <span className="font-display font-bold text-white text-sm">
            {avg > 0 ? `${avg} / 5` : 'Rate this project'}
          </span>
          {data?.count > 0 && (
            <span className="text-purple-400 text-xs">({data.count} rating{data.count !== 1 ? 's' : ''})</span>
          )}
        </div>
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={14}
              className={s <= avg ? 'text-gold-400' : 'text-purple-700'}
              fill={s <= avg ? 'currentColor' : 'none'} />
          ))}
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
          <div className="pt-4 space-y-4">
            {/* Rating input */}
            <div>
              <p className="text-purple-400 text-xs font-display uppercase tracking-widest mb-2">
                {myRating ? 'Update your rating' : 'Your rating'}
              </p>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(s => (
                  <button key={s}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setScore(s)}
                    className="transition-transform hover:scale-125">
                    <Star size={28}
                      className={s <= (hovered || score) ? 'text-gold-400' : 'text-purple-700'}
                      fill={s <= (hovered || score) ? 'currentColor' : 'none'} />
                  </button>
                ))}
                {score > 0 && (
                  <span className="ml-2 text-gold-400 font-display font-bold self-center">
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][score]}
                  </span>
                )}
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Add a comment (optional)..."
                rows={2} className="input-dark text-sm resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={submit} disabled={saving || !score}
                  className="btn-gold text-xs px-4 py-2">
                  {saving ? <div className="w-3 h-3 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : <><Send size={12} /> Submit</>}
                </button>
                {myRating && (
                  <button onClick={() => deleteRating(myRating.id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-display transition-all">
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
            </div>

            {/* All ratings */}
            {data?.ratings?.length > 0 && (
              <div>
                <p className="text-purple-400 text-xs font-display uppercase tracking-widest mb-2">All Ratings</p>
                <div className="space-y-2">
                  {data.ratings.map(r => (
                    <div key={r.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-dark-800/50 border border-purple-900/20">
                      <div className="w-7 h-7 rounded-full bg-purple-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {r.rater_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-display font-semibold">{r.rater_name}</span>
                          <span className="text-purple-500 text-xs capitalize">{r.rater_role}</span>
                          <div className="flex gap-0.5 ml-auto">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={10}
                                className={s <= r.score ? 'text-gold-400' : 'text-purple-700'}
                                fill={s <= r.score ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-purple-400 text-xs mt-0.5 line-clamp-2">{r.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
