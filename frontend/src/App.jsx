import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Produk from './pages/Produk';
import Kategori from './pages/Kategori';

function App() {
  return (
    <Router>
      <div style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px', fontFamily: 'Arial, sans-serif' }}>
        {/* Menu Navigasi Sesuai Format Modul Workshop */}
        <nav style={{ marginBottom: '20px' }}>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0, fontSize: '18px', lineHeight: '1.8' }}>
            <li>
              <Link to="/" style={{ color: '#0056b3', textDecoration: 'underline' }}>Home</Link>
            </li>
            <li>
              <Link to="/produk" style={{ color: '#0056b3', textDecoration: 'underline' }}>Produk</Link>
            </li>
            <li>
              <Link to="/kategori" style={{ color: '#0056b3', textDecoration: 'underline' }}>Kategori</Link>
            </li>
          </ul>
        </nav>

        <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '20px 0' }} />

        {/* Area Halaman */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/produk" element={<Produk />} />
            <Route path="/kategori" element={<Kategori />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
