import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)' }}>
      <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-lg)' }}>Profile</h2>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 600 }}>
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{user?.username || 'User'}</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{user?.email || ''}</p>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn btn-danger" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}
