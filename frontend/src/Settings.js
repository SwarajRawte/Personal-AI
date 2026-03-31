import React, { useState } from 'react';
import { Moon, Sun, User, Lock, Calendar, Link2 } from 'lucide-react';

function Settings() {
  const [theme, setTheme] = useState('dark');

  return (
    <div className="settings-panel">
      <div className="glass-card">
        <div className="card-title">Settings</div>
        <div className="card-subtitle">Customize your PersonalAI experience</div>

        <div className="settings-group">
          <div className="settings-group-title">Appearance</div>
          <div className="settings-btns">
            <button
              className={`settings-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={16} /> Dark Mode
            </button>
            <button
              className={`settings-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={16} /> Light Mode
            </button>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-title">Account</div>
          <div className="settings-btns">
            <button className="settings-btn"><User size={16} /> Account Management</button>
            <button className="settings-btn"><Lock size={16} /> Privacy &amp; Security</button>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-title">Integrations</div>
          <div className="settings-btns">
            <button className="settings-btn"><Calendar size={16} /> Google Calendar</button>
            <button className="settings-btn"><Calendar size={16} /> Outlook Calendar</button>
            <button className="settings-btn"><Link2 size={16} /> API Keys</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
