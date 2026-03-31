import React, { useEffect, useState } from 'react';
import { FileText, Trash2, Plus, Loader2 } from 'lucide-react';

function Notes({ token }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!title.trim()) return;
    await fetch('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, content: '' }),
    });
    setTitle('');
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
          <div className="card-title">My Notes</div>
          <span className="task-count">{notes.length} notes</span>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '20px' }}>
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : notes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0', textAlign: 'center' }}>
            No notes yet. Create one below!
          </p>
        ) : (
          <div className="task-list">
            {notes.map((note) => (
              <div key={note.id} className="note-item">
                <div className="note-item-left">
                  <span className="note-icon"><FileText size={16} /></span>
                  <span className="note-title">{note.title}</span>
                </div>
                <button className="delete-btn" onClick={() => deleteNote(note.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addNote} className="task-add-row" style={{ marginTop: '16px' }}>
          <input
            className="task-add-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Add a new note..."
          />
          <button type="submit" className="task-add-btn">
            <Plus size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Notes;
