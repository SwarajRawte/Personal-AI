import React from 'react';
import { motion } from 'framer-motion';
import './LandingPage.css';

const LandingPage = ({ onGetStarted }) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    },
    viewport: { once: true }
  };

  return (
    <div className="bg-transparent text-on-background font-body selection:bg-primary/30 antialiased min-h-screen relative overflow-x-hidden">
      {/* TopNavBar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full z-50 bg-neutral-900/40 backdrop-blur-xl border-b border-white/5"
      >
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="text-xl font-bold tracking-tighter text-white font-headline cursor-pointer">Kortex AI</div>
          <div className="hidden md:flex items-center space-x-8">
            {['Product', 'Solutions', 'Pricing', 'Docs'].map((item) => (
              <a key={item} className="font-manrope tracking-tight text-sm font-medium text-neutral-400 hover:text-violet-300 transition-colors" href={`#${item.toLowerCase()}`}>{item}</a>
            ))}
          </div>
          <div className="flex items-center space-x-6">
            <button className="font-manrope tracking-tight text-sm font-medium text-neutral-400 hover:text-violet-200" onClick={onGetStarted}>Log In</button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cta-gradient text-on-primary-fixed px-5 py-2.5 rounded-full font-manrope tracking-tight text-sm font-bold shadow-lg"
              onClick={onGetStarted}
            >
              Start for Free
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 pt-20">

        {/* Hero Content */}
        <motion.section 
            {...fadeInUp}
            className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32 flex flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-800 border border-white/10 text-xs font-semibold tracking-widest text-violet-300 uppercase"
          >
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            Next-Gen Intelligence
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-headline text-5xl md:text-7xl font-extrabold tracking-[-0.04em] text-white max-w-4xl leading-[1.05] text-glow mb-8"
          >
            Your high-intelligence <br/>
            <span className="cta-gradient">AI assistant</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-body text-lg md:text-xl text-neutral-400 max-w-2xl mb-12 leading-relaxed"
          >
            Empowering your productivity with next-generation reasoning, tasks, and notes. Information doesn't just sit on a screen—it breathes with purpose.
          </motion.p>

          {/* CTA Cluster */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-6 mb-24"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cta-gradient text-white px-10 py-5 rounded-full font-headline text-lg font-bold shadow-[0_0_40px_rgba(202,152,255,0.3)] flex items-center gap-2"
              onClick={onGetStarted}
            >
              Start for Free
              <span className="material-symbols-outlined">arrow_forward</span>
            </motion.button>
            <button className="bg-white/5 backdrop-blur-md text-white px-10 py-5 rounded-full font-headline text-lg font-bold border border-white/10 hover:bg-white/10 transition-all">
              Book a Demo
            </button>
          </motion.div>

          {/* Bento Section */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full mt-12 text-left"
          >
            {/* Main Preview Panel */}
            <motion.div 
              variants={fadeInUp}
              className="md:col-span-8 h-[500px] bg-neutral-900/50 backdrop-blur-xl rounded-3xl p-1 relative overflow-hidden border border-white/10 shadow-2xl"
            >
              <div className="bg-neutral-950 rounded-[1.4rem] w-full h-full flex flex-col overflow-hidden">
                <div className="h-14 border-b border-white/5 flex items-center px-6 gap-4 bg-neutral-900">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
                  </div>
                  <div className="flex-1 text-center font-label text-xs text-neutral-500">kortex.ai/workspace/neural-vault</div>
                </div>
                <div className="flex-1 p-8 relative">
                   <div className="w-full h-full bg-neutral-900 rounded-xl border border-white/5 flex items-center justify-center">
                     <span className="material-symbols-outlined text-neutral-700 text-6xl">grid_view</span>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Side Bento Cards */}
            <div className="md:col-span-4 flex flex-col gap-6">
              <motion.div 
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="flex-1 bg-neutral-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 flex flex-col justify-end group cursor-pointer hover:bg-neutral-800/50 transition-all"
              >
                <span className="material-symbols-outlined text-violet-400 text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                <h3 className="font-headline text-xl font-bold text-white mb-2">Deep Reasoning</h3>
                <p className="text-sm text-neutral-400">Complex problem-solving with chain-of-thought processing.</p>
              </motion.div>
              <motion.div 
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="flex-1 bg-neutral-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 flex flex-col justify-end relative overflow-hidden group cursor-pointer hover:bg-neutral-800/50 transition-all"
              >
                <h3 className="font-headline text-xl font-bold text-white mb-2">Autonomous Tasks</h3>
                <p className="text-sm text-neutral-400">Automate cross-platform workflows with zero-latency execution.</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>

        {/* Stats Section */}
        <section className="relative max-w-7xl mx-auto px-8 pb-32">
          <div className="flex flex-wrap justify-between gap-12 py-16 border-y border-white/5">
            {[
              { label: 'Uptime Reliability', value: '99.9%' },
              { label: 'Tokens/Sec', value: '50M+' },
              { label: 'Neural Encryption', value: '256-bit' },
              { label: 'Active Architects', value: '100k+' }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label} 
                variants={fadeInUp}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true }}
                className="flex flex-col gap-1"
              >
                <span className="text-4xl font-headline font-extrabold text-white">{stat.value}</span>
                <span className="text-sm text-neutral-500 font-label tracking-widest uppercase">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-8">
          <div className="flex flex-col gap-2 items-center md:items-start">
            <div className="text-lg font-bold text-neutral-200 font-headline">Kortex AI</div>
            <p className="font-inter text-xs tracking-wide text-neutral-500">© 2024 Kortex AI. All rights reserved.</p>
          </div>
          <div className="flex gap-10">
            {['Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
              <a key={link} className="font-inter text-xs tracking-wide text-neutral-500 hover:text-violet-400 transition-all" href={`#${link.toLowerCase().replace(/ /g, '-')}`}>{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
