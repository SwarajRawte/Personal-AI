import React, { useEffect, useState } from 'react';
import { FileText, Trash2, Plus, Loader2, Sparkles, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEndpoint } from './config';

function Notes({ token }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedNote, setExpandedNote] = useState(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(getEndpoint('/notes'), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setNotes(await res.json());
    } catch (e) {
      console.error('Notes fetch:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await fetch(getEndpoint('/notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content }),
      });
      setTitle('');
      setContent('');
      fetchNotes();
    } catch (e) {
      console.error('Add note error:', e);
    }
    setLoading(false);
  };

  const deleteNote = async (id) => {
    try {
      await fetch(getEndpoint(`/notes/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchNotes();
    } catch (e) {
      console.error('Delete note error:', e);
    }
  };

  // Animation variants
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
      className="notes-panel"
    >
      <div className="glass-card premium-card">
        <div className="task-header">
          <div className="flex-center" style={{ gap: '12px' }}>
            <div className="feature-icon-mini">
              <Database size={20} className="glow-icon" />
            </div>
            <div>
              <div className="card-title">Knowledge Nexus</div>
              <div className="card-subtitle">Stored insights & neural context</div>
            </div>
          </div>
          <span className="task-count">{notes.length} Fragments</span>
        </div>

        <div className="search-filter-bar" style={{ marginBottom: '20px' }}>
           <div className="glass-search-input">
              <Sparkles size={16} className="search-sparkle" />
              <input type="text" placeholder="Synthesize from memory..." disabled />
           </div>
        </div>

        {loading && notes.length === 0 ? (
          <div className="flex-center" style={{ padding: '60px' }}>
            <Loader2 className="animate-spin glow-icon" size={32} />
          </div>
        ) : notes.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-state"
          >
            <div className="empty-icon-ring">
              <FileText size={40} opacity={0.2} />
            </div>
            <p>Your neural lattice is empty. Begin recording data fragments below.</p>
          </motion.div>
        ) : (
          <div className="note-grid">
            <AnimatePresence mode="popLayout">
              {notes.map((note) => (
                <motion.div 
                  key={note.id} 
                  variants={itemVariants}
                  layout
                  className={`note-card glass-item ${expandedNote === note.id ? 'expanded' : ''}`}
                  onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <div className="flex-between" style={{ width: '100%', alignItems: 'center' }}>
                    <div className="note-header-info">
                      <div className="flex-center" style={{ gap: '10px', justifyContent: 'flex-start' }}>
                        <span className="note-indicator" />
                        <span className="note-title-text">{note.title}</span>
                      </div>
                    </div>
                    <div className="note-actions">
                       <button 
                        className="note-delete-btn" 
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedNote === note.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                        className="note-content-area"
                      >
                        <div className="divider" style={{ margin: '15px 0' }} />
                        <p className="note-body-text">{note.content}</p>
                        
                        {note.tags && (
                          <div className="note-tag-row">
                            {note.tags.split(',').map((tag, idx) => (
                              <span key={idx} className="neural-tag">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {expandedNote !== note.id && note.tags && (
                     <div className="note-mini-tags">
                        <Sparkles size={10} style={{ marginRight: '5px' }} />
                        <span>{note.tags.split(',')[0]}...</span>
                     </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <form onSubmit={addNote} className="neural-form-dock">
          <div className="form-inner">
            <input
              className="neural-input-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Insight Title"
              required
            />
            <textarea
              className="neural-input-body"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe the knowledge fragment..."
              required
            />
            <button 
              type="submit" 
              className="neural-submit-btn" 
              disabled={loading || !title.trim() || !content.trim()}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Plus size={18} style={{ marginRight: '8px' }} />
                  Record to Nexus
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default Notes;
