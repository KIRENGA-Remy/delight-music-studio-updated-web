import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Inbox, ArrowUpRight, Trash2, Reply,
  ChevronLeft, Users, Search, Circle, RefreshCw, Plus, X,
  Clock, CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const roleBadge = (role) => ({
  manager:  'bg-gold-500/20 text-gold-400 border-gold-500/30',
  producer: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  client:   'bg-green-500/20 text-green-400 border-green-500/30',
}[role] || 'bg-purple-500/20 text-purple-300 border-purple-500/30');

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)  return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

export default function MessagesPage() {
  const { user } = useAuth();
  const [view,      setView]     = useState('inbox'); // inbox | sent | compose | thread
  const [messages,  setMessages] = useState([]);
  const [sent,      setSent]     = useState([]);
  const [thread,    setThread]   = useState(null);
  const [contacts,  setContacts] = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [sending,   setSending]  = useState(false);
  const [search,    setSearch]   = useState('');
  const [compose,   setCompose]  = useState({ receiver_id: '', subject: '', body: '', parent_id: null });
  const [unread,    setUnread]   = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [inbox, sentRes, contactsRes, unreadRes] = await Promise.all([
        api.get('/messages/inbox'),
        api.get('/messages/sent'),
        api.get('/messages/contacts'),
        api.get('/messages/unread-count'),
      ]);
      setMessages(inbox.data);
      setSent(sentRes.data);
      setContacts(contactsRes.data);
      setUnread(unreadRes.data.count);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openThread = async (msg) => {
    try {
      const res = await api.get(`/messages/${msg.id}`);
      setThread(res.data);
      setView('thread');
      // Update unread count
      if (!msg.is_read && msg.receiver_id === user?.id) {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
        setUnread(u => Math.max(0, u - 1));
      }
    } catch { toast.error('Failed to load conversation'); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!compose.receiver_id || !compose.body.trim()) {
      toast.error('Select a recipient and write your message'); return;
    }
    setSending(true);
    try {
      await api.post('/messages', compose);
      toast.success('Message sent!');
      setCompose({ receiver_id: '', subject: '', body: '', parent_id: null });
      setView('sent');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send');
    } finally { setSending(false); }
  };

  const replyToThread = async (body) => {
    if (!body.trim() || !thread) return;
    setSending(true);
    try {
      const root = thread.message;
      // reply goes to whoever is NOT the current user
      const receiver_id = root.sender_id === user?.id ? root.receiver_id : root.sender_id;
      await api.post('/messages', {
        receiver_id,
        subject: root.subject ? `Re: ${root.subject}` : null,
        body,
        parent_id: root.id,
      });
      toast.success('Reply sent!');
      // refresh thread
      const res = await api.get(`/messages/${root.id}`);
      setThread(res.data);
    } catch { toast.error('Failed to send reply'); }
    finally { setSending(false); }
  };

  const deleteMsg = async (id, fromSent = false) => {
    try {
      await api.delete(`/messages/${id}`);
      toast.success('Deleted');
      if (fromSent) setSent(p => p.filter(m => m.id !== id));
      else setMessages(p => p.filter(m => m.id !== id));
      if (view === 'thread') { setThread(null); setView('inbox'); }
    } catch { toast.error('Failed to delete'); }
  };

  const markAllRead = async () => {
    const unreadMsgs = messages.filter(m => !m.is_read);
    await Promise.all(unreadMsgs.map(m => api.put(`/messages/${m.id}/read`).catch(() => {})));
    setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
    setUnread(0);
    toast.success('All marked as read');
  };

  const startCompose = (contactId = '') => {
    setCompose({ receiver_id: String(contactId), subject: '', body: '', parent_id: null });
    setView('compose');
  };

  const filteredInbox = messages.filter(m =>
    m.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase()) ||
    m.body?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSent = sent.filter(m =>
    m.receiver_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Messages" subtitle="Communicate with your team and clients">
      <div className="flex gap-5 h-[calc(100vh-160px)] min-h-[500px]">

        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-1">
          <button onClick={() => startCompose()}
            className="btn-gold w-full justify-center py-2.5 text-sm mb-3">
            <Plus size={16} /> Compose
          </button>

          {[
            { key: 'inbox', label: 'Inbox', icon: Inbox, count: unread },
            { key: 'sent',  label: 'Sent',  icon: ArrowUpRight },
          ].map(({ key, label, icon: Icon, count }) => (
            <button key={key} onClick={() => setView(key)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-all ${
                view === key ? 'bg-purple-gradient text-white' : 'text-purple-300 hover:text-white hover:bg-purple-800/30'
              }`}>
              <Icon size={16} />
              {label}
              {count > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-gold-500 text-dark-950 text-xs font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          ))}

          <div className="mt-4 pt-4 border-t border-purple-900/30">
            <p className="text-purple-500 text-xs font-display uppercase tracking-widest mb-2 px-2">Contacts</p>
            <div className="space-y-0.5 overflow-y-auto max-h-48">
              {contacts.map(c => (
                <button key={c.id} onClick={() => startCompose(c.id)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-purple-800/20 transition-all group">
                  <div className="w-7 h-7 rounded-full bg-purple-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {c.fullname[0]}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-purple-200 text-xs font-display truncate group-hover:text-white transition-colors">{c.fullname}</p>
                    <p className={`text-xs capitalize px-1.5 py-0.5 rounded-full border inline-block mt-0.5 ${roleBadge(c.role)}`} style={{ fontSize: '9px' }}>
                      {c.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 card-dark flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {(view === 'thread' || view === 'compose') && (
                <button onClick={() => setView('inbox')} className="text-purple-400 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
              )}
              <h3 className="font-display font-bold text-white capitalize">
                {view === 'thread' ? thread?.message?.subject || 'Conversation' : view}
              </h3>
              {view === 'inbox' && unread > 0 && (
                <span className="badge-purple text-xs">{unread} unread</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {view === 'inbox' && (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search..." className="input-dark text-xs pl-8 py-1.5 h-8 w-36" />
                  </div>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="btn-outline text-xs py-1 px-3">
                      <CheckCheck size={14} /> All read
                    </button>
                  )}
                </>
              )}
              <button onClick={fetchAll} className="p-1.5 text-purple-400 hover:text-white transition-colors">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading && view !== 'compose' && view !== 'thread' ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* INBOX */}
                {view === 'inbox' && (
                  <div>
                    {filteredInbox.length === 0 ? (
                      <div className="text-center py-20 text-purple-500">
                        <Inbox size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="font-display font-semibold">{search ? 'No results' : 'Inbox is empty'}</p>
                      </div>
                    ) : filteredInbox.map((msg, i) => (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => openThread(msg)}
                        className={`flex items-start gap-3 px-5 py-4 border-b border-purple-900/20 cursor-pointer transition-all hover:bg-purple-900/10 ${
                          !msg.is_read ? 'bg-purple-900/10' : ''
                        }`}>
                        <div className="w-9 h-9 rounded-full bg-purple-gradient flex items-center justify-center font-display font-bold text-white text-sm flex-shrink-0 mt-0.5">
                          {msg.sender_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="flex items-center gap-2">
                              {!msg.is_read && <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />}
                              <p className={`font-display font-semibold text-sm ${!msg.is_read ? 'text-white' : 'text-purple-200'}`}>
                                {msg.sender_name}
                              </p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full border capitalize ${roleBadge(msg.sender_role)}`} style={{ fontSize: '9px' }}>
                                {msg.sender_role}
                              </span>
                            </div>
                            <span className="text-purple-500 text-xs flex-shrink-0">{timeAgo(msg.created_at)}</span>
                          </div>
                          {msg.subject && <p className="text-purple-300 text-xs font-semibold mb-0.5">{msg.subject}</p>}
                          <p className="text-purple-400 text-xs line-clamp-1">{msg.body}</p>
                          {msg.reply_count > 0 && (
                            <p className="text-purple-600 text-xs mt-1">{msg.reply_count} repl{msg.reply_count === 1 ? 'y' : 'ies'}</p>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteMsg(msg.id); }}
                          className="p-1.5 text-purple-700 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* SENT */}
                {view === 'sent' && (
                  <div>
                    {filteredSent.length === 0 ? (
                      <div className="text-center py-20 text-purple-500">
                        <ArrowUpRight size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="font-display font-semibold">No sent messages</p>
                      </div>
                    ) : filteredSent.map((msg, i) => (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => openThread(msg)}
                        className="flex items-start gap-3 px-5 py-4 border-b border-purple-900/20 cursor-pointer transition-all hover:bg-purple-900/10 group">
                        <div className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center font-display font-bold text-dark-950 text-sm flex-shrink-0 mt-0.5">
                          {msg.receiver_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-display font-semibold text-sm text-purple-200">To: {msg.receiver_name}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full border capitalize ${roleBadge(msg.receiver_role)}`} style={{ fontSize: '9px' }}>
                                {msg.receiver_role}
                              </span>
                            </div>
                            <span className="text-purple-500 text-xs">{timeAgo(msg.created_at)}</span>
                          </div>
                          {msg.subject && <p className="text-purple-300 text-xs font-semibold mb-0.5">{msg.subject}</p>}
                          <p className="text-purple-400 text-xs line-clamp-1">{msg.body}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteMsg(msg.id, true); }}
                          className="p-1.5 text-purple-700 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* THREAD */}
                {view === 'thread' && thread && (
                  <ThreadView thread={thread} currentUser={user} onReply={replyToThread} sending={sending} />
                )}

                {/* COMPOSE */}
                {view === 'compose' && (
                  <ComposeView
                    compose={compose}
                    setCompose={setCompose}
                    contacts={contacts}
                    onSend={sendMessage}
                    sending={sending}
                    onCancel={() => setView('inbox')}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ThreadView({ thread, currentUser, onReply, sending }) {
  const [replyBody, setReplyBody] = useState('');
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  const allMessages = [thread.message, ...(thread.replies || [])];

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    await onReply(replyBody);
    setReplyBody('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {allMessages.map((msg, i) => {
          const isMine = msg.sender_id === currentUser?.id;
          return (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${
                isMine ? 'bg-gold-gradient text-dark-950' : 'bg-purple-gradient text-white'
              }`}>
                {msg.sender_name?.[0]}
              </div>
              <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-display font-semibold text-purple-300">{msg.sender_name}</span>
                  <span className="text-purple-600 text-xs">{timeAgo(msg.created_at)}</span>
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-purple-gradient text-white rounded-tr-sm'
                    : 'bg-dark-800/80 border border-purple-900/30 text-purple-100 rounded-tl-sm'
                }`}>
                  {msg.body}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="border-t border-purple-900/30 p-4 flex-shrink-0">
        <div className="flex gap-3">
          <textarea
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
            placeholder="Write a reply… (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="input-dark flex-1 resize-none text-sm py-2"
          />
          <button onClick={handleReply} disabled={sending || !replyBody.trim()}
            className="btn-gold px-4 py-2 self-end text-sm">
            {sending ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComposeView({ compose, setCompose, contacts, onSend, sending, onCancel }) {
  const f = (k, v) => setCompose(p => ({ ...p, [k]: v }));

  const groupedContacts = contacts.reduce((acc, c) => {
    if (!acc[c.role]) acc[c.role] = [];
    acc[c.role].push(c);
    return acc;
  }, {});

  return (
    <form onSubmit={onSend} className="p-5 space-y-4 h-full flex flex-col">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-input">To *</label>
          <select value={compose.receiver_id} onChange={e => f('receiver_id', e.target.value)} className="input-dark">
            <option value="">Select recipient...</option>
            {Object.entries(groupedContacts).map(([role, users]) => (
              <optgroup key={role} label={role.charAt(0).toUpperCase() + role.slice(1) + 's'}>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullname}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="label-input">Subject</label>
          <input value={compose.subject} onChange={e => f('subject', e.target.value)}
            placeholder="What is this about?" className="input-dark" />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <label className="label-input">Message *</label>
        <textarea value={compose.body} onChange={e => f('body', e.target.value)}
          placeholder="Write your message here..."
          className="input-dark flex-1 resize-none text-sm leading-relaxed min-h-48" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn-outline flex-shrink-0">
          <X size={16} /> Cancel
        </button>
        <button type="submit" disabled={sending} className="btn-gold flex-1 justify-center">
          {sending ? <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" /> : <><Send size={16} /> Send Message</>}
        </button>
      </div>
    </form>
  );
}
