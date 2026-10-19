import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Intro Section */}
      <div>
        <h2 style={{
          fontSize: '26px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: '0 0 8px 0'
        }}>
          Sistem Multi-Server & Fallback Mechanism
        </h2>
        <p style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          maxWidth: '720px',
          margin: 0,
          lineHeight: 1.6
        }}>
          Implementasi arsitektur toleransi kesalahan (Fault Tolerance) pada sisi client React JS. Sistem memastikan layanan tetap dapat diakses oleh pengguna secara transparan meskipun server utama mengalami gangguan teknis.
        </p>
      </div>

      {/* Grid Arsitektur Server */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {/* Node Server A */}
        <div className="card-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Node Utama
            </span>
            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0'
            }}>
              Port 4000
            </span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Server A (Laptop Lokal)
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Bertindak sebagai server sumber primer (*Plaintext*). Menyimpan data kategori dan produk pada basis data lokal `db_a`.
          </p>
        </div>

        {/* Node Server B */}
        <div className="card-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Node Cadangan
            </span>
            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fde68a'
            }}>
              Port 3002
            </span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Server B (Ubuntu Server)
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Server cadangan remote via Tailscale VPN. Menyimpan data terenkripsi pada `db_b` (*Encryption at Rest*) dan melayani request saat Server A gagal.
          </p>
        </div>

        {/* Alur Auto-Sync */}
        <div className="card-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sinkronisasi
            </span>
            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe'
            }}>
              GZIP + AES-256
            </span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Auto-Sync Engine
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Sinkronisasi otomatis berjalan berkala (setiap 30 detik) dan otomatis terpicu secara instan saat data produk atau kategori baru ditambahkan.
          </p>
        </div>
      </div>

      {/* Navigasi Pengujian Cepat */}
      <div className="card-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        backgroundColor: '#f1f5f9'
      }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            Mulai Pengujian Fallback
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Pilih menu untuk melihat simulasi failover saat salah satu server dimatikan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/kategori" className="btn-action" style={{ textDecoration: 'none' }}>
            Lihat Kategori
          </Link>
          <Link to="/produk" className="btn-action" style={{ textDecoration: 'none' }}>
            Lihat Produk
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
