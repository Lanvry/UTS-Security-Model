import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Kategori() {
  const [kategori, setKategori] = useState([]);
  const [activeSource, setActiveSource] = useState('Memuat data...');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Server Utama: Server A di Laptop Lokal
    const serverA = 'http://localhost:4000/api/kategori/';
    // Server Cadangan (Fallback): Server B di Ubuntu Remote (Tailscale)
    const serverB = 'http://ubuntu.leopard-gila.ts.net:3002/api/kategori/';

    axios.get(serverA)
      .then(res => {
        if (res.data.status) {
          setKategori(res.data.data);
          setActiveSource('Server Utama (Server A - Port 4000)');
          console.log('Data berhasil dimuat dari Server Utama (A)');
        }
      })
      .catch(errA => {
        console.warn('Server Utama (A) gagal merespons, beralih ke Server Cadangan (B)...', errA.message);
        axios.get(serverB)
          .then(res => {
            if (res.data.status) {
              setKategori(res.data.data);
              setActiveSource('Server Cadangan / Fallback (Server B Ubuntu - Port 3002)');
              console.log('Data berhasil dimuat dari Server Cadangan (B)');
            }
          })
          .catch(errB => {
            console.error('Kedua server gagal:', errB);
            setErrorMsg('Kedua server gagal merespons permintaan.');
            setActiveSource('Gagal terhubung ke semua server');
          });
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>Data kategori</h2>

      {/* Info Sumber Server untuk Mempermudah Analisa Laporan */}
      <div style={{
        marginBottom: '15px',
        padding: '8px 12px',
        borderRadius: '4px',
        backgroundColor: activeSource.includes('Server Utama') ? '#e8f5e9' : activeSource.includes('Server Cadangan') ? '#fff3e0' : '#ffebee',
        color: activeSource.includes('Server Utama') ? '#2e7d32' : activeSource.includes('Server Cadangan') ? '#e65100' : '#c62828',
        display: 'inline-block',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        Status Koneksi: {activeSource}
      </div>

      {errorMsg ? (
        <p style={{ color: 'red' }}>{errorMsg}</p>
      ) : (
        <table style={{ width: '100%', maxWidth: '400px', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>#</th>
              <th style={{ padding: '8px 12px' }}>Nama</th>
            </tr>
          </thead>
          <tbody>
            {kategori.map((item, index) => (
              <tr key={item.id || index} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px 12px', verticalAlign: 'top' }}>{item.id}</td>
                <td style={{ padding: '8px 12px', verticalAlign: 'top' }}>{item.nama_kategori}</td>
              </tr>
            ))}
            {kategori.length === 0 && (
              <tr>
                <td colSpan="2" style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                  Tidak ada data kategori
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Kategori;
