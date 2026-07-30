import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, MicOff, Mail, Calendar, HardDrive, Table, Sparkles } from 'lucide-react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const QUICK_ACTIONS = [
  { icon: Mail, label: '📧 Check Emails', message: 'Check my recent emails and summarize any important ones' },
  { icon: Calendar, label: '📅 Today\'s Events', message: 'What events do I have today?' },
  { icon: HardDrive, label: '📁 Recent Files', message: 'Show me my recent Drive files' },
  { icon: Table, label: '📊 Open Sheet', message: 'Read my Google Sheet and show the data' },
];

function TypewriterText({ text, onComplete }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text) return;
    setDisplayed('');
    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 15);

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}</span>;
}

// ─── Voice Recognition Hook ───
function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.warn('Failed to start recognition:', err);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
  }, [isListening]);

  return { isListening, transcript, isSupported, startListening, stopListening, setTranscript };
}

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [typingComplete, setTypingComplete] = useState({});
  const messagesEndRef = useRef(null);
  const voiceSendTimerRef = useRef(null);

  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    setTranscript,
  } = useVoiceRecognition();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Sync voice transcript to input field in real-time
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  // Auto-send after voice stops (user finished speaking)
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      // Short delay to ensure final transcript is captured
      voiceSendTimerRef.current = setTimeout(() => {
        sendMessage(transcript.trim());
        setTranscript('');
      }, 600);
    }
    return () => {
      if (voiceSendTimerRef.current) clearTimeout(voiceSendTimerRef.current);
    };
  }, [isListening, transcript]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: uuidv4(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/chat/message', { message: text, sessionId });

      const assistantMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: data.response,
        action: data.action,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: 'I apologize, sir. I encountered an error processing your request. Systems may require authentication.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div
      className="glass-panel flex flex-col mr-2 mb-2"
      style={{
        width: '380px',
        flexShrink: 0,
        borderRadius: '8px',
        borderLeft: '1px solid rgba(0, 212, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <Sparkles size={16} style={{ color: 'var(--color-jarvis-cyan)' }} />
        <span className="text-xs tracking-widest font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
          VERITAS AI CHAT
        </span>
        <div className="flex-1" />
        {isListening && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[10px] tracking-wider"
            style={{ color: '#FF4444', fontFamily: 'var(--font-heading)' }}
          >
            ● LISTENING
          </motion.span>
        )}
        <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: isListening ? '#FF4444' : 'var(--color-matrix-green)' }} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <Sparkles size={28} style={{ color: 'var(--color-jarvis-cyan)' }} className="mb-3" />
            <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
              How can I assist you today?
            </p>
            {isSupported && (
              <p className="text-[10px] text-center mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                🎙️ Click the mic to speak
              </p>
            )}
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed"
                style={{
                  background: msg.role === 'user'
                    ? 'rgba(0, 212, 255, 0.1)'
                    : 'rgba(0, 10, 20, 0.6)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.08)'}`,
                  color: msg.role === 'user' ? 'var(--color-text-primary)' : 'var(--color-jarvis-cyan)',
                }}
              >
                {msg.role === 'assistant' && !typingComplete[msg.id] ? (
                  <TypewriterText
                    text={msg.content}
                    onComplete={() => setTypingComplete((prev) => ({ ...prev, [msg.id]: true }))}
                  />
                ) : (
                  msg.content
                )}

                {/* Action Badge */}
                {msg.action && (
                  <div className="mt-2 px-2 py-1 rounded text-[10px] flex items-center gap-1" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: 'var(--color-matrix-green)' }}>
                    {msg.action.message}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(0,10,20,0.6)', border: '1px solid rgba(0,212,255,0.08)' }}>
              <div className="flex items-center gap-1">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 flex flex-wrap gap-1.5" style={{ borderTop: '1px solid rgba(0,212,255,0.05)' }}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => sendMessage(action.message)}
            className="glow-btn text-[9px] px-2 py-1"
            disabled={loading}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Voice Waveform Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 flex items-center justify-center gap-1"
            style={{ borderTop: '1px solid rgba(255, 68, 68, 0.2)', background: 'rgba(255, 68, 68, 0.03)' }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: '3px',
                  background: '#FF4444',
                }}
                animate={{
                  height: [8, 20 + Math.random() * 12, 8],
                }}
                transition={{
                  duration: 0.5 + Math.random() * 0.3,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            ))}
            <span className="text-[10px] ml-2 tracking-wider" style={{ color: '#FF4444', fontFamily: 'var(--font-heading)' }}>
              Speak now...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 flex gap-2" style={{ borderTop: '1px solid rgba(0,212,255,0.1)' }}>
        <input
          className="jarvis-input flex-1"
          placeholder={isListening ? '🎙️ Listening...' : 'Talk to Veritas AI...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || isListening}
        />
        <button type="submit" className="glow-btn glow-btn-primary p-2" disabled={loading || !input.trim() || isListening}>
          <Send size={16} />
        </button>
        <motion.button
          type="button"
          className="glow-btn p-2"
          onClick={handleVoiceToggle}
          disabled={!isSupported || loading}
          whileTap={{ scale: 0.9 }}
          style={{
            borderColor: isListening ? '#FF4444' : undefined,
            color: isListening ? '#FF4444' : undefined,
            background: isListening ? 'rgba(255, 68, 68, 0.1)' : undefined,
            boxShadow: isListening ? '0 0 20px rgba(255, 68, 68, 0.3)' : undefined,
            opacity: isSupported ? 1 : 0.3,
          }}
          title={!isSupported ? 'Voice input not supported in this browser' : isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <MicOff size={16} />
            </motion.div>
          ) : (
            <Mic size={16} />
          )}
        </motion.button>
      </form>
    </div>
  );
}
