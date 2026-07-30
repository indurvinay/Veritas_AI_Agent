import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';

import { useSocket } from './hooks/useSocket';
import HolographicBackground from './components/HolographicBackground';
import StatusBar from './components/StatusBar';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import GmailPanel from './components/GmailPanel';
import CalendarPanel from './components/CalendarPanel';
import DrivePanel from './components/DrivePanel';
import SheetsPanel from './components/SheetsPanel';
import MemoryPanel from './components/MemoryPanel';
import NewsPanel from './components/NewsPanel';
import DashboardPanel from './components/DashboardPanel';
import JarvisOrb from './components/JarvisOrb';

// ─── Context ───
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const SocketContext = createContext(null);
export const useSocketContext = () => useContext(SocketContext);

// ─── Home Screen ───
function HomeScreen({ user }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center h-full gap-6"
    >
      <JarvisOrb isActive={true} />
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold tracking-widest"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}
      >
        JARVIS-X ONLINE
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm opacity-60"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {user ? `Welcome back, ${user.name || user.email}` : 'Personal AI Command Center'}
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex gap-4 mt-4"
      >
        {['Gmail', 'Calendar', 'Drive', 'Sheets'].map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="glass-panel px-4 py-2 text-xs tracking-wider"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-secondary)' }}
          >
            ● {label.toUpperCase()}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── Login Screen ───
function LoginScreen() {
  const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50">
      <HolographicBackground />
      <div className="scanline-overlay" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        <JarvisOrb isActive={false} />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-bold tracking-[0.3em]"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}
        >
          VERITAS AI
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm tracking-widest opacity-50"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          PERSONAL AI COMMAND CENTER
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col gap-3 mt-4 w-full max-w-xs"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 212, 255, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            className="glow-btn glow-btn-primary w-full py-3 text-[11px] tracking-[0.2em]"
          >
            ◈ CONNECT WITH GOOGLE
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(123, 47, 255, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { window.location.href = '/auth/demo'; }}
            className="glow-btn w-full py-3 text-[11px] tracking-[0.2em]"
            style={{
              borderColor: 'var(--color-jarvis-purple)',
              color: '#B080FF',
            }}
          >
            ◈ EXPLORE DEMO INTERFACE
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Dashboard ───
function Dashboard({ user }) {
  const location = useLocation();

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'var(--color-space-black)' }}>
      <HolographicBackground />
      <div className="scanline-overlay" />

      {/* Status Bar */}
      <div className="relative z-20">
        <StatusBar user={user} />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex flex-1 overflow-hidden" style={{ marginTop: 0 }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<DashboardPanel />} />
              <Route path="/gmail" element={<GmailPanel />} />
              <Route path="/calendar" element={<CalendarPanel />} />
              <Route path="/drive" element={<DrivePanel />} />
              <Route path="/sheets" element={<SheetsPanel />} />
              <Route path="/memory" element={<MemoryPanel />} />
              <Route path="/news" element={<NewsPanel />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>

        {/* Chat Panel */}
        <ChatPanel />
      </div>
    </div>
  );
}

// ─── App ───
export default function App() {
  const [authState, setAuthState] = useState({ loading: true, authenticated: false, user: null });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const socketData = useSocket();

  // Check auth status on mount
  useEffect(() => {
    axios.get('/auth/status')
      .then(({ data }) => {
        setAuthState({ loading: false, authenticated: data.authenticated, user: data.user || null });
      })
      .catch(() => {
        setAuthState({ loading: false, authenticated: false, user: null });
      });
  }, []);

  // Mouse tracking for cursor glow
  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Socket event notifications
  useEffect(() => {
    if (socketData.lastEvent?.type === 'new-emails') {
      toast(socketData.lastEvent.data.message, {
        icon: '📧',
        style: { background: 'rgba(0,20,40,0.95)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' },
      });
    }
  }, [socketData.lastEvent]);

  if (authState.loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--color-space-black)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-jarvis-cyan)', borderTopColor: 'transparent' }} />
          <p className="text-sm tracking-widest" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-secondary)' }}>INITIALIZING JARVIS-X...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authState}>
      <SocketContext.Provider value={socketData}>
        {/* Cursor Glow */}
        <div className="cursor-glow" style={{ left: mousePos.x, top: mousePos.y }} />

        {/* Toast */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(0, 20, 40, 0.95)',
              color: '#E0F7FF',
              border: '1px solid rgba(0, 212, 255, 0.15)',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '13px',
              backdropFilter: 'blur(10px)',
            },
          }}
        />

        {authState.authenticated ? <Dashboard user={authState.user} /> : <LoginScreen />}
      </SocketContext.Provider>
    </AuthContext.Provider>
  );
}
