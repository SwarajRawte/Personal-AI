import React, { useState } from 'react';
import { Moon, Sun, User, Lock, Calendar, Link2, Settings as SettingsIcon, Shield, Palette, Database } from 'lucide-react';
import { motion } from 'framer-motion';

function Settings() {
  const [theme, setTheme] = useState('dark');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="settings-panel"
    >
      <div className="glass-card premium-card">
        <div className="task-header" style={{ marginBottom: '30px' }}>
          <div className="flex-center" style={{ gap: '12px' }}>
            <div className="feature-icon-mini">
              <SettingsIcon size={20} className="glow-icon" />
            </div>
            <div>
              <div className="card-title">Neural Preferences</div>
              <div className="card-subtitle">System configuration & optimization</div>
            </div>
          </div>
        </div>

        <div className="settings-bento-grid">
           {/* Appearance */}
           <motion.div variants={itemVariants} className="settings-section glass-item">
              <div className="section-title">
                <Palette size={16} className="section-icon" />
                <span>Appearance</span>
              </div>
              <div className="settings-options-row">
                <button
                  className={`settings-tab-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <Moon size={16} /> Dark Mode
                </button>
                <button
                  className={`settings-tab-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <Sun size={16} /> Light Mode
                </button>
              </div>
           </motion.div>

           {/* Account */}
           <motion.div variants={itemVariants} className="settings-section glass-item">
              <div className="section-title">
                <User size={16} className="section-icon" />
                <span>Account Control</span>
              </div>
              <div className="settings-list">
                 <button className="settings-link-btn">
                   <User size={14} /> Profile Intelligence
                 </button>
                 <button className="settings-link-btn">
                   <Lock size={14} /> Neural Privacy
                 </button>
                 <button className="settings-link-btn">
                   <Shield size={14} /> Security Protocols
                 </button>
              </div>
           </motion.div>

           {/* Integrations */}
           <motion.div variants={itemVariants} className="settings-section glass-item">
              <div className="section-title">
                <Database size={16} className="section-icon" />
                <span>External Sync</span>
              </div>
              <div className="settings-list">
                 <button className="settings-link-btn active-link">
                   <Calendar size={14} /> Google Calendar
                   <span className="status-dot online" />
                 </button>
                 <button className="settings-link-btn">
                   <Calendar size={14} /> Outlook Calendar
                 </button>
                 <button className="settings-link-btn">
                   <Link2 size={14} /> API Integrations
                 </button>
              </div>
           </motion.div>

           {/* System Info */}
           <motion.div variants={itemVariants} className="settings-section glass-item info-section">
              <div className="section-title">
                 <SettingsIcon size={16} className="section-icon" />
                 <span>Nexus Status</span>
              </div>
              <div className="system-stats">
                 <div className="stat-row">
                    <span>Version</span>
                    <span className="stat-val">3.4.0 (Neural)</span>
                 </div>
                 <div className="stat-row">
                    <span>Database</span>
                    <span className="stat-val">Postgres (Optimized)</span>
                 </div>
                 <div className="stat-row">
                    <span>Recall Latency</span>
                    <span className="stat-val">12ms</span>
                 </div>
              </div>
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default Settings;
