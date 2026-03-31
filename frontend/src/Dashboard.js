import React from 'react';
import { Brain, CheckCircle, FileText, Settings, Lightbulb, Calendar, ChevronRight } from 'lucide-react';

function Dashboard({ user, onNavigate }) {
  // Better name handling: prioritize display name or username
  const name = user?.username || user?.access_token || 'Explorer';

  const quickCards = [
    { id: 'chat',     icon: Brain,       label: 'AI Chat',   desc: 'Sync with your personal neural assistant' },
    { id: 'tasks',    icon: CheckCircle, label: 'Tasks',     desc: 'Organize your day with precision' },
    { id: 'notes',    icon: FileText,    label: 'Notes',     desc: 'Capture fleeting thoughts instantly' },
    { id: 'settings', icon: Settings,    label: 'Settings',  desc: 'Tailor your AI experience' },
  ];

  return (
    <div className="dashboard-grid">
      <div className="dashboard-hero">
        <h1>Welcome back, {name}!</h1>
        <p>Your personal AI workspace is optimized and ready for action.</p>
      </div>

      <div className="dashboard-sections">
        {/* Summary card */}
        <div className="glass-card-v2">
          <div className="card-v2-header">
            <div className="card-v2-icon"><Lightbulb size={20} /></div>
            <div className="card-v2-title">Intelligent Overview</div>
          </div>
          <div className="card-v2-body">
            <ul className="overview-list">
              <li className="overview-item">
                <div className="overview-dot"></div>
                Summarizing your recent notes and reminders...
              </li>
              <li className="overview-item">
                <div className="overview-dot"></div>
                Tracking 5 active tasks and upcoming events.
              </li>
              <li className="overview-item">
                <div className="overview-dot"></div>
                Integration health: All systems operational.
              </li>
            </ul>
            <button className="ai-hint-btn">
              <Brain size={14} /> Get AI Productivity Tips <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Calendar card */}
        <div className="glass-card-v2">
          <div className="card-v2-header">
            <div className="card-v2-icon"><Calendar size={20} /></div>
            <div className="card-v2-title">Neural Sync</div>
          </div>
          <div className="card-v2-body">
            <p>Connect your external calendars to enable proactive scheduling and context-aware reminders.</p>
            <div className="calendar-btn-group">
              <button className="premium-btn">
                <Calendar size={16} /> Google Calendar
              </button>
              <button className="premium-btn">
                <Calendar size={16} /> Outlook
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="action-grid">
        {quickCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.id} className="feature-card" onClick={() => onNavigate(card.id)}>
              <div className="feature-icon-wrapper">
                <Icon size={28} strokeWidth={1.8} />
              </div>
              <div className="feature-label">{card.label}</div>
              <div className="feature-desc">{card.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
