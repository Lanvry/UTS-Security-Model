import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: '0 0 6px 0' }}>
          Sistem Multi-Server & Fallback Mechanism
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: 1.6, maxWidth: '680px' }}>
          Aplikasi pengujian toleransi kesalahan (Fault Tolerance) dan sinkronisasi otomatis terenkripsi antar server Express.js dan React JS.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {/* Card Server A */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '18px',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>SERVER UTAMA</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
              Port 4000
            </span>
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0', color: '#111827' }}>
            Server A (Laptop Lokal)
          </h3>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            Pengelola data asli (*Plaintext*) pada basis data `db_a`. Melayani operasi CRUD dan sinkronisasi ke Server B.
          </p>
        </div>

        {/* Card Server B */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '18px',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>SERVER CADANGAN</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#fffbeb', color: '#9a3412', border: '1px solid #fed7aa', borderRadius: '4px' }}>
              Port 3002
            </span>
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0', color: '#111827' }}>
            Server B (Ubuntu Remote)
          </h3>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            Penerima data terenkripsi pada `db_b`. Menjadi server failover/cadangan saat Server A dimatikan atau tidak merespons.
          </p>
        </div>

        {/* Card Auto-Sync */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '18px',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>SINKRONISASI</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '4px' }}>
              Auto-Sync
            </span>
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0', color: '#111827' }}>
            Enkripsi AES-256 + GZIP
          </h3>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            Data dikompresi dan dienkripsi sebelum dikirim. Berjalan berkala setiap 30 detik serta instan saat data ditambahkan/diubah.
          </p>
        </div>
      </div>

      {/* Navigasi Cepat */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '18px 20px',
        backgroundColor: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#111827' }}>
            Buka Menu Pengujian
          </h4>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
            Kelola data dan periksa respon fallback saat salah satu server dimatikan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/kategori" className="btn btn-secondary btn-sm">
            Buka Kategori
          </Link>
          <Link to="/produk" className="btn btn-secondary btn-sm">
            Buka Produk
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
