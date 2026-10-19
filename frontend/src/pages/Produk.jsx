import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Produk() {
  const [produk, setProduk] = useState([]);
  const [activeSource, setActiveSource] = useState('Memuat data produk...');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Server Utama: Server A di Laptop Lokal
    const serverA = 'http://localhost:4000/api/produk/';
    // Server Cadangan (Fallback): Server B di Ubuntu Remote (Tailscale)
    const serverB = 'http://ubuntu.leopard-gila.ts.net:3002/api/produk/';

    axios.get(serverA)
      .then(res => {
        if (res.data.status) {
          setProduk(res.data.data);
          setActiveSource('Server Utama (Server A - Port 4000)');
          console.log('Data produk berhasil dimuat dari Server Utama (A)');
        }
      })
      .catch(errA => {
        console.warn('Server Utama (A) gagal merespons produk, beralih ke Server B...', errA.message);
        axios.get(serverB)
          .then(res => {
            if (res.data.status) {
              setProduk(res.data.data);
              setActiveSource('Server Cadangan / Fallback (Server B Ubuntu - Port 3002)');
              console.log('Data produk berhasil dimuat dari Server Cadangan (B)');
            }
          })
          .catch(errB => {
            console.error('Kedua server gagal memuat produk:', errB);
            setErrorMsg('Kedua server gagal merespons permintaan produk.');
            setActiveSource('Gagal terhubung ke semua server');
          });
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>Daftar Produk</h2>

      {/* Info Status Koneksi Fallback */}
      <div style={{
        marginBottom: '15px',
        padding: '8px 12px',
        borderRadius: '4px',
        backgroundColor: activeSource.includes('Server Utama') ? '#e8f5e9' : activeSource.includes('Server Cadangan') ? '#fff3e0' : '#ffebee',
        color: activeSource.includes('Server Utama') ? '#1b5e20' : activeSource.includes('Server Cadangan') ? '#b74b00' : '#b71c1c',
        display: 'inline-block',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        Status Koneksi: {activeSource}
      </div>

      {errorMsg ? (
        <p style={{ color: 'red' }}>{errorMsg}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>#</th>
              <th style={{ padding: '8px 12px' }}>Foto</th>
              <th style={{ padding: '8px 12px' }}>Nama Produk</th>
              <th style={{ padding: '8px 12px' }}>Kategori</th>
              <th style={{ padding: '8px 12px' }}>Harga</th>
            </tr>
          </thead>
          <tbody>
            {produk.map((item, index) => (
              <tr key={item.id || index} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>{item.id}</td>
                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                  <img
                    src={item.foto_produk}
                    alt={item.nama_produk}
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'; }}
                  />
                </td>
                <td style={{ padding: '8px 12px', verticalAlign: 'middle', fontWeight: '500' }}>{item.nama_produk}</td>
                <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>{item.nama_kategori}</td>
                <td style={{ padding: '8px 12px', verticalAlign: 'middle', fontWeight: 'bold' }}>
                  Rp {Number(item.harga_produk).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
            {produk.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                  Tidak ada data produk
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Produk;
