import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Produk() {
  const [produk, setProduk] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [serverIdentity, setServerIdentity] = useState('Memuat data...');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [noticeMsg, setNoticeMsg] = useState(null);

  // Form State untuk Tambah / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nama_produk: '',
    harga_produk: '',
    foto_produk: '',
    id_kategori: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serverAUrl = 'http://localhost:4000/api/produk/';
  const serverBUrl = 'http://ubuntu.leopard-gila.ts.net:3002/api/produk/';

  // Ambil Data Produk
  const fetchProduk = useCallback(() => {
    setIsLoading(true);
    setErrorMsg(null);

    axios.get(serverAUrl, { timeout: 2000 })
      .then(res => {
        if (res.data.status) {
          setProduk(res.data.data);
          setActiveServer('A');
          setServerIdentity('Server Utama (Server A - Port 4000)');
          setIsLoading(false);
        }
      })
      .catch(errA => {
        console.warn('Server Utama (A) gagal memuat produk, beralih ke Server B...', errA.message);
        
        axios.get(serverBUrl, { timeout: 4000 })
          .then(res => {
            if (res.data.status) {
              setProduk(res.data.data);
              setActiveServer('B');
              setServerIdentity('Server Cadangan / Fallback (Server B Ubuntu - Port 3002)');
              setIsLoading(false);
            }
          })
          .catch(errB => {
            console.error('Kedua server gagal memuat produk:', errB.message);
            setActiveServer('DOWN');
            setErrorMsg('Kedua server tidak dapat diakses.');
            setIsLoading(false);
          });
      });
  }, []);

  // Ambil Kategori untuk Pilihan Dropdown Form
  const fetchKategoriOptions = useCallback(() => {
    axios.get('http://localhost:4000/api/kategori', { timeout: 2000 })
      .then(res => {
        if (res.data.status) setKategoriList(res.data.data);
      })
      .catch(() => {
        axios.get('http://ubuntu.leopard-gila.ts.net:3002/api/kategori', { timeout: 3000 })
          .then(res => {
            if (res.data.status) setKategoriList(res.data.data);
          })
          .catch(e => console.warn('Gagal memuat opsi kategori:', e.message));
      });
  }, []);

  useEffect(() => {
    fetchProduk();
    fetchKategoriOptions();
  }, [fetchProduk, fetchKategoriOptions]);

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      nama_produk: '',
      harga_produk: '',
      foto_produk: '',
      id_kategori: kategoriList.length > 0 ? String(kategoriList[0].id) : ''
    });
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      nama_produk: item.nama_produk,
      harga_produk: String(item.harga_produk),
      foto_produk: item.foto_produk || '',
      id_kategori: String(item.id_kategori)
    });
    setIsModalOpen(true);
  };

  // Tutup Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Handle Input Form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Form (Tambah / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_produk.trim() || !formData.harga_produk || !formData.id_kategori) return;

    setIsSubmitting(true);
    setNoticeMsg(null);
    setErrorMsg(null);

    const payload = {
      nama_produk: formData.nama_produk.trim(),
      harga_produk: Number(formData.harga_produk),
      foto_produk: formData.foto_produk.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
      id_kategori: Number(formData.id_kategori)
    };

    try {
      if (editingItem) {
        await axios.put(`http://localhost:4000/api/produk/${editingItem.id}`, payload);
        setNoticeMsg('Produk berhasil diperbarui & otomatis tersinkron ke Server B.');
      } else {
        await axios.post('http://localhost:4000/api/produk', payload);
        setNoticeMsg('Produk baru berhasil ditambahkan & otomatis tersinkron ke Server B.');
      }
      handleCloseModal();
      fetchProduk();
    } catch (err) {
      setErrorMsg('Operasi gagal: ' + (err.response?.data?.message || err.message + ' (Pastikan Server A aktif untuk operasi tambah/edit)'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hapus Produk
  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus produk "${nama}"?`)) return;

    try {
      await axios.delete(`http://localhost:4000/api/produk/${id}`);
      setNoticeMsg(`Produk "${nama}" berhasil dihapus.`);
      fetchProduk();
    } catch (err) {
      setErrorMsg('Gagal menghapus: ' + (err.response?.data?.message || err.message + ' (Pastikan Server A aktif untuk operasi hapus)'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Aksi Tambah */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>
            Daftar Produk
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
            Katalog data produk tersinkronisasi antar server dengan enkripsi AES-256.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchProduk}
            className="btn btn-secondary btn-sm"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary btn-sm"
          >
            + Tambah Produk
          </button>
        </div>
      </div>

      {/* Info Status Koneksi */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        backgroundColor: '#f9fafb',
        fontSize: '13px'
      }}>
        <span style={{ fontWeight: 600, color: '#4b5563' }}>Status Koneksi:</span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 500,
          color: activeServer === 'A' ? '#059669' : activeServer === 'B' ? '#d97706' : '#dc2626'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: activeServer === 'A' ? '#059669' : activeServer === 'B' ? '#d97706' : '#dc2626'
          }}></span>
          {isLoading ? 'Menghubungi server...' : serverIdentity}
        </span>
      </div>

      {/* Notifikasi Sukses */}
      {noticeMsg && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          {noticeMsg}
        </div>
      )}

      {/* Notifikasi Error */}
      {errorMsg && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Tabel Produk */}
      <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
        <table className="clean-table" style={{ border: 'none' }}>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th style={{ width: '64px' }}>Foto</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th style={{ width: '150px' }}>Harga</th>
              <th style={{ width: '130px' }}>Sumber</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  Memuat data produk...
                </td>
              </tr>
            ) : produk.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  Belum ada data produk.
                </td>
              </tr>
            ) : (
              produk.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: '#4b5563' }}>{item.id}</td>
                  <td>
                    <img
                      src={item.foto_produk}
                      alt={item.nama_produk}
                      style={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';
                      }}
                    />
                  </td>
                  <td style={{ fontWeight: 500, color: '#111827' }}>
                    {item.nama_produk}
                  </td>
                  <td style={{ color: '#4b5563', fontSize: '13px' }}>
                    {item.nama_kategori}
                  </td>
                  <td style={{ fontWeight: 600, color: '#111827' }}>
                    Rp {Number(item.harga_produk).toLocaleString('id-ID')}
                  </td>
                  <td>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: activeServer === 'A' ? '#f0fdf4' : '#fffbeb',
                      color: activeServer === 'A' ? '#166534' : '#9a3412',
                      border: activeServer === 'A' ? '1px solid #bbf7d0' : '1px solid #fed7aa'
                    }}>
                      {activeServer === 'A' ? 'Server A' : 'Server B'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.nama_produk)}
                        className="btn btn-danger btn-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form Add / Edit Produk */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>
              {editingItem ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                  Nama Produk
                </label>
                <input
                  type="text"
                  name="nama_produk"
                  required
                  value={formData.nama_produk}
                  onChange={handleInputChange}
                  placeholder="Contoh: Mouse Wireless M330"
                  className="form-input"
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                  Kategori
                </label>
                <select
                  name="id_kategori"
                  required
                  value={formData.id_kategori}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Pilih Kategori</option>
                  {kategoriList.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kategori}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                  Harga Produk (Rp)
                </label>
                <input
                  type="number"
                  name="harga_produk"
                  required
                  min="0"
                  value={formData.harga_produk}
                  onChange={handleInputChange}
                  placeholder="Contoh: 250000"
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                  URL Foto Produk (Opsional)
                </label>
                <input
                  type="url"
                  name="foto_produk"
                  value={formData.foto_produk}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : (editingItem ? 'Simpan Perubahan' : 'Tambah Produk')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Produk;
