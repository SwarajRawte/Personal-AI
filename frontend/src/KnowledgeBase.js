import React, { useState, useEffect, useCallback } from 'react';
import { Database, PlusCircle, Search, Trash2, CheckCircle2, XCircle, Loader2, FileUp, Sparkles, Activity, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { getApiUrl } from './api';

function KnowledgeBase({ token }) {
  const [stats, setStats]       = useState({ notes_count: 0, chat_count: 0 });
  const [ingestText, setIngest] = useState('');
  const [label, setLabel]       = useState('');
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState('ingest');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(getApiUrl('/api/rag/stats'), { headers });
      if (r.ok) setStats(await r.json());
    } catch (_) {}
  }, [token]); 

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleIngest = async () => {
    if (!ingestText.trim()) return;
    setLoading(true);
    setStatus('');
    try {
      const r = await fetch(getApiUrl('/api/rag/ingest'), {
        method: 'POST', headers,
        body: JSON.stringify({ text: ingestText, label: label || 'manual' }),
      });
      if (r.ok) {
        setStatus('success|Ingested successfully!');
        setIngest('');
        setLabel('');
        fetchStats();
      } else {
        const e = await r.json();
        setStatus(`error|${e.detail || 'Ingest failed'}`);
      }
    } catch (e) {
      setStatus(`error|${e.message}`);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const r = await fetch(getApiUrl(`/api/rag/search?q=${encodeURIComponent(query)}&k=5`), { headers });
      if (r.ok) {
        const data = await r.json();
        setResults(data.results);
        if (!data.results.length) setStatus('info|No matching results found.');
        else setStatus('');
      }
    } catch (e) {
      setStatus(`error|${e.message}`);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatus(`info|Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const r = await fetch(getApiUrl('/api/rag/upload'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await r.json();
      if (r.ok) {
        setStatus(`success|Successfully uploaded and indexed ${file.name} (${data.chars} chars).`);
        fetchStats();
      } else {
        setStatus(`error|${data.detail || 'Upload failed'}`);
      }
    } catch (err) {
      setStatus(`error|${err.message}`);
    }
    setLoading(false);
    e.target.value = '';
  };

  const handleClear = async () => {
    if (!window.confirm('Clear ALL knowledge base data for your account? This cannot be undone.')) return;
    setLoading(true);
    try {
      const r = await fetch(getApiUrl('/api/rag/clear'), { method: 'DELETE', headers });
      const data = await r.json();
      if (r.ok) {
        setStatus(`success|Cleared ${data.deleted} item(s).`);
        setResults([]);
        fetchStats();
      } else {
        setStatus(`error|${data.detail || 'Clear failed'}`);
      }
    } catch (e) {
      setStatus(`error|${e.message}`);
    }
    setLoading(false);
  };

  const renderStatus = () => {
    if (!status) return null;
    const [type, msg] = status.split('|');
    const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : Search;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`kb-status ${type}`}
      >
        <Icon size={16} />
        {msg || type}
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="kb-admin"
    >
      <div className="kb-header">
        <div className="flex-center" style={{ gap: '16px', marginBottom: '10px' }}>
           <div className="feature-icon-mini lg">
              <Database size={32} className="glow-icon" />
           </div>
           <div>
              <h2 className="kb-title">Knowledge Nexus Admin</h2>
              <p className="kb-subtitle">Manage high-dimensional context & neural memory</p>
           </div>
        </div>
      </div>

      <div className="kb-stats-bento">
        <div className="kb-stat-card glass-item">
          <div className="stat-icon-wrap"><Activity size={20} /></div>
          <div className="stat-data">
            <span className="kb-stat-value">{stats.notes_count}</span>
            <span className="kb-stat-label">Indexed Documents</span>
          </div>
        </div>
        <div className="kb-stat-card glass-item">
          <div className="stat-icon-wrap"><Layers size={20} /></div>
          <div className="stat-data">
             <span className="kb-stat-value">{stats.chat_count}</span>
             <span className="kb-stat-label">Active Neural Threads</span>
          </div>
        </div>
        <button className="kb-clear-btn premium glass-item" onClick={handleClear} disabled={loading}>
          <div className="btn-content">
            <Trash2 size={18} />
            <span>Purge Memory</span>
          </div>
        </button>
      </div>

      <div className="kb-tabs-dock glass-item">
        <button
          className={`kb-tab-nav ${tab === 'ingest' ? 'active' : ''}`}
          onClick={() => { setTab('ingest'); setStatus(''); }}
        >
          <PlusCircle size={18} /> Ingest
        </button>
        <button
          className={`kb-tab-nav ${tab === 'search' ? 'active' : ''}`}
          onClick={() => { setTab('search'); setStatus(''); }}
        >
          <Search size={18} /> Traverse
        </button>
        <button
          className={`kb-tab-nav ${tab === 'upload' ? 'active' : ''}`}
          onClick={() => { setTab('upload'); setStatus(''); }}
        >
          <FileUp size={18} /> Upload
        </button>
      </div>

      <div className="kb-main-content">
        <AnimatePresence mode="wait">
          {tab === 'ingest' && (
            <motion.div 
              key="ingest"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="kb-panel-modern glass-item"
            >
              <div className="input-group">
                <label className="kb-label-modern">Source Identifier</label>
                <input
                  className="neural-input-title"
                  placeholder="e.g. meeting-notes, preferences, bio…"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="kb-label-modern">Knowledge Fragment</label>
                <textarea
                  className="neural-input-body kb-textarea"
                  placeholder="Paste any text you want the AI to remember..."
                  value={ingestText}
                  onChange={e => setIngest(e.target.value)}
                />
              </div>

              <div className="kb-actions">
                <button className="neural-submit-btn" onClick={handleIngest} disabled={loading || !ingestText.trim()}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Secure Ingest'}
                </button>
              </div>
            </motion.div>
          )}

          {tab === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="kb-panel-modern glass-item"
            >
              <div className="kb-search-row-modern">
                <Sparkles size={20} className="search-sparkle-large" />
                <input
                  className="neural-input-title "
                  placeholder="Search semantic space…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button className="neural-submit-btn mini" onClick={handleSearch} disabled={loading || !query.trim()}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={20} />}
                </button>
              </div>

              {results.length > 0 && (
                <div className="kb-results-modern">
                  <div className="results-badge">{results.length} Matches Found</div>
                  {results.map((r, i) => (
                    <motion.div 
                      key={i} 
                      className="kb-result-card-modern glass-item"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="result-num-neural">0{i + 1}</div>
                      <p className="kb-result-text-modern">{r}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'upload' && (
            <motion.div 
               key="upload"
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 10 }}
               className="kb-panel-modern glass-item"
            >
              <div className="kb-upload-zone-modern">
                <div className="upload-glow-ring" />
                <FileUp size={48} className="kb-upload-icon-modern" />
                <h3>Neural Doc Uplink</h3>
                <p className="kb-upload-desc">PDF, CSV, or TXT (Max 10MB)</p>
                <input
                  type="file"
                  accept=".pdf,.csv,.txt"
                  onChange={handleFileUpload}
                  className="kb-file-input"
                  id="kb-file-upload-modern"
                  disabled={loading}
                />
                <label htmlFor="kb-file-upload-modern" className="neural-submit-btn upload-btn">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Select Fragment'}
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {renderStatus()}
    </motion.div>
  );
}

export default KnowledgeBase;
