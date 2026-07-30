import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Trash2, MessageSquare, Activity, ChevronDown, ChevronRight, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,8,0.8)', backdropFilter: 'blur(5px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="glass-panel p-6 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm tracking-wider mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-alert-red)' }}>
          {title}
        </h3>
        <p className="text-xs mb-5 opacity-70">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="glow-btn text-[10px]" onClick={onCancel}>Cancel</button>
          <button className="glow-btn glow-btn-danger text-[10px]" onClick={onConfirm}>Confirm</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MemoryPanel() {
  const [expandedSession, setExpandedSession] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  // Conversations
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['chatHistory'],
    queryFn: () => axios.get('/api/chat/history').then((r) => r.data),
  });

  // Actions
  const { data: actionsData, isLoading: loadingActions } = useQuery({
    queryKey: ['chatActions'],
    queryFn: () => axios.get('/api/chat/actions').then((r) => r.data),
  });

  const conversations = historyData?.conversations || [];
  const actions = actionsData?.actions || [];

  const handleClearHistory = async () => {
    try {
      await axios.delete('/api/chat/history');
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
      toast.success('History cleared');
    } catch {
      toast.error('Failed to clear history');
    }
    setShowConfirm(false);
  };

  // Group conversations by date
  const grouped = conversations.reduce((acc, conv) => {
    const date = new Date(conv.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(conv);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg tracking-widest font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
          🧠 MEMORY
        </h2>
        <button
          className="glow-btn glow-btn-danger text-[10px] flex items-center gap-1"
          onClick={() => setShowConfirm(true)}
          disabled={conversations.length === 0}
        >
          <Trash2 size={13} /> Clear History
        </button>
      </div>

      <div className="flex gap-6" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Conversations */}
        <div className="flex-1 overflow-y-auto pr-2">
          <h3 className="text-xs tracking-widest mb-3 flex items-center gap-2 opacity-60" style={{ fontFamily: 'var(--font-heading)' }}>
            <MessageSquare size={14} /> CONVERSATION SESSIONS
          </h3>

          {loadingHistory ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-panel p-4 mb-2">
                <div className="h-4 w-1/3 skeleton mb-2" />
                <div className="h-3 w-2/3 skeleton" />
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <Brain size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-jarvis-cyan)' }} />
              <p className="text-sm opacity-50">No conversations yet</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, convs]) => (
              <div key={date} className="mb-4">
                <p className="text-[10px] tracking-wider opacity-40 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{date}</p>
                {convs.map((conv) => {
                  const firstUserMsg = conv.messages?.find((m) => m.role === 'user');
                  const isExpanded = expandedSession === conv.id;

                  return (
                    <motion.div
                      key={conv.id}
                      className="glass-panel glass-panel-hover p-3 mb-2 cursor-pointer"
                      onClick={() => setExpandedSession(isExpanded ? null : conv.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {firstUserMsg?.content?.slice(0, 60) || 'Empty session'}
                          </p>
                          <p className="text-[10px] mt-1 opacity-40">
                            {conv.messages?.length || 0} messages · {new Date(conv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {isExpanded ? <ChevronDown size={14} style={{ color: 'var(--color-jarvis-cyan)' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)' }} />}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 pt-3 space-y-2 overflow-hidden"
                            style={{ borderTop: '1px solid rgba(0,212,255,0.1)' }}
                          >
                            {conv.messages?.filter((m) => m.role !== 'system').map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                  className="px-2 py-1 rounded text-[11px] max-w-[80%]"
                                  style={{
                                    background: msg.role === 'user' ? 'rgba(0,212,255,0.08)' : 'rgba(0,10,20,0.5)',
                                    color: msg.role === 'user' ? 'var(--color-text-primary)' : 'var(--color-jarvis-cyan)',
                                  }}
                                >
                                  {msg.content?.slice(0, 200)}
                                  {msg.content?.length > 200 && '...'}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Agent Activity Log */}
        <div className="glass-panel p-4" style={{ width: '340px', flexShrink: 0 }}>
          <h3 className="text-xs tracking-widest mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
            <Activity size={14} /> AGENT ACTIVITY LOG
          </h3>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
            {loadingActions ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 mb-3">
                  <div className="w-16 h-3 skeleton" />
                  <div className="h-3 flex-1 skeleton" />
                </div>
              ))
            ) : actions.length === 0 ? (
              <p className="text-xs opacity-40">No actions recorded</p>
            ) : (
              [...actions].reverse().map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-3 py-2"
                  style={{ borderBottom: '1px solid rgba(0,212,255,0.05)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{
                      background: action.outcome === 'SUCCESS' ? 'var(--color-matrix-green)' : action.outcome === 'FAILED' ? 'var(--color-alert-red)' : '#FFD700',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="tag-badge tag-real text-[9px]">{action.type}</span>
                      <span className="text-[10px] opacity-30">
                        {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {action.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            title="CLEAR MEMORY"
            message="This will permanently delete all conversation history. Agent activity logs will be preserved. Are you sure?"
            onConfirm={handleClearHistory}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
