import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, FileText, Clock, Lightbulb, BarChart3, Send, Mic, MicOff,
  Plus, Pin, PinOff, ChevronRight, X, MessageSquare, Square, Zap, Activity, ChevronDown, ChevronUp, User
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import VoiceInput from './VoiceInput';
import robotImg from './assets/ai-modern.png';
import { getEndpoint } from './config';

const EXAMPLE_PROMPTS = [
  { icon: FileText, label: 'Summarize my notes', desc: 'Get a quick overview' },
  { icon: Clock, label: 'Set a reminder', desc: 'Never miss a deadline' },
  { icon: Lightbulb, label: 'Brainstorm ideas', desc: 'Creative problem solving' },
  { icon: BarChart3, label: 'Create a report', desc: 'Structured summaries' },
];

const MODEL_OPTIONS = [
  { value: 'auto', label: 'Auto (Smart)', badge: 'Dynamic' },
  { value: 'groq-deepseek-r1', label: 'DeepSeek R1', badge: 'Reasoning' },
  { value: 'google-gemini', label: 'Gemini 2.0 Flash', badge: 'Pro' },
  { value: 'hf-flux', label: 'FLUX.1 (HF)', badge: 'Art' },
];

const Chat = ({ token }) => {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const sessionIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => { 
    fetchSessions(); 
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(getEndpoint('/chat/sessions'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSessions(await res.json());
    } catch (err) { console.error('Failed to fetch sessions', err); }
  };

  const loadSession = async (sessionId) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(getEndpoint(`/chat/sessions/${sessionId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages.map(m => ({
          from: m.role === 'user' ? 'user' : 'ai',
          text: m.content,
        })));
        sessionIdRef.current = sessionId;
        setCurrentSessionId(sessionId);
      }
    } catch (err) { console.error('Failed to load session', err); }
    setLoading(false);
  };

  const startNewChat = () => {
    sessionIdRef.current = null;
    setCurrentSessionId(null);
    setMessages([]);
    setInput('');
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    if (loading) return;

    abortControllerRef.current = new AbortController();
    setLoading(true);
    
    const historySnapshot = messages.map(m => ({ 
      role: m.from === 'user' ? 'user' : 'assistant', 
      content: m.text 
    }));

    setMessages(prev => [...prev, { from: 'user', text: msg }]);
    setInput('');

    try {
      const body = { 
        message: msg, 
        model: selectedModel, 
        history: historySnapshot 
      };
      if (sessionIdRef.current) body.session_id = sessionIdRef.current;

      const res = await fetch(getEndpoint('/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => [...prev, { from: 'ai', text: `Error: ${data.detail || res.statusText}` }]);
      } else {
        if (!sessionIdRef.current) fetchSessions();
        if (data.session_id) { sessionIdRef.current = data.session_id; setCurrentSessionId(data.session_id); }
        setMessages(prev => [...prev, {
          from: 'ai',
          text: data.response,
          modelUsed: data.model_used
        }]);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, { from: 'ai', text: `Network error: ${err.message}` }]);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const currentModel = MODEL_OPTIONS.find(m => m.value === selectedModel) || MODEL_OPTIONS[0];

  return (
    <div className="chat-workspace">
      {/* Sidebar */}
      <motion.aside 
        className="chat-sidebar"
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0 }}
      >
        <div className="chat-sidebar-header">
          <button className="new-chat-btn" onClick={startNewChat}>
            <Plus size={18} /> New Sync Session
          </button>
        </div>

        <div className="chat-sidebar-list">
          {sessions.map(s => (
            <button
              key={s.id}
              className={`chat-sidebar-item ${currentSessionId === s.id ? 'active' : ''}`}
              onClick={() => loadSession(s.id)}
            >
              <MessageSquare size={16} />
              <span className="truncate">{s.title || 'Untitled Sync'}</span>
            </button>
          ))}
        </div>
      </motion.aside>

      {/* Main Area */}
      <main className="chat-main">
        {/* Toggle Sidebar Button */}
        <button 
          className="absolute top-6 left-6 z-50 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ChevronRight className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} size={20} />
        </button>

        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div 
              key="hero"
              className="chat-hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold mb-8">
                <Activity size={12} /> NEURAL SYNC ACTIVE
              </div>
              <h1 className="chat-hero-title">How can I assist your <br/> <span className="text-glow">intelligence today?</span></h1>
              <p className="chat-hero-sub">Engage Kortex Engine with complex reasoning or creative synthesis.</p>

              <div className="prompt-cards">
                {EXAMPLE_PROMPTS.map((p, i) => (
                  <motion.button 
                    key={i} 
                    className="prompt-card"
                    onClick={() => sendMessage(p.label)}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="prompt-card-icon"><p.icon size={24} /></div>
                    <div className="prompt-card-label">{p.label}</div>
                    <div className="prompt-card-desc">{p.desc}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="chat-messages-area">
              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  className={`chat-msg-container ${msg.from === 'user' ? 'chat-msg--user' : ''}`}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className={`chat-msg ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`chat-msg-avatar ${msg.from === 'ai' ? 'ai-avatar' : ''}`}>
                      {msg.from === 'ai' ? <img src={robotImg} alt="K" /> : <User size={20} />}
                    </div>
                    <div className={`chat-msg-bubble chat-msg-bubble--${msg.from}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      {msg.from === 'ai' && msg.modelUsed && (
                        <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-30">
                          <Brain size={10} /> {msg.modelUsed}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="chat-msg-container">
                   <div className="chat-msg">
                      <div className="chat-msg-avatar ai-avatar"><img src={robotImg} alt="K" /></div>
                      <div className="chat-msg-bubble chat-msg-bubble--ai flex gap-1">
                        <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-white" />
                        <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-white" />
                        <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </AnimatePresence>

        {/* Input Dock */}
        <div className="chat-input-dock">
          <div className="chat-input-box">
             {/* Model Selector integrated into input */}
             <div className="relative flex items-center">
               <button 
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border ${showModelMenu ? 'bg-violet-500/20 border-violet-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                 onClick={() => setShowModelMenu(!showModelMenu)}
               >
                 <Brain size={16} className="text-violet-400" />
                 <span className="text-xs font-bold whitespace-nowrap hidden sm:inline-block">
                   {MODEL_OPTIONS.find(m => m.value === selectedModel)?.label.split(' ')[0]}
                 </span>
                 <ChevronUp size={14} className={`transition-transform ${showModelMenu ? 'rotate-180' : ''}`} />
               </button>

               <AnimatePresence>
                 {showModelMenu && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: -8, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute bottom-full left-0 mb-2 w-56 p-2 rounded-xl bg-black/90 backdrop-blur-2xl border border-white/10 shadow-2xl z-[100]"
                   >
                     <div className="p-2 text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">Select Neural Engine</div>
                     {MODEL_OPTIONS.map((m) => (
                       <button
                         key={m.value}
                         className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-all ${selectedModel === m.value ? 'bg-violet-500/20 text-violet-300' : 'hover:bg-white/5 text-white/70'}`}
                         onClick={() => {
                           setSelectedModel(m.value);
                           setShowModelMenu(false);
                         }}
                       >
                         <div className="flex flex-col items-start gap-0.5">
                           <span className="font-semibold">{m.label}</span>
                           <span className="text-[10px] opacity-50 uppercase tracking-tighter">{m.badge}</span>
                         </div>
                         {selectedModel === m.value && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />}
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>

             <div className="w-[1px] h-6 bg-white/10 mx-1" />

             <VoiceInput onResult={(text) => setInput(prev => prev + ' ' + text)} compact={true} />
             <input 
               ref={inputRef}
               className="chat-input-field"
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
               placeholder="Enter neural prompt..."
               disabled={loading}
             />
             <button 
               className="chat-send-btn"
               onClick={() => loading ? handleStop() : sendMessage()}
               disabled={!loading && !input.trim()}
             >
               {loading ? <Square size={16} fill="currentColor" /> : <Send size={20} />}
             </button>
          </div>
          <p className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Encrypted Neural Pathway Active</p>
        </div>
      </main>
    </div>
  );
};

export default Chat;
