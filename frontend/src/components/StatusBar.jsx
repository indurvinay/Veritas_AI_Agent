import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Mail, Calendar, HardDrive, ExternalLink, X } from 'lucide-react';
import axios from 'axios';
import { useSocketContext } from '../App';

export default function StatusBar({ user }) {
  const [time, setTime] = useState(new Date());
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { isConnected } = useSocketContext();

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Debounce search query by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unread email count
  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => axios.get('/api/gmail/unread').then((r) => r.data),
    refetchInterval: 60000,
    enabled: !!user,
  });

  // Today's events count
  const { data: eventsData } = useQuery({
    queryKey: ['todayEvents'],
    queryFn: () => axios.get(`/api/calendar/events?date=${new Date().toISOString().split('T')[0]}`).then((r) => r.data),
    refetchInterval: 300000,
    enabled: !!user,
  });

  // Global search query
  const { data: searchData, isFetching: searching } = useQuery({
    queryKey: ['globalSearch', searchQuery],
    queryFn: () => axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`).then((r) => r.data),
    enabled: searchQuery.length > 1,
  });

  const searchResults = searchData?.results || { emails: [], files: [], events: [] };
  const hasResults =
    searchResults.emails.length > 0 ||
    searchResults.files.length > 0 ||
    searchResults.events.length > 0;

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour12: false });

  return (
    <div
      className="glass-panel flex items-center justify-between px-6 h-12 mx-2 mt-2 relative"
      style={{
        borderRadius: '8px',
        borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
        boxShadow: '0 2px 20px rgba(0, 212, 255, 0.05)',
      }}
    >
      {/* Left — Logo */}
      <div className="flex items-center gap-2">
        <span
          className="text-base font-bold tracking-widest"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)', textShadow: '0 0 10px rgba(0,212,255,0.5)' }}
        >
          ◈ VERITAS AI
        </span>
      </div>

      {/* Center — Centered Global Search Bar */}
      <div className="relative flex-1 max-w-md mx-6" ref={dropdownRef}>
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            className="jarvis-input w-full pl-9 pr-8 py-1 text-xs"
            style={{ height: '30px', borderRadius: '6px' }}
            placeholder="Search workspace (emails, files, events)..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-55 hover:opacity-100"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        <AnimatePresence>
          {showDropdown && searchQuery.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 mt-2 glass-panel p-4 z-50 shadow-2xl max-h-[380px] overflow-y-auto"
              style={{
                borderRadius: '8px',
                border: '1px solid rgba(0,212,255,0.15)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              }}
            >
              {searching && (
                <div className="text-[10px] opacity-60 text-center py-2 flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-jarvis-cyan)', borderTopColor: 'transparent' }} />
                  Searching Workspace...
                </div>
              )}

              {!searching && !hasResults && (
                <div className="text-[10px] opacity-40 text-center py-4">
                  No matching workspace items found.
                </div>
              )}

              {!searching && hasResults && (
                <div className="space-y-4 text-xs">
                  {/* Category: Gmail */}
                  {searchResults.emails.length > 0 && (
                    <div>
                      <h4 className="text-[9px] tracking-widest font-semibold mb-2 uppercase flex items-center gap-1.5" style={{ fontFamily: 'var(--font-heading)', color: '#FF3A3A' }}>
                        <Mail size={11} /> Gmail Matches
                      </h4>
                      <div className="space-y-2">
                        {searchResults.emails.map((email) => (
                          <div key={email.id} className="p-2 rounded bg-cyan-950/5 border border-cyan-500/5 hover:border-cyan-500/15">
                            <p className="font-semibold truncate text-[11px]" style={{ color: 'var(--color-text-primary)' }}>
                              {email.subject || '(No Subject)'}
                            </p>
                            <p className="text-[10px] opacity-45 truncate">{email.from}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Calendar */}
                  {searchResults.events.length > 0 && (
                    <div>
                      <h4 className="text-[9px] tracking-widest font-semibold mb-2 uppercase flex items-center gap-1.5" style={{ fontFamily: 'var(--font-heading)', color: '#4285F4' }}>
                        <Calendar size={11} /> Calendar Events
                      </h4>
                      <div className="space-y-2">
                        {searchResults.events.map((event) => (
                          <div key={event.id} className="p-2 rounded bg-cyan-950/5 border border-cyan-500/5 hover:border-cyan-500/15">
                            <p className="font-semibold truncate text-[11px]" style={{ color: 'var(--color-text-primary)' }}>
                              {event.summary || '(No Title)'}
                            </p>
                            <p className="text-[9px] opacity-40">
                              📅 {new Date(event.start).toLocaleDateString()} at {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Drive */}
                  {searchResults.files.length > 0 && (
                    <div>
                      <h4 className="text-[9px] tracking-widest font-semibold mb-2 uppercase flex items-center gap-1.5" style={{ fontFamily: 'var(--font-heading)', color: '#FBBC05' }}>
                        <HardDrive size={11} /> Drive Files
                      </h4>
                      <div className="space-y-2">
                        {searchResults.files.map((file) => (
                          <a
                            key={file.id}
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 rounded bg-cyan-950/5 border border-cyan-500/5 hover:border-cyan-500/20 flex justify-between items-center group"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-semibold truncate text-[11px] group-hover:text-cyan-400" style={{ color: 'var(--color-text-primary)' }}>
                                {file.name}
                              </p>
                              <p className="text-[9px] opacity-40">{file.size}</p>
                            </div>
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-jarvis-cyan)' }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right — User, Clock & Indicators */}
      <div className="flex items-center gap-5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {/* User Info */}
        {user && (
          <div className="flex items-center gap-2">
            {user.picture && (
              <img src={user.picture} alt="" className="w-5 h-5 rounded-full border border-cyan-500/20" />
            )}
            <span className="hidden lg:inline opacity-70">👤 {user.name || user.email}</span>
          </div>
        )}

        {/* Live Clock */}
        <span className="tracking-wider font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
          🕐 {formatTime(time)}
        </span>

        {/* Network Connection Indicator */}
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: isConnected ? 'var(--color-matrix-green)' : 'var(--color-alert-red)' }} />
      </div>
    </div>
  );
}
