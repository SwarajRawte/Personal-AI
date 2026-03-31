import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, ChevronDown, ChevronUp, FileText, Clock,
  Lightbulb, BarChart3, Bot, User, Send, Mic, MicOff,
  Plus, Pin, PinOff, ChevronRight, X, Brain, MessageSquare, Square
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import VoiceInput from './VoiceInput';
import robotImg from './assets/ai-modern.png';

const EXAMPLE_PROMPTS = [
  { icon: FileText, label: 'Summarize my notes', desc: 'Get a quick overview' },
  { icon: Clock, label: 'Set a reminder', desc: 'Never miss a deadline' },
  { icon: Lightbulb, label: 'Brainstorm ideas', desc: 'Creative problem solving' },
  { icon: BarChart3, label: 'Create a report', desc: 'Structured summaries' },
];

const MODEL_OPTIONS = [
  { value: 'auto', label: 'Auto (Smart)', badge: 'Dynamic' },
  { value: 'hcl', label: 'GPT-4.1', badge: 'Enterprise' },
  { value: 'groq-llama-3.3-70b', label: 'Llama 3.3 (Groq)', badge: 'Flagship' },
  { value: 'groq-deepseek-r1', label: 'DeepSeek R1', badge: 'Reasoning' },
  { value: 'groq-llama-3.1-8b', label: 'Llama 3.1 8B', badge: 'Fastest' },
  { value: 'hf-deepseek-coder', label: 'DeepSeek Coder', badge: 'Programming' },
  { value: 'hf-mistral', label: 'Mistral 7B (HF)', badge: 'Balanced' },
  { value: 'hf-flux', label: 'FLUX.1 (HF)', badge: 'Art' },
  { value: 'google-gemini', label: 'Gemini 2.5 Flash', badge: 'Pro (Stable)' },
];

function Chat({ token }) {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const sessionIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => { fetchSessions(); }, []);

  // Auto-close sidebar after 4s of no hover
  const resetIdleTimer = () => {
    if (sidebarPinned) return;
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setSidebarOpen(false), 4000);
  };

  const handleSidebarEnter = () => {
    if (sidebarPinned) return;
    clearTimeout(idleTimerRef.current);
    setSidebarOpen(true);
  };

  const handleSidebarLeave = () => { if (!sidebarPinned) resetIdleTimer(); };

  const togglePin = () => {
    const next = !sidebarPinned;
    setSidebarPinned(next);
    if (next) { setSidebarOpen(true); clearTimeout(idleTimerRef.current); }
    else resetIdleTimer();
  };

  useEffect(() => () => clearTimeout(idleTimerRef.current), []);

  // Close model menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.model-pill-wrapper')) setShowModelMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('http://localhost:8000/chat/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSessions(await res.json());
    } catch (err) { console.error('Failed to fetch sessions', err); }
  };

  const loadSession = async (sessionId) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/chat/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages.map(m => ({
          from: m.role === 'user' ? 'user' : 'ai',
          text: m.content,
          ragUsed: false,
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
    inputRef.current?.focus();
    if (!sidebarPinned) resetIdleTimer();
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    // Initialize AbortController for this request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    const historySnapshot = messages
      .filter(m => m.from === 'user' || m.from === 'ai')
      .map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));

    setMessages(prev => [...prev, { from: 'user', text: msg }]);
    setInput('');

    try {
      const body = { 
        message: msg, 
        model: selectedModel, 
        history: historySnapshot,
        image_base64: image
      };
      if (sessionIdRef.current) body.session_id = sessionIdRef.current;

      setImage(null);
      setImagePreview(null);

      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => [...prev, { from: 'ai', text: `Error: ${data.detail || res.statusText}`, ragUsed: false }]);
      } else {
        if (!sessionIdRef.current) fetchSessions();
        if (data.session_id) { sessionIdRef.current = data.session_id; setCurrentSessionId(data.session_id); }
        setMessages(prev => [...prev, {
          from: 'ai',
          text: data.response,
          ragUsed: data.rag_used,
          imageUrl: data.image_url,
          modelUsed: data.model_used
        }]);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request cancelled by user');
      } else {
        setMessages(prev => [...prev, { from: 'ai', text: `Network error: ${err.message}`, ragUsed: false }]);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handlePaste = (e) => {
    const item = e.clipboardData.items[0];
    if (item?.type?.startsWith('image/')) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result.split(',')[1]); // Base64 only
        setImagePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const currentModel = MODEL_OPTIONS.find(m => m.value === selectedModel) || MODEL_OPTIONS[1];
  const isEmpty = messages.length === 0;

  return (
    <div className="chat-workspace">
      {/* Background */}
      <div className="chat-bg-layer">
        <img src={robotImg} alt="" className="chat-bg-robot" />
        <div className="chat-bg-overlay" />
      </div>

      {/* Peek strip when collapsed */}
      {!sidebarOpen && (
        <div className="sidebar-peek" onMouseEnter={handleSidebarEnter} title="Show history">
          <button className="sidebar-toggle-btn" onClick={() => { setSidebarOpen(true); if (!sidebarPinned) resetIdleTimer(); }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* History Sidebar */}
      <aside
        className={`chat-sidebar${sidebarOpen ? '' : ' chat-sidebar--collapsed'}`}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        <div className="chat-sidebar-header">
          <button className="new-chat-btn" onClick={startNewChat}>
            <Plus size={15} strokeWidth={2.5} />
            New Chat
          </button>
          <div className="sidebar-controls">
            <button
              className={`sidebar-pin-btn${sidebarPinned ? ' pinned' : ''}`}
              onClick={togglePin}
              title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
            >
              {sidebarPinned ? <Pin size={14} /> : <PinOff size={14} />}
            </button>
            <button
              className="sidebar-close-btn"
              onClick={() => { setSidebarOpen(false); setSidebarPinned(false); }}
              title="Close sidebar"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="chat-sidebar-list">
          {sessions.length === 0 ? (
            <div className="chat-sidebar-empty">No history yet</div>
          ) : (
            sessions.map(s => (
              <button
                key={s.id}
                className={`chat-sidebar-item${currentSessionId === s.id ? ' active' : ''}`}
                onClick={() => loadSession(s.id)}
                title={s.title}
              >
                <span className="sidebar-item-icon-dot"><MessageSquare size={13} /></span>
                <span className="sidebar-item-text">{s.title || 'Untitled Chat'}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat */}
      <main className="chat-main">

        {/* Hero (empty state) */}
        {isEmpty && (
          <div className="chat-hero">
            <div className="chat-hero-badge">
              <img src={robotImg} alt="AI" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
              Your Personal AI
            </div>
            <h1 className="chat-hero-title">
              How can AI help you <span className="gradient-text">today?</span>
            </h1>
            <p className="chat-hero-sub">Ask anything — smart, fast and personal</p>

            {/* Model pill */}
            <div className="model-pill-wrapper">
              <button className="model-pill" onClick={() => setShowModelMenu(v => !v)}>
                <Brain size={15} strokeWidth={1.8} />
                <span className="model-pill-name">{currentModel.label}</span>
                <span className="model-pill-badge">{currentModel.badge}</span>
                {showModelMenu ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {showModelMenu && (
                <div className="model-dropdown">
                  {MODEL_OPTIONS.map(m => (
                    <button
                      key={m.value}
                      className={`model-option${m.value === selectedModel ? ' active' : ''}`}
                      onClick={() => { setSelectedModel(m.value); setShowModelMenu(false); }}
                    >
                      <span className="model-option-name">{m.label}</span>
                      <span className="model-option-badge">{m.badge}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt cards */}
            <div className="prompt-cards">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button key={i} className="prompt-card" onClick={() => sendMessage(p.label)}>
                  <span className="prompt-card-icon"><p.icon size={22} strokeWidth={1.6} /></span>
                  <span className="prompt-card-label">{p.label}</span>
                  <span className="prompt-card-desc">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compact model pill during chat */}
        {!isEmpty && (
          <div className="chat-topbar-model">
            <div className="model-pill-wrapper">
              <button className="model-pill compact" onClick={() => setShowModelMenu(v => !v)}>
                <Brain size={13} strokeWidth={1.8} />
                <span className="model-pill-name">{currentModel.label}</span>
                <span className="model-pill-badge">{currentModel.badge}</span>
                {showModelMenu ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showModelMenu && (
                <div className="model-dropdown">
                  {MODEL_OPTIONS.map(m => (
                    <button
                      key={m.value}
                      className={`model-option${m.value === selectedModel ? ' active' : ''}`}
                      onClick={() => { setSelectedModel(m.value); setShowModelMenu(false); }}
                    >
                      <span className="model-option-name">{m.label}</span>
                      <span className="model-option-badge">{m.badge}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        {!isEmpty && (
          <div className="chat-messages-area">
            {messages.map((msg, i) => (
              <div key={i} className="chat-msg-container">
                <div className={`chat-msg chat-msg--${msg.from}`}>
                  {msg.from === 'ai' && (
                    <div className="chat-msg-avatar ai-avatar"><img src={robotImg} alt="AI" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /></div>
                  )}
                  <div className={`chat-msg-bubble chat-msg-bubble--${msg.from}`}>
                    {msg.imageUrl && (
                      <div className="chat-image-wrapper">
                        <img src={`http://localhost:8000${msg.imageUrl}`} alt="Generated AI" className="chat-gen-image" />
                      </div>
                    )}
                    <div className="message-content-text">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="code-block-wrapper"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                    <div className="msg-metadata">
                      {msg.from === 'ai' && msg.ragUsed && (
                        <span className="rag-badge"><Brain size={11} /> from notes</span>
                      )}
                      {msg.from === 'ai' && msg.modelUsed && (
                        <span className="model-used-badge">via {msg.modelUsed}</span>
                      )}
                    </div>
                  </div>
                  {msg.from === 'user' && (
                    <div className="chat-msg-avatar user-avatar"><User size={16} strokeWidth={1.8} /></div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg-container">
                <div className="chat-msg chat-msg--ai">
                  <div className="chat-msg-avatar ai-avatar"><img src={robotImg} alt="AI" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /></div>
                  <div className="chat-msg-bubble chat-msg-bubble--ai typing-bubble">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Dock */}
        <div className={`chat-input-dock${isEmpty ? ' centered' : ''}`}>
          {imagePreview && (
            <div className="chat-image-preview-container">
              <img src={imagePreview} alt="Preview" className="chat-image-preview" />
              <button className="chat-image-preview-remove" onClick={() => { setImage(null); setImagePreview(null); }}>
                <X size={12} />
              </button>
            </div>
          )}
          <div className="chat-input-box">
            <VoiceInput
              onResult={(text) => setInput(prev => prev + ' ' + text)}
              compact={true}
            />
            <input
              ref={inputRef}
              className="chat-input-field"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              onPaste={handlePaste}
              placeholder="Ask anything or paste an image..."
              disabled={loading}
            />
            <button
              className={`chat-send-btn ${loading ? 'stop-btn' : ''}`}
              onClick={() => loading ? handleStop() : sendMessage()}
              disabled={!loading && !input.trim()}
            >
              {loading ? (
                <Square size={14} fill="currentColor" strokeWidth={0} />
              ) : (
                <Send size={17} strokeWidth={2} />
              )}
            </button>
          </div>
          <p className="chat-input-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
}

export default Chat;
