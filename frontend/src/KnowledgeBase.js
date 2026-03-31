import React, { useState, useEffect, useCallback } from 'react';
import { Database, PlusCircle, Search, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const API = 'http://localhost:8000/api/rag';

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
      const r = await fetch(`${API}/stats`, { headers });
      if (r.ok) setStats(await r.json());
    } catch (_) {}
  }, [token]); 

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleIngest = async () => {
    if (!ingestText.trim()) return;
    setLoading(true);
    setStatus('');
    try {
      const r = await fetch(`${API}/ingest`, {
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
      const r = await fetch(`${API}/search?q=${encodeURIComponent(query)}&k=5`, { headers });
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

  const handleClear = async () => {
    if (!window.confirm('Clear ALL knowledge base data for your account? This cannot be undone.')) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/clear`, { method: 'DELETE', headers });
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
      <div className={`kb-status ${type}`}>
        <Icon size={16} />
        {msg || type}
      </div>
    );
  };

  return (
    <div className="kb-admin">
      <div className="kb-header">
        <h2 className="kb-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={24} /> Knowledge Base Admin
        </h2>
        <p className="kb-subtitle">
          Manage the personal context your AI uses to answer questions.
        </p>
      </div>

      <div className="kb-stats">
        <div className="kb-stat-card">
          <span className="kb-stat-value">{stats.notes_count}</span>
          <span className="kb-stat-label">Notes & Docs Indexed</span>
        </div>
        <div className="kb-stat-card">
          <span className="kb-stat-value">{stats.chat_count}</span>
          <span className="kb-stat-label">Chat Turns Indexed</span>
        </div>
        <button className="kb-clear-btn" onClick={handleClear} disabled={loading}>
          <Trash2 size={16} /> Clear All
        </button>
      </div>

      <div className="kb-tabs">
        <button
          className={`kb-tab ${tab === 'ingest' ? 'active' : ''}`}
          onClick={() => { setTab('ingest'); setStatus(''); }}
        >
          <PlusCircle size={16} /> Add Knowledge
        </button>
        <button
          className={`kb-tab ${tab === 'search' ? 'active' : ''}`}
          onClick={() => { setTab('search'); setStatus(''); }}
        >
          <Search size={16} /> Search Knowledge
        </button>
      </div>

      {tab === 'ingest' && (
        <div className="kb-panel">
          <label className="kb-label">Source label (optional)</label>
          <input
            className="kb-input"
            placeholder="e.g. meeting-notes, preferences, bio…"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />

          <label className="kb-label">Content to add</label>
          <textarea
            className="kb-textarea"
            placeholder="Paste any text you want the AI to remember..."
            value={ingestText}
            onChange={e => setIngest(e.target.value)}
            rows={8}
          />

          <div className="kb-actions">
            <button className="kb-primary-btn" onClick={handleIngest} disabled={loading || !ingestText.trim()}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Ingest'}
            </button>
          </div>
        </div>
      )}

      {tab === 'search' && (
        <div className="kb-panel">
          <label className="kb-label">Semantic search query</label>
          <div className="kb-search-row">
            <input
              className="kb-input"
              placeholder="Search your knowledge base…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="kb-primary-btn" onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            </button>
          </div>

          {results.length > 0 && (
            <div className="kb-results">
              <p className="kb-results-count">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
              {results.map((r, i) => (
                <div key={i} className="kb-result-card">
                  <span className="kb-result-num">#{i + 1}</span>
                  <p className="kb-result-text">{r}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {renderStatus()}
    </div>
  );
}

export default KnowledgeBase;
