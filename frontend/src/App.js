import React, { useState } from 'react';
import AuthForm from './AuthForm';
import LandingPage from './LandingPage';
import ErrorBoundary from './ErrorBoundary';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Chat from './Chat';
import Tasks from './Tasks';
import Notes from './Notes';
import Settings from './Settings';
import KnowledgeBase from './KnowledgeBase';
import NeuralBackground from './NeuralBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, MessageSquare, FileText, CheckSquare, Settings as SettingsIcon, Database, LogOut } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './Dashboard.css';

const GOOGLE_CLIENT_ID = "1076982736212-0fvtfej9mvdv5sanb818e4jsvh7h5cl0.apps.googleusercontent.com";

const VIEW_TITLES = {
  dashboard:     { icon: <LayoutDashboard size={18} />, label: 'Kortex' },
  chat:          { icon: <MessageSquare size={18} />,   label: 'AI Chat' },
  notes:         { icon: <FileText size={18} />,        label: 'Notes' },
  tasks:         { icon: <CheckSquare size={18} />,     label: 'Tasks' },
  settings:      { icon: <SettingsIcon size={18} />,    label: 'Settings' },
  knowledgebase: { icon: <Database size={18} />,      label: 'Knowledge Base' },
};

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('landing');
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const sidebarOffset = sidebarExpanded ? 260 : 72;

  let content;

  if (user) {
    const userLabel = user.access_token || user.username || 'User';
    const viewInfo = VIEW_TITLES[activeView] || VIEW_TITLES.dashboard;

    let viewContent;
    switch (activeView) {
      case 'chat':
        viewContent = <ErrorBoundary name="Chat"><Chat token={userLabel} /></ErrorBoundary>;
        break;
      case 'tasks':
        viewContent = <ErrorBoundary name="Tasks"><Tasks token={userLabel} /></ErrorBoundary>;
        break;
      case 'notes':
        viewContent = <ErrorBoundary name="Notes"><Notes token={userLabel} /></ErrorBoundary>;
        break;
      case 'settings':
        viewContent = <ErrorBoundary name="Settings"><Settings /></ErrorBoundary>;
        break;
      case 'knowledgebase':
        viewContent = <ErrorBoundary name="KnowledgeBase"><KnowledgeBase token={userLabel} /></ErrorBoundary>;
        break;
      default:
        viewContent = <ErrorBoundary name="Dashboard"><Dashboard user={user} onNavigate={setActiveView} /></ErrorBoundary>;
    }

    content = (
      <div className="app-shell">
        <Sidebar 
          activeView={activeView} 
          onNavigate={setActiveView} 
          expanded={sidebarExpanded}
          onExpandChange={setSidebarExpanded}
        />

        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-left-icon">{viewInfo.icon}</span>
            {viewInfo.label}
          </div>
          <div className="topbar-right">
            <span className="topbar-email">{userLabel}</span>
            <button className="topbar-logout" onClick={() => { setUser(null); setActiveView('dashboard'); }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className={`main-panel${activeView === 'chat' ? ' main-panel--chat' : ''}`} style={{ position: 'relative' }}>
          <NeuralBackground />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {viewContent}
          </div>
        </main>
      </div>
    );
  } else if (currentView === 'landing') {
    content = <LandingPage onGetStarted={() => setCurrentView('auth')} />;
  } else {
    content = <AuthForm onAuth={setUser} onBack={() => setCurrentView('landing')} />;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="app-container" style={{ backgroundColor: '#0b0e0e', minHeight: '100vh', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={user ? 'app' : currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'relative', zIndex: 10, height: '100%' }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
