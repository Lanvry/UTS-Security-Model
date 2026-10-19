import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Kategori() {
  const [kategori, setKategori] = useState([]);
  const [activeServer, setActiveServer] = useState(null); // 'A', 'B', or null
  const [serverIdentity, setServerIdentity] = useState('Memuat data...');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchKategori = useCallback(() => {
    setIsLoading(true);
    setErrorMsg(null);

    const serverA = 'http://localhost:4000/api/kategori/';
    const serverB = 'http://ubuntu.leopard-gila.ts.net:3002/api/kategori/';

    // Percobaan 1: Request ke Server Utama (Laptop)
    axios.get(serverA, { timeout: 2000 })
      .then(res => {
        if (res.data.status) {
          setKategori(res.data.data);
          setActiveServer('A');
          setServerIdentity('Server Utama (Server A - Port 4000)');
          setLastChecked(new Date().toLocaleTimeString('id-ID'));
          setIsLoading(false);
        }
      })
      .catch(errA => {
        console.warn('Server Utama (A) tidak merespons, beralih ke Server B...', errA.message);
        
        // Percobaan 2: Fallback otomatis ke Server B (Ubuntu Remote)
        axios.get(serverB, { timeout: 4000 })
          .then(res => {
            if (res.data.status) {
              setKategori(res.data.data);
              setActiveServer('B');
              setServerIdentity('Server Cadangan / Fallback (Server B Ubuntu - Port 3002)');
              setLastChecked(new Date().toLocaleTimeString('id-ID'));
              setIsLoading(false);
            }
          })
          .catch(errB => {
            console.error('Kedua server gagal merespons:', errB.message);
            setActiveServer('DOWN');
            setErrorMsg('Server Utama (Port 4000) dan Server Cadangan (Port 3002) gagal merespons.');
            setIsLoading(false);
          });
      });
  }, []);

  useEffect(() => {
    fetchKategori();
  }, [fetchKategori]);

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
          Data kategori
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Sistem otomatis memprioritaskan Server Utama di laptop. Jika terjadi kegagalan jaringan atau server mati, request dialihkan ke Server Cadangan di Ubuntu.
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
          onClick={fetchKategori}
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
            onClick={fetchKategori}
            className="btn-action"
            style={{ borderColor: 'var(--server-down-border)', color: 'var(--server-down-text)' }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Tabel Data Kategori */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>#</th>
              <th>Nama Kategori</th>
              <th style={{ width: '220px' }}>Sumber Server</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Memuat data kategori dari server...
                </td>
              </tr>
            ) : kategori.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Tidak ada data kategori yang ditemukan.
                </td>
              </tr>
            ) : (
              kategori.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {item.id}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {item.nama_kategori}
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

export default Kategori;
