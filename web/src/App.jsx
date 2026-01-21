import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TxForm from './pages/TransactionForm.jsx';
import Pending from './pages/Pending.jsx';
import History from './pages/History.jsx';
import Wallet from './pages/Wallet.jsx';
import Rules from './pages/Rules.jsx';
import Notifications from './components/Notifications.jsx';

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('jwt')); 
  const login = (t) => { localStorage.setItem('jwt', t); setToken(t); };
  const logout = () => { localStorage.removeItem('jwt'); setToken(null); };
  return { token, login, logout };
}

export default function App() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!auth.token && location.pathname !== '/login') {
      navigate('/login');
    }
    // Close mobile drawer on route change
    setSidebarOpen(false);
  }, [auth.token, location.pathname]);

  const navItems = [
    { to: '/', icon: '📊', label: 'Dashboard' },
    { to: '/tx/new', icon: '➕', label: 'New Transaction' },
    { to: '/tx/pending', icon: '⏳', label: 'Pending' },
    { to: '/history', icon: '📜', label: 'History' },
    { to: '/wallet', icon: '👛', label: 'Wallet' },
    { to: '/rules', icon: '⚙️', label: 'Rules' }
  ];

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <Notifications />
      
      {auth.token && (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <img src="/logo.png" alt="Thresho Logo" className="app-logo" />
              <div>
                <div className="sidebar-title">Threshold</div>
                <div className="sidebar-subtitle">Wallet</div>
              </div>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            {navItems.map(item => (
              <Link 
                key={item.to} 
                to={item.to} 
                className={`sidebar-link ${location.pathname === item.to ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button onClick={auth.logout} className="sidebar-logout">
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}
      {auth.token && sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      
      <main style={{ flex: 1, padding: 32, maxWidth: '100%', overflow: 'auto' }}>
        {auth.token && (
          <button className="mobile-menu" onClick={() => setSidebarOpen(s => !s)}>
            ☰ Menu
          </button>
        )}
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Routes>
            <Route path="/login" element={<Login onLogin={auth.login} />} />
            <Route index element={<Dashboard />} />
            <Route path="/tx/new" element={<TxForm />} />
            <Route path="/tx/pending" element={<Pending />} />
            <Route path="/history" element={<History />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
