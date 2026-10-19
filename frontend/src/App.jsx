import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Produk from './pages/Produk';
import Kategori from './pages/Kategori';

function Navigation() {
  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Identity */}
        <div>
          <h1 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Multi-Server Architecture
          </h1>
          <p style={{
            fontSize: '12px',
            color: '#64748b',
            margin: '2px 0 0 0'
          }}>
            High Availability Client-Side Fallback System
          </p>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main Navigation">
          <ul style={{
            display: 'flex',
            listStyle: 'none',
            gap: '8px',
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
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    color: isActive ? '#0f172a' : '#475569',
                    backgroundColor: isActive ? '#f1f5f9' : 'transparent',
                    border: isActive ? '1px solid #cbd5e1' : '1px solid transparent'
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navigation />

        <main style={{
          flex: 1,
          maxWidth: '1000px',
          width: '100%',
          margin: '0 auto',
          padding: '28px 24px'
        }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kategori" element={<Kategori />} />
            <Route path="/produk" element={<Produk />} />
          </Routes>
        </main>

        <footer style={{
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#64748b'
        }}>
          Implementasi Fallback Mechanism: Server A (Laptop:4000) dan Server B (Ubuntu:3002)
        </footer>
      </div>
    </Router>
  );
}

export default App;
