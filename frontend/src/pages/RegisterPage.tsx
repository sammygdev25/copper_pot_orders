import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { detail?: string; username?: string[]; email?: string[]; password?: string[] } } })?.response?.data;
      const msg = data?.detail || data?.username?.[0] || data?.email?.[0] || data?.password?.[0] || 'Registration failed';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>Create Account</h2>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-md)', padding: 'var(--space-sm)', background: '#fef2f2', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>Username</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required autoFocus />
          </div>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>Confirm Password</label>
            <input type="password" value={form.password2} onChange={e => setForm({...form, password2: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 'var(--space-lg)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
