import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

function Tasks({ token }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/tasks', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTasks(await res.json());
    } catch (e) { console.error('Tasks fetch:', e); }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description: '' }),
    });
    setTitle('');
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await fetch(`/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchTasks();
  };

  const COLORS = ['#7c3aed', '#6366f1', '#a78bfa', '#818cf8', '#4f46e5'];

  return (
    <div className="tasks-panel">
      <div className="glass-card">
        <div className="task-header">
          <div className="card-title">My Tasks</div>
          <span className="task-count">{tasks.length} tasks</span>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '20px' }}>
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : tasks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0', textAlign: 'center' }}>
            No tasks yet. Add one below!
          </p>
        ) : (
          <div className="task-list">
            {tasks.map((task, i) => (
              <div key={task.id} className="task-item">
                <div className="task-item-left">
                  <div className="task-dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="task-item-title">{task.title}</span>
                </div>
                <button className="delete-btn" onClick={() => deleteTask(task.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addTask} className="task-add-row">
          <input
            className="task-add-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Add a new task..."
          />
          <button type="submit" className="task-add-btn">
            <Plus size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Tasks;
