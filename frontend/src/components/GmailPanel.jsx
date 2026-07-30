import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Trash2, Star, FileText, Send, X, Sparkles, RefreshCw, Edit3 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useSocketContext } from '../App';

const FILTER_TABS = [
  { key: 'ALL', label: 'ALL', emoji: '📧' },
  { key: 'JOB', label: 'JOB', emoji: '💼' },
  { key: 'REAL', label: 'REAL', emoji: '🟢' },
  { key: 'SPAM', label: 'SPAM', emoji: '🔴' },
  { key: 'PROMO', label: 'PROMO', emoji: '🟡' },
];

function EmailSkeleton() {
  return (
    <div className="glass-panel p-4 mb-2">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full skeleton" />
        <div className="flex-1">
          <div className="h-4 w-1/3 skeleton mb-2" />
          <div className="h-3 w-2/3 skeleton mb-2" />
          <div className="h-3 w-1/2 skeleton" />
        </div>
      </div>
    </div>
  );
}

function ReplyModal({ email, onClose }) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(true);

  // Auto-draft with Gemini
  useEffect(() => {
    axios.post(`/api/gmail/reply/${email.id}`, {})
      .then(({ data }) => {
        setBody(data.draftedBody || '');
        setDrafting(false);
      })
      .catch(() => setDrafting(false));
  }, [email.id]);

  const handleSend = async () => {
    if (!body.trim()) return;
    setLoading(true);
    try {
      await axios.post(`/api/gmail/reply/${email.id}`, { body });
      toast.success('Reply sent successfully!');
      onClose();
    } catch (err) {
      toast.error('Failed to send reply');
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,8,0.8)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-panel p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm tracking-wider" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
            REPLY TO: {email.from?.slice(0, 40)}
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>
        <p className="text-xs mb-3 opacity-50">Re: {email.subject}</p>

        {drafting ? (
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: 'var(--color-jarvis-cyan)' }} className="animate-spin" />
            <span className="text-xs" style={{ color: 'var(--color-jarvis-cyan)' }}>Veritas AI is drafting a reply...</span>
          </div>
        ) : null}

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="jarvis-input w-full h-40 resize-none mb-4"
          placeholder="Type your reply..."
        />
        <div className="flex justify-end gap-3">
          <button className="glow-btn" onClick={onClose}>Cancel</button>
          <button className="glow-btn glow-btn-primary flex items-center gap-2" onClick={handleSend} disabled={loading}>
            <Send size={14} />
            {loading ? 'Sending...' : 'Send Reply'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AIComposeModal({ onClose }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [roughDraft, setRoughDraft] = useState('');
  const [tone, setTone] = useState('Professional');
  const [polishing, setPolishing] = useState(false);
  const [sending, setSending] = useState(false);

  const handlePolish = async () => {
    if (!roughDraft.trim()) {
      toast.error('Please enter a rough draft or notes first.');
      return;
    }
    setPolishing(true);
    try {
      const { data } = await axios.post('/api/gmail/compose-draft', { roughDraft, tone });
      setRoughDraft(data.polishedDraft);
      toast.success(`Polished draft with ${tone} tone!`);
    } catch {
      toast.error('AI polishing failed.');
    }
    setPolishing(false);
  };

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !roughDraft.trim()) {
      toast.error('Please fill in To, Subject, and Email content.');
      return;
    }
    setSending(true);
    try {
      await axios.post('/api/gmail/send', { to, subject, body: roughDraft });
      toast.success('Email sent successfully!');
      onClose();
    } catch {
      toast.error('Failed to send email.');
    }
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,8,0.8)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-panel p-6 w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm tracking-wider font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
            ⚡ AI EMAIL COMPOSER
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-[9px] tracking-wider opacity-50 block mb-1" style={{ fontFamily: 'var(--font-heading)' }}>RECIPIENT EMAIL</label>
            <input
              className="jarvis-input w-full"
              placeholder="e.g., recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[9px] tracking-wider opacity-50 block mb-1" style={{ fontFamily: 'var(--font-heading)' }}>SUBJECT LINE</label>
            <input
              className="jarvis-input w-full"
              placeholder="e.g., Follow up details"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[9px] tracking-wider opacity-50 block mb-1" style={{ fontFamily: 'var(--font-heading)' }}>ROUGH DRAFT / MAIN POINTS</label>
            <textarea
              className="jarvis-input w-full h-32 resize-none text-xs"
              placeholder="Write your rough notes or outline here. e.g., 'Thank Pepper Potts for ARC reactor test schedules, ask if she wants dinner next Tuesday.'"
              value={roughDraft}
              onChange={(e) => setRoughDraft(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[9px] tracking-wider opacity-50 block mb-1" style={{ fontFamily: 'var(--font-heading)' }}>SELECT TONE</label>
            <div className="flex flex-wrap gap-2">
              {['Professional', 'Witty', 'Direct', 'Concise', 'Apologetic'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`glow-btn text-[9px] px-2.5 py-1 ${tone === t ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20' : ''}`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            className="glow-btn text-[10px] flex items-center gap-1.5 border-purple-500/40 hover:bg-purple-950/10"
            style={{ color: '#B080FF' }}
            onClick={handlePolish}
            disabled={polishing || sending}
          >
            <Sparkles size={13} className={polishing ? 'animate-pulse' : ''} /> {polishing ? 'AI Refining...' : 'Refine with AI'}
          </button>
          
          <div className="flex gap-2">
            <button className="glow-btn text-[10px]" onClick={onClose}>Cancel</button>
            <button className="glow-btn glow-btn-primary text-[10px] flex items-center gap-1.5" onClick={handleSend} disabled={polishing || sending}>
              <Send size={13} /> {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function GmailPanel() {
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [replyEmail, setReplyEmail] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const queryClient = useQueryClient();
  const { lastEvent } = useSocketContext();

  // Fetch emails
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['emails'],
    queryFn: () => axios.get('/api/gmail/emails?max=30').then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  // Refetch on socket event
  useEffect(() => {
    if (lastEvent?.type === 'new-emails') {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  }, [lastEvent, queryClient]);

  const emails = data?.emails || [];
  const filtered = filter === 'ALL' ? emails : emails.filter((e) => e.tag === filter);

  const handleRefresh = () => {
    refetch().then(() => toast.success('Inbox refreshed!'));
  };

  const handleTrash = async (id) => {
    try {
      await axios.delete(`/api/gmail/emails/${id}`);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success('Email trashed');
      setExpandedId(null);
    } catch {
      toast.error('Failed to trash email');
    }
  };

  const handleSummarize = async (id) => {
    try {
      const { data } = await axios.post(`/api/gmail/emails/${id}/summarize`);
      toast(data.summary, {
        duration: 8000,
        icon: '📋',
        style: { maxWidth: '500px' },
      });
    } catch {
      toast.error('Summarization failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center bg-red-950/20 border border-red-500/30"
            style={{ boxShadow: '0 0 12px rgba(234, 67, 53, 0.2)' }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="" className="w-4 h-4" />
          </div>
          <h2
            className="text-lg tracking-widest font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}
          >
            GMAIL INBOX
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="glow-btn text-[10px] flex items-center gap-1" onClick={handleRefresh} disabled={isLoading || isFetching}>
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="glow-btn glow-btn-primary text-[10px] flex items-center gap-1" onClick={() => setShowCompose(true)}>
            <Sparkles size={13} /> Compose with AI
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="glow-btn text-[10px] px-3 py-1.5"
            style={{
              background: filter === tab.key ? 'rgba(0,212,255,0.15)' : 'transparent',
              borderColor: filter === tab.key ? 'var(--color-jarvis-cyan)' : 'rgba(0,212,255,0.2)',
            }}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Email List */}
      <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <EmailSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <Mail size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-jarvis-cyan)' }} />
            <p className="text-sm opacity-50">No emails found</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((email, i) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="glass-panel glass-panel-hover p-4 mb-2 cursor-pointer"
                style={{ borderLeft: `3px solid ${email.tagColor || '#00D4FF'}` }}
                onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      background: `${email.tagColor}20`,
                      color: email.tagColor,
                      border: `1px solid ${email.tagColor}40`,
                    }}
                  >
                    {(email.from || '?')[0].toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {email.subject?.slice(0, 60) || '(No subject)'}
                      </p>
                      <span className={`tag-badge tag-${email.tag?.toLowerCase()}`}>
                        {email.tagEmoji} {email.tag}
                      </span>
                    </div>
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {email.from?.slice(0, 50)}
                    </p>
                    <p className="text-xs mt-1 opacity-40 truncate">{email.snippet?.slice(0, 80)}</p>
                  </div>
                </div>

                {/* Expanded View */}
                <AnimatePresence>
                  {expandedId === email.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 overflow-hidden"
                      style={{ borderTop: '1px solid rgba(0,212,255,0.1)' }}
                    >
                      <div
                        className="text-xs leading-relaxed mb-4 max-h-48 overflow-y-auto pr-2"
                        style={{ color: 'var(--color-text-secondary)' }}
                        dangerouslySetInnerHTML={{ __html: email.body || 'No body' }}
                      />
                      <div className="flex gap-2">
                        <button className="glow-btn glow-btn-primary text-[10px] flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setReplyEmail(email); }}>
                          <Send size={12} /> Reply
                        </button>
                        <button className="glow-btn text-[10px] flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleSummarize(email.id); }}>
                          <FileText size={12} /> Summarize
                        </button>
                        <button className="glow-btn glow-btn-danger text-[10px] flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleTrash(email.id); }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {replyEmail && <ReplyModal email={replyEmail} onClose={() => setReplyEmail(null)} />}
      </AnimatePresence>

      {/* AI Compose Modal */}
      <AnimatePresence>
        {showCompose && <AIComposeModal onClose={() => setShowCompose(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
