import { GoogleLogin } from '@react-oauth/google';
import './AuthForm.css';
import { getApiUrl } from './api';

function AuthForm({ onAuth, onBack }) {
  const [view, setView] = useState('login'); // 'login', 'signup', 'reset'
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (view === 'reset') {
      // Simulate password reset network call
      setTimeout(() => {
        setSuccess('Password reset link sent to ' + username);
        setTimeout(() => setView('login'), 3000);
      }, 1000);
      return;
    }

    const url = view === 'login' ? getApiUrl('/login') : getApiUrl('/signup');
    const body = view === 'login'
      ? new URLSearchParams({ username, password })
      : JSON.stringify({ username, password, full_name: fullName });
    const headers = view === 'login'
      ? { 'Content-Type': 'application/x-www-form-urlencoded' }
      : { 'Content-Type': 'application/json' };
      
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      if (!res.ok) {
        const text = await res.text();
        let message = 'Auth failed';
        try {
          const data = JSON.parse(text);
          message = data.detail || message;
        } catch {
          // Backend returned non-JSON (e.g. "Internal Server Error")
          message = text.length < 200 ? text : `Server error (${res.status})`;
        }
        throw new Error(message);
      }
      const data = await res.json();
      onAuth(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const GoogleIcon = () => (
    <svg className="auth-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  return (
    <div className="auth-page-container">
      <div className="auth-glow-effect"></div>
      
      {onBack && (
        <button className="auth-back-btn" onClick={onBack}>
          ← Back
        </button>
      )}

      <div className="auth-form-card">
        <h2 className="auth-title">
          {view === 'login' ? 'Welcome back 👋' : view === 'signup' ? 'Create your AI brain 🧠' : 'Reset Password 🔒'}
        </h2>
        <p className="auth-subtitle">
          {view === 'login' ? 'Enter your AI workspace' : view === 'signup' ? 'Start your personal AI journey' : "We'll send you a reset link"}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {view === 'signup' && (
            <div className="auth-input-group">
              <input
                type="text"
                className="auth-input"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-input-group">
            <input
              type="text" 
              className="auth-input"
              placeholder={view === 'reset' ? 'Enter your email' : 'Email'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {view !== 'reset' && (
            <div className="auth-input-group">
              <input
                type="password"
                className="auth-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-button">
            {view === 'login' ? 'Login' : view === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </button>
        </form>

        {view !== 'reset' && (
          <>
            <div className="auth-divider">or</div>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setError('');
                  try {
                    const res = await fetch(getApiUrl('/auth/google'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token: credentialResponse.credential }),
                    });
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.detail || 'Google Auth failed');
                    }
                    const data = await res.json();
                    onAuth(data);
                  } catch (err) {
                    setError(err.message);
                  }
                }}
                onError={() => {
                  setError('Google Login Failed');
                }}
                useOneTap
                theme="filled_black"
                shape="rectangular"
                text="continue_with"
                width="100%"
              />
            </div>
          </>
        )}

        <div className="auth-switch-text">
          {view === 'login' ? (
            <>
              Don't have an account?{' '}
              <button type="button" className="auth-switch-link" onClick={() => { setView('signup'); setError(''); setSuccess(''); }}>Sign up</button>
              <div style={{ marginTop: '12px' }}>
                <button type="button" className="auth-switch-link" onClick={() => { setView('reset'); setError(''); setSuccess(''); }}>Forgot Password?</button>
              </div>
            </>
          ) : view === 'signup' ? (
            <>
              Already have an account?{' '}
              <button type="button" className="auth-switch-link" onClick={() => { setView('login'); setError(''); setSuccess(''); }}>Login</button>
            </>
          ) : (
            <>
              Back to{' '}
              <button type="button" className="auth-switch-link" onClick={() => { setView('login'); setError(''); setSuccess(''); }}>Login</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthForm;
