import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

interface LoginErrorResponse {
  response?: {
    data?: {
      detail?: string;
      non_field_errors?: string[];
    };
  };
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      const error = err as LoginErrorResponse;
      setError(error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>Sign In</h2>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-md)', padding: 'var(--space-sm)', background: '#fef2f2', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>Username</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required autoFocus />
          </div>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 'var(--space-lg)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
