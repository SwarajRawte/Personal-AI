import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, MessageSquare, FileText, CheckSquare,
  Database, Settings, Brain, Pin, PinOff
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'chat',          icon: MessageSquare,   label: 'Chat' },
  { id: 'notes',         icon: FileText,        label: 'Notes' },
  { id: 'tasks',         icon: CheckSquare,     label: 'Tasks' },
  { id: 'knowledgebase', icon: Database,        label: 'Knowledge Base' },
];

const IDLE_DELAY = 3500;

function Sidebar({ activeView, onNavigate }) {
  const [expanded, setExpanded] = useState(true);
  const [pinned,   setPinned]   = useState(false);
  const idleTimer               = useRef(null);

  const clearIdle = () => clearTimeout(idleTimer.current);

  const scheduleCollapse = () => {
    if (pinned) return;
    clearIdle();
    idleTimer.current = setTimeout(() => setExpanded(false), IDLE_DELAY);
  };

  const handleMouseEnter = () => { clearIdle(); setExpanded(true); };
  const handleMouseLeave = () => scheduleCollapse();

  const handlePin = () => {
    const next = !pinned;
    setPinned(next);
    if (next) { clearIdle(); setExpanded(true); }
    else scheduleCollapse();
  };

  useEffect(() => { scheduleCollapse(); return clearIdle; }, []); // eslint-disable-line

  return (
    <>
      <aside
        className={`sidebar${expanded ? '' : ' sidebar--collapsed'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-dot">
            <Brain size={16} strokeWidth={2} />
          </div>
          <span className="sidebar-logo-text">PersonalAI</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`sidebar-item${activeView === id ? ' active' : ''}`}
              onClick={() => onNavigate(id)}
              title={label}
            >
              <span className="sidebar-item-icon">
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <span className="sidebar-item-label">{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className={`sidebar-item sidebar-settings-btn${activeView === 'settings' ? ' active' : ''}`}
            onClick={() => onNavigate('settings')}
            title="Settings"
          >
            <span className="sidebar-item-icon">
              <Settings size={18} strokeWidth={1.8} />
            </span>
            <span className="sidebar-item-label">Settings</span>
          </button>

          <button
            className={`sidebar-pin-toggle${pinned ? ' pinned' : ''}`}
            onClick={handlePin}
            title={pinned ? 'Unpin sidebar' : 'Keep sidebar open'}
          >
            <span className="sidebar-item-icon">
              {pinned ? <Pin size={16} strokeWidth={1.8} /> : <PinOff size={16} strokeWidth={1.8} />}
            </span>
            <span className="sidebar-item-label">{pinned ? 'Unpinned' : 'Pin open'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        <div className="mobile-nav-items">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`mobile-nav-item${activeView === id ? ' active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <span className="mobile-nav-item-icon"><Icon size={20} /></span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
