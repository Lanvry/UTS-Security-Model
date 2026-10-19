import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Produk from './pages/Produk';
import Kategori from './pages/Kategori';

function Navigation() {
  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
            margin: 0
          }}>
            Multi-Server Workshop
          </h1>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: '2px 0 0 0'
          }}>
            Fallback & Auto-Sync System
          </p>
        </div>

        <nav aria-label="Main Navigation">
          <ul style={{
            display: 'flex',
            listStyle: 'none',
            gap: '6px',
            margin: 0,
            padding: 0
          }}>
            {[
              { to: '/', label: 'Home' },
              { to: '/kategori', label: 'Kategori' },
              { to: '/produk', label: 'Produk' }
            ].map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: isActive ? '#111827' : '#6b7280',
                    backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                    border: isActive ? '1px solid #e5e7eb' : '1px solid transparent'
                  })}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
        <Navigation />

        <main style={{
          flex: 1,
          maxWidth: '960px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 20px'
        }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kategori" element={<Kategori />} />
            <Route path="/produk" element={<Produk />} />
          </Routes>
        </main>

        <footer style={{
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          Multi-Server Fallback Architecture (Server A Laptop:4000 & Server B Ubuntu:3002)
        </footer>
      </div>
    </Router>
  );
}

export default App;
