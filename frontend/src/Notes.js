import React, { useEffect, useState } from 'react';
import { FileText, Trash2, Plus, Loader2 } from 'lucide-react';

function Notes({ token }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedNote, setExpandedNote] = useState(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/notes', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setNotes(await res.json());
    } catch (e) { console.error('Notes fetch:', e); }
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, []);

  const addNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await fetch('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, content }),
    });
    setTitle('');
    setContent('');
    fetchNotes();
  };

  const deleteNote = async (id) => {
    await fetch(`/notes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchNotes();
  };

  return (
    <div className="notes-panel">
      <div className="glass-card">
        <div className="task-header">
          <div className="card-title">My Knowledge Base</div>
          <span className="task-count">{notes.length} items</span>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '20px' }}>
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : notes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0', textAlign: 'center' }}>
            Your memory is empty. Start adding knowledge below!
          </p>
        ) : (
          <div className="task-list">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className={`note-item ${expandedNote === note.id ? 'expanded' : ''}`}
                onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
              >
                <div 
                  className="flex-between" 
                  style={{ width: '100%', alignItems: 'flex-start' }}
                >
                  <div className="task-info">
                    <div className="flex-center" style={{ gap: '8px', justifyContent: 'flex-start' }}>
                      <span className="note-icon" style={{ color: 'var(--accent-light)' }}>
                        <FileText size={16} />
                      </span>
                      <span className="note-title" style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        {note.title}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                    style={{ opacity: 0.6 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {expandedNote === note.id && (
                  <div className="note-content-expanded">
                    <p style={{ margin: '12px 0', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                    {note.tags && (
                      <div className="tag-cloud">
                        {note.tags.split(',').map((tag, idx) => (
                          <span key={idx} className="tag-pill">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {expandedNote !== note.id && note.tags && (
                   <div style={{ marginLeft: '24px', opacity: 0.7 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-light)' }}>
                        AI Tags: {note.tags}
                      </span>
                   </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addNote} className="note-add-form" style={{ marginTop: '24px' }}>
          <input
            className="task-add-input"
            style={{ marginBottom: '8px', background: 'rgba(255,255,255,0.03)' }}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note Title..."
          />
          <textarea
            className="task-add-input"
            style={{ 
              minHeight: '80px', 
              padding: '12px', 
              borderRadius: '12px',
              resize: 'vertical',
              fontSize: '0.85rem',
              background: 'rgba(255,255,255,0.03)'
            }}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Add detailed information here so the AI can recall it in chat..."
          />
          <button 
            type="submit" 
            className="task-add-btn" 
            style={{ width: '100%', marginTop: '8px', borderRadius: '12px' }}
          >
            <Plus size={18} style={{ marginRight: '6px' }} /> Save to Knowledge Base
          </button>
        </form>
      </div>
    </div>
  );
}

export default Notes;
