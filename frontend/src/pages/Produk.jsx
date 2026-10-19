import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Produk() {
  const [produk, setProduk] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [serverIdentity, setServerIdentity] = useState('Memuat data...');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchProduk = useCallback(() => {
    setIsLoading(true);
    setErrorMsg(null);

    const serverA = 'http://localhost:4000/api/produk/';
    const serverB = 'http://ubuntu.leopard-gila.ts.net:3002/api/produk/';

    axios.get(serverA, { timeout: 2000 })
      .then(res => {
        if (res.data.status) {
          setProduk(res.data.data);
          setActiveServer('A');
          setServerIdentity('Server Utama (Server A - Port 4000)');
          setLastChecked(new Date().toLocaleTimeString('id-ID'));
          setIsLoading(false);
        }
      })
      .catch(errA => {
        console.warn('Server Utama (A) gagal memuat produk, beralih ke Server B...', errA.message);
        
        axios.get(serverB, { timeout: 4000 })
          .then(res => {
            if (res.data.status) {
              setProduk(res.data.data);
              setActiveServer('B');
              setServerIdentity('Server Cadangan / Fallback (Server B Ubuntu - Port 3002)');
              setLastChecked(new Date().toLocaleTimeString('id-ID'));
              setIsLoading(false);
            }
          })
          .catch(errB => {
            console.error('Kedua server gagal memuat produk:', errB.message);
            setActiveServer('DOWN');
            setErrorMsg('Server Utama (Port 4000) dan Server Cadangan (Port 3002) gagal merespons.');
            setIsLoading(false);
          });
      });
  }, []);

  useEffect(() => {
    fetchProduk();
  }, [fetchProduk]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Halaman */}
      <div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: '0 0 6px 0'
        }}>
          Daftar Produk
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Katalog data produk tersinkronisasi antar server secara terenkripsi (GZIP + AES-256).
        </p>
      </div>

      {/* Panel Status Koneksi & Aksi Uji */}
      <div className="card-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Status Koneksi:
          </span>
          <div className={`status-pill ${activeServer === 'A' ? 'server-a' : activeServer === 'B' ? 'server-b' : 'error'}`}>
            <span className={`status-dot ${activeServer === 'A' ? 'server-a' : activeServer === 'B' ? 'server-b' : 'error'}`}></span>
            <span>{isLoading ? 'Menghubungi server...' : serverIdentity}</span>
          </div>
          {lastChecked && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              (Pukul {lastChecked})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={fetchProduk}
          disabled={isLoading}
          className="btn-action"
        >
          {isLoading ? 'Memeriksa...' : 'Uji Ulang Koneksi'}
        </button>
      </div>

      {/* Tampilan Error */}
      {errorMsg && (
        <div style={{
          backgroundColor: 'var(--server-down-bg)',
          border: '1px solid var(--server-down-border)',
          color: 'var(--server-down-text)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={fetchProduk}
            className="btn-action"
            style={{ borderColor: 'var(--server-down-border)', color: 'var(--server-down-text)' }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Tabel Data Produk */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th style={{ width: '70px' }}>Foto</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th style={{ width: '160px' }}>Harga</th>
              <th style={{ width: '180px' }}>Sumber Server</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Memuat data produk dari server...
                </td>
              </tr>
            ) : produk.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Tidak ada data produk yang ditemukan.
                </td>
              </tr>
            ) : (
              produk.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {item.id}
                  </td>
                  <td>
                    <img
                      src={item.foto_produk}
                      alt={item.nama_produk}
                      style={{
                        width: '44px',
                        height: '44px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';
                      }}
                    />
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.nama_produk}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {item.nama_kategori}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    Rp {Number(item.harga_produk).toLocaleString('id-ID')}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: activeServer === 'A' ? '#ecfdf5' : '#fffbeb',
                      color: activeServer === 'A' ? '#065f46' : '#92400e',
                      border: activeServer === 'A' ? '1px solid #a7f3d0' : '1px solid #fde68a'
                    }}>
                      {activeServer === 'A' ? 'Server A (Laptop)' : 'Server B (Ubuntu)'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Produk;
