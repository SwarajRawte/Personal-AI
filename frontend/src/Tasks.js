import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, CheckCircle2, ListTodo, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from './api';

function Tasks({ token }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/tasks'), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTasks(await res.json());
    } catch (e) {
      console.error('Tasks fetch:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await fetch(getApiUrl('/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description: '' }),
      });
      setTitle('');
      fetchTasks();
    } catch (e) {
      console.error('Add task error:', e);
    }
    setLoading(false);
  };

  const toggleTask = async (id, completed) => {
    try {
      await fetch(getApiUrl(`/tasks/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed }),
      });
      fetchTasks();
    } catch (e) {
      console.error('Toggle task error:', e);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(getApiUrl(`/tasks/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchTasks();
    } catch (e) {
      console.error('Delete task error:', e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="tasks-panel"
    >
      <div className="glass-card premium-card">
        <div className="task-header">
           <div className="flex-center" style={{ gap: '12px' }}>
            <div className="feature-icon-mini">
              <ListTodo size={20} className="glow-icon" />
            </div>
            <div>
              <div className="card-title">Neural Objectives</div>
              <div className="card-subtitle">Strategic task orchestration</div>
            </div>
          </div>
          <span className="task-count">{tasks.filter(t => !t.completed).length} Pending</span>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="flex-center" style={{ padding: '60px' }}>
            <Loader2 className="animate-spin glow-icon" size={32} />
          </div>
        ) : tasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-state"
          >
            <div className="empty-icon-ring">
              <ListTodo size={40} opacity={0.2} />
            </div>
            <p>No active directives. Define your next objective below.</p>
          </motion.div>
        ) : (
          <div className="task-list">
            <AnimatePresence mode="popLayout">
              {tasks.map((task, i) => (
                <motion.div 
                  key={task.id} 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={`task-item glass-item ${task.completed ? 'completed-task' : ''}`}
                >
                  <div className="task-item-left">
                    <button 
                      className={`task-check ${task.completed ? 'completed' : ''}`}
                      onClick={() => toggleTask(task.id, !task.completed)}
                    >
                      {task.completed ? <CheckCircle2 size={16} /> : <div className="check-ring" />}
                    </button>
                    <div className="task-text-container">
                      <span className={`task-item-title ${task.completed ? 'strikethrough' : ''}`}>
                        {task.title}
                      </span>
                      {task.priority && (
                        <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="task-delete-btn" onClick={() => deleteTask(task.id)}>
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <form onSubmit={addTask} className="neural-form-dock task-dock">
          <div className="form-inner">
            <div className="input-with-glow">
              <input
                className="neural-input-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="New Objective..."
                required
              />
              <div className="input-glow-line" />
            </div>
            <button type="submit" className="neural-submit-btn mini">
              <Plus size={20} />
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default Tasks;
