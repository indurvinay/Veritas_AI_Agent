import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ExternalLink, Calendar, BookOpen, Briefcase, Cpu, Globe, RefreshCw } from 'lucide-react';
import axios from 'axios';

const CATEGORIES = [
  { key: 'students', label: 'STUDENTS / JOB SEEKERS', icon: Briefcase, color: '#FBBC05', glow: 'rgba(251, 188, 5, 0.15)' },
  { key: 'employees', label: 'EMPLOYEES / PROFESSIONALS', icon: BookOpen, color: '#34A853', glow: 'rgba(52, 168, 83, 0.15)' },
  { key: 'technology', label: 'TECHNOLOGY & AI', icon: Cpu, color: '#4285F4', glow: 'rgba(66, 133, 244, 0.15)' },
  { key: 'general', label: 'GENERAL NEWS', icon: Globe, color: '#EA433B', glow: 'rgba(234, 67, 53, 0.15)' }
];

export default function NewsPanel() {
  const [activeCategory, setActiveCategory] = useState('students');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch news using react-query
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['newsData', activeCategory, searchQuery],
    queryFn: () => {
      const qParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : '';
      return axios.get(`/api/news?category=${activeCategory}${qParam}`).then((r) => r.data);
    },
    refetchOnWindowFocus: false,
  });

  const newsItems = data?.news || [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleCategoryChange = (catKey) => {
    setSearchInput('');
    setSearchQuery('');
    setActiveCategory(catKey);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-950/20 border border-blue-500/30"
            style={{ boxShadow: '0 0 12px rgba(66, 133, 244, 0.2)' }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_News_icon.svg" alt="" className="w-4 h-4" />
          </div>
          <h2 className="text-lg tracking-widest font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
            GOOGLE NEWS
          </h2>
        </div>
        <button 
          className="glow-btn text-[10px] flex items-center gap-1" 
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Categories Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key && !searchQuery;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className="glow-btn text-[9px] px-3 py-2 flex items-center gap-2 transition-all justify-center"
              style={{
                background: isActive ? cat.glow : 'transparent',
                borderColor: isActive ? cat.color : 'rgba(0,212,255,0.15)',
                color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
                boxShadow: isActive ? `0 0 10px ${cat.glow}` : 'none'
              }}
            >
              <Icon size={12} style={{ color: isActive ? '#FFFFFF' : cat.color }} />
              <span className="font-semibold tracking-wider">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative mb-5 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            className="jarvis-input w-full pl-10"
            placeholder="Search custom news topics..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button type="submit" className="glow-btn glow-btn-primary text-xs px-4" disabled={!searchInput.trim()}>
          Search
        </button>
      </form>

      {/* News List */}
      <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {isLoading || isFetching ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-panel p-4">
                <div className="h-4 w-3/4 skeleton mb-2" />
                <div className="h-3 w-1/4 skeleton mb-2" />
                <div className="h-3 w-1/2 skeleton" />
              </div>
            ))}
          </div>
        ) : newsItems.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Globe size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-jarvis-cyan)' }} />
            <p className="text-sm opacity-50">No news articles found matching this topic.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {newsItems.map((item, i) => (
                <motion.div
                  key={item.link || i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-panel glass-panel-hover p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span 
                        className="text-[9px] font-bold px-2 py-0.5 rounded tracking-wider"
                        style={{
                          background: 'rgba(0, 212, 255, 0.1)',
                          color: 'var(--color-jarvis-cyan)',
                          border: '1px solid rgba(0, 212, 255, 0.2)'
                        }}
                      >
                        {item.source}
                      </span>
                      {item.pubDate && (
                        <span className="text-[9px] opacity-40 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(item.pubDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold leading-relaxed group-hover:text-cyan-400 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                      {item.title}
                    </h3>
                  </div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glow-btn text-[10px] flex items-center gap-1.5 shrink-0 hover:bg-cyan-950/30"
                  >
                    Read More <ExternalLink size={12} />
                  </a>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
