import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, FileText, Settings, Lightbulb, Calendar, ChevronRight, Activity, Zap } from 'lucide-react';

const Dashboard = ({ user, onNavigate }) => {
  const name = user?.username || user?.access_token || 'Explorer';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const quickCards = [
    { id: 'chat',     icon: Brain,       label: 'AI Chat',   desc: 'Sync with your personal neural assistant' },
    { id: 'tasks',    icon: CheckCircle, label: 'Tasks',     desc: 'Organize your day with precision' },
    { id: 'notes',    icon: FileText,    label: 'Notes',     desc: 'Capture fleeting thoughts instantly' },
    { id: 'settings', icon: Settings,    label: 'Settings',  desc: 'Tailor your AI experience' },
  ];

  return (
    <motion.div 
      className="dashboard-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Header */}
      <motion.div className="dashboard-hero" variants={itemVariants}>
        <h1>Welcome back, <span className="text-glow">{name}</span>!</h1>
        <p>Your Kortex environment is calibrated. All neural pathways are operational.</p>
      </motion.div>

      {/* Bento Grid Sections */}
      <div className="dashboard-sections">
        {/* Main Intelligence Overview */}
        <motion.div className="glass-card" variants={itemVariants} style={{ gridColumn: 'span 1' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
               <Activity size={20} />
            </div>
            <h3 className="font-headline text-lg font-bold text-white">Neural Intelligence Feed</h3>
          </div>
          
          <div className="overview-list">
            <div className="overview-item">
              <div className="overview-dot" />
              <span>Analyzing 12 recursive thought patterns from your recent Chat session.</span>
            </div>
            <div className="overview-item">
              <div className="overview-dot" />
              <span>Identified 3 high-priority tasks requiring autonomous reasoning.</span>
            </div>
            <div className="overview-item">
               <div className="overview-dot" />
               <span className="text-violet-300">New Insight: "Neural Vault" expansion suggested based on note density.</span>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 flex items-center gap-2 text-sm font-bold text-violet-400 hover:text-white transition-colors"
          >
            <Zap size={14} fill="currentColor" /> Optimize Productivity <ChevronRight size={14} />
          </motion.button>
        </motion.div>

        {/* Neural Sync / Calendar */}
        <motion.div className="glass-card" variants={itemVariants}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
               <Calendar size={20} />
            </div>
            <h3 className="font-headline text-lg font-bold text-white">Space-Time Sync</h3>
          </div>
          
          <p className="text-sm text-neutral-400 leading-relaxed mb-6">
             Synchronize 3D context with your temporal external schedules.
          </p>

          <div className="flex flex-col gap-3">
             <button className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left text-sm font-medium flex items-center justify-between group">
                Google Calendar <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
             </button>
             <button className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left text-sm font-medium flex items-center justify-between group">
                Outlook 365 <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
             </button>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Grid */}
      <div className="action-grid">
        {quickCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div 
              key={card.id} 
              className="feature-card" 
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.2 }
              }}
              onClick={() => onNavigate(card.id)}
            >
              <div className="feature-icon-wrapper">
                <Icon size={24} strokeWidth={2} />
              </div>
              <div className="feature-label">{card.label}</div>
              <div className="feature-desc">{card.desc}</div>
              
              <div className="absolute top-4 right-6 opacity-20 pointer-events-none">
                 <Icon size={48} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default Dashboard;
