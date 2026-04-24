import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const doLogin = async () => {
    try {
      setError('');
      const user = await login(username, password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/faculty/dashboard');
      }
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div id="screen-login">
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-mark">IU</div>
          <div className="login-logo-text">
            <div className="ln">Iqra University</div>
            <div className="ls">AASAS — Attendance & Sentiment System</div>
          </div>
        </div>
        <div className="login-title">Welcome back</div>
        <div className="login-sub">Sign in to the AASAS portal to continue.</div>
        
        <div className="form-group">
          <label className="form-label">Username</label>
          <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        
        {error && <div style={{ color: 'var(--color-gold)', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
        

        
        <button className="login-btn" onClick={doLogin}>Sign In →</button>
        <div className="login-hint">Iqra University — Confidential Internal System v4.0</div>
      </div>
    </div>
  );
}
