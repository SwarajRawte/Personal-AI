import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, FileText, CheckSquare,
  Database, Settings, Pin, PinOff
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'chat',          icon: MessageSquare,   label: 'Chat' },
  { id: 'notes',         icon: FileText,        label: 'Notes' },
  { id: 'tasks',         icon: CheckSquare,     label: 'Tasks' },
  { id: 'knowledgebase', icon: Database,        label: 'Knowledge Base' },
];

const IDLE_DELAY = 3500;

function Sidebar({ activeView, onNavigate, expanded, onExpandChange }) {
  const [pinned,   setPinned]   = useState(false);
  const idleTimer               = useRef(null);

  const clearIdle = () => clearTimeout(idleTimer.current);

  const scheduleCollapse = () => {
    if (pinned) return;
    clearIdle();
    idleTimer.current = setTimeout(() => onExpandChange(false), IDLE_DELAY);
  };

  const handleMouseEnter = () => { clearIdle(); onExpandChange(true); };
  const handleMouseLeave = () => scheduleCollapse();

  const handlePin = () => {
    const next = !pinned;
    setPinned(next);
    if (next) { clearIdle(); onExpandChange(true); }
    else scheduleCollapse();
  };

  useEffect(() => { scheduleCollapse(); return clearIdle; }, [pinned]); // eslint-disable-line

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: expanded ? 260 : 72 }}
        className={`sidebar${expanded ? '' : ' sidebar--collapsed'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-img">
             <div className="w-5 h-5 bg-white rounded-full opacity-20 blur-sm absolute animate-pulse"></div>
             <LayoutDashboard size={20} color="white" />
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="sidebar-logo-text"
              >
                Kortex
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <motion.button
              key={id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`sidebar-item${activeView === id ? ' active' : ''}`}
              onClick={() => onNavigate(id)}
              title={label}
            >
              <span className="sidebar-item-icon">
                <Icon size={20} strokeWidth={2} />
              </span>
              <AnimatePresence>
                {expanded && (
                  <motion.span 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="sidebar-item-label"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer" style={{ padding: '24px 12px', borderTop: '1px solid var(--border-glass)' }}>
          <motion.button
            whileHover={{ x: 4 }}
            className={`sidebar-item sidebar-settings-btn${activeView === 'settings' ? ' active' : ''}`}
            onClick={() => onNavigate('settings')}
            title="Settings"
          >
            <span className="sidebar-item-icon">
              <Settings size={20} strokeWidth={2} />
            </span>
            {expanded && <span className="sidebar-item-label">Settings</span>}
          </motion.button>

          <button
            className={`sidebar-pin-toggle${pinned ? ' pinned' : ''}`}
            onClick={handlePin}
            style={{ 
              marginTop: '12px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}
          >
            <span className="sidebar-item-icon">
              {pinned ? <Pin size={16} /> : <PinOff size={16} />}
            </span>
            {expanded && <span>{pinned ? 'Pinned' : 'Pin Sidebar'}</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile bottom nav - Modernized */}
      <div className="mobile-nav" style={{ 
        background: 'rgba(11, 14, 14, 0.8)', 
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-glass)'
      }}>
        <div className="mobile-nav-items">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`mobile-nav-item${activeView === id ? ' active' : ''}`}
              onClick={() => onNavigate(id)}
              style={{ color: activeView === id ? 'var(--accent-electric)' : 'var(--text-secondary)' }}
            >
              <Icon size={20} />
              <span style={{ fontSize: '10px', marginTop: '4px' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
