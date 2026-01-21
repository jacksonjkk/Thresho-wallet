import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api.js';
import { notifications } from '@thresho/core';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [invite, setInvite] = useState('');
  const [loading, setLoading] = useState(false);

  async function createInvite() {
    try {
      const { data } = await API.post('/auth/create-invite');
      setInvite(data.code);
      notifications.success('Invite code generated!');
    } catch (e) {
      notifications.error(e.response?.data?.error || e.message);
    }
  }

  async function signup(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/signup', { username, password, inviteCode: invite });
      notifications.success('Account created! Please login.');
      setMode('login');
      setPassword('');
    } catch (e) {
      notifications.error(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { username, password });
      onLogin(data.token);
      notifications.success('Welcome back!');
      navigate('/');
    } catch (e) {
      notifications.error(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '10% auto', background: 'white', padding: 40, borderRadius: 8, boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 28 }}>
          <img src="/logo.png" alt="Thresho Logo" style={{ width: 200, height: 200, borderRadius: 8 }} />
          
        
        </h1>
        <p style={{ color: 'var(--secondary-text)', marginTop: 8 }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </p>
      </div>

      {mode === 'signup' && (
        <div style={{ marginBottom: 24, padding: 16, background: 'rgba(26, 115, 232, 0.05)', borderRadius: 8, borderLeft: '4px solid var(--primary-blue)' }}>
          <button onClick={createInvite} className="btn-secondary" style={{ marginBottom: 12, width: '100%' }}>
            Generate Invite Code
          </button>
          {invite && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--secondary-text)' }}>Your Invite Code:</label>
              <div style={{ padding: '12px 16px', background: 'white', borderRadius: 4, border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: 16, fontWeight: 600, color: 'var(--primary-blue)', marginTop: 4 }}>
                {invite}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={mode === 'login' ? login : signup} style={{ display: 'grid', gap: 20 }}>
        <div>
          <label>Username</label>
          <input 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Enter your username"
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Enter your password"
            required
          />
        </div>
        {mode === 'signup' && (
          <div>
            <label>Invite Code</label>
            <input 
              value={invite} 
              onChange={e => setInvite(e.target.value)} 
              placeholder="Paste your invite code"
              required
            />
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? '...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
        {mode === 'login' ? (
          <button onClick={() => setMode('signup')} className="btn-secondary" style={{ width: '100%' }}>
            Need an account? Sign Up
          </button>
        ) : (
          <button onClick={() => setMode('login')} className="btn-secondary" style={{ width: '100%' }}>
            Already have an account? Sign In
          </button>
        )}
      </div>
    </div>
  );
}
