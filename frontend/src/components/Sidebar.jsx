import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Brain, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';

const NAV_ITEMS = [
  { path: '/', type: 'lucide', icon: LayoutDashboard, label: 'DASHBOARD' },
  { 
    path: '/gmail', 
    type: 'image', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg', 
    glow: 'rgba(234, 67, 53, 0.6)', 
    label: 'GMAIL' 
  },
  { 
    path: '/calendar', 
    type: 'image', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg', 
    glow: 'rgba(66, 133, 244, 0.6)', 
    label: 'CALENDAR' 
  },
  { 
    path: '/drive', 
    type: 'image', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg', 
    glow: 'rgba(251, 188, 5, 0.6)', 
    label: 'DRIVE' 
  },
  { 
    path: '/sheets', 
    type: 'image', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Google_Sheets_2020_logo.svg', 
    glow: 'rgba(52, 168, 83, 0.6)', 
    label: 'SHEETS' 
  },
  { 
    path: '/news', 
    type: 'image', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Google_News_icon.svg', 
    glow: 'rgba(26, 115, 232, 0.6)', 
    label: 'NEWS' 
  },
  { path: '/memory', type: 'lucide', icon: Brain, label: 'MEMORY' },
];

export default function Sidebar() {
  const handleLogout = async () => {
    await axios.get('/auth/logout');
    window.location.reload();
  };

  return (
    <div
      className="glass-panel flex flex-col items-center py-4 gap-1 ml-2 mb-2"
      style={{
        width: '80px',
        borderRadius: '8px',
        borderRight: '1px solid rgba(0, 212, 255, 0.1)',
      }}
    >
      {NAV_ITEMS.map(({ path, type, icon, glow, label }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className="w-full"
        >
          {({ isActive }) => (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-center gap-1.5 py-3 px-2 mx-1 rounded-lg cursor-pointer transition-all duration-200"
              style={{
                borderLeft: isActive 
                  ? `3px solid ${glow || 'var(--color-jarvis-cyan)'}` 
                  : '3px solid transparent',
                background: isActive 
                  ? `linear-gradient(90deg, ${glow ? glow.replace('0.6', '0.12') : 'rgba(0, 212, 255, 0.1)'}, transparent)` 
                  : 'transparent',
                boxShadow: isActive ? `0 0 15px ${glow ? glow.replace('0.6', '0.08') : 'rgba(0, 212, 255, 0.1)'}` : 'none',
              }}
            >
              {type === 'lucide' ? (() => {
                const Icon = icon;
                return <Icon
                  size={20}
                  style={{
                    color: isActive ? 'var(--color-jarvis-cyan)' : 'var(--color-text-secondary)',
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(0,212,255,0.5))' : 'none',
                  }}
                />;
              })() : (
                <img
                  src={icon}
                  alt={label}
                  className="w-5 h-5 transition-all duration-200"
                  style={{
                    filter: isActive 
                      ? `drop-shadow(0 0 8px ${glow})`
                      : 'grayscale(80%) opacity(45%)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.filter = `grayscale(0%) opacity(85%) drop-shadow(0 0 5px ${glow})`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.filter = 'grayscale(80%) opacity(45%)';
                  }}
                />
              )}
              <span
                className="text-[9px] tracking-wider font-semibold"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: isActive 
                    ? (glow ? 'var(--color-text-primary)' : 'var(--color-jarvis-cyan)') 
                    : 'var(--color-text-secondary)',
                }}
              >
                {label}
              </span>
            </motion.div>
          )}
        </NavLink>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Logout */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 py-3 px-2 cursor-pointer mb-2"
        style={{ color: 'var(--color-alert-red)' }}
      >
        <LogOut size={18} />
        <span className="text-[9px] tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
          LOGOUT
        </span>
      </motion.button>
    </div>
  );
}
