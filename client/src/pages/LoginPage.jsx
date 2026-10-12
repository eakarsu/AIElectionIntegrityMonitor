import React, { useEffect, useRef, useState } from 'react';
import { auth } from '../services/api';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pending = useRef(null);
  const demoEmail = String(import.meta.env.VITE_DEMO_EMAIL || '').trim();
  const demoPassword = String(import.meta.env.VITE_DEMO_PASSWORD || '');
  const demoEnabled = import.meta.env.DEV === true && import.meta.env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true' && Boolean(demoEmail && demoPassword);
  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, []);
  const handleAutoFill = () => {
    if (!demoEnabled) { setError('Demo credentials are unavailable. Sign in with your existing account.'); return; }
    setEmail(demoEmail); setPassword(demoPassword); setError('');
  };
  const signIn = async (loginEmail, loginPassword) => {
    if (pending.current) return;
    if (!loginEmail.trim() || !loginPassword) { setError('Enter both email and password.'); return; }
    const controller = new AbortController(); pending.current = controller;
    setLoading(true); setError('');
    try {
      const data = await auth.login(loginEmail.trim(), loginPassword, { signal: controller.signal });
      if (pending.current !== controller || controller.signal.aborted) return;
      if (!data?.token || !data.user?.id) throw new Error('The server did not return a valid signed-in identity.');
      onLogin(data);
    } catch (err) {
      if (pending.current === controller && !controller.signal.aborted) setError(err.message || 'Login failed');
    } finally {
      if (pending.current === controller) { pending.current = null; setLoading(false); }
    }
  };
  const handleDemoLogin = () => {
    if (!demoEnabled) { setError('Demo credentials are unavailable. Sign in with your existing account.'); return; }
    handleAutoFill();
    // Submit the configured pair directly. React state and unrelated document
    // forms do not participate in this explicit native authentication action.
    return signIn(demoEmail, demoPassword);
  };

  const handleSubmit = async (e) => { e.preventDefault(); await signIn(email, password); };

  return (
    <div className="login-container">
      <div className="login-card animate-in">
        <div className="login-header">
          <div className="login-logo">🛡️</div>
          <h1>Election Integrity Monitor</h1>
          <p>AI-Powered Election Oversight Platform</p>
        </div>

        {error && <div className="login-error" role="alert">{error}</div>}

        <button type="button" className="btn btn-auto-fill btn-full" disabled={loading || !demoEnabled} onClick={handleDemoLogin}>
          Log In as Demo
        </button>

        <button type="button" className="btn btn-secondary btn-full" disabled={loading || !demoEnabled} onClick={handleAutoFill}>Fill credentials</button>
        {!demoEnabled && <p role="status">Demo credentials are unavailable in this launch. Use your existing account, or enable configured local demo access before starting.</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
