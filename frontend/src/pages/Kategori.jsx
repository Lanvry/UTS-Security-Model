import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Kategori() {
  const [kategori, setKategori] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [serverIdentity, setServerIdentity] = useState('Memuat data...');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [noticeMsg, setNoticeMsg] = useState(null);

  // Form State untuk Tambah / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = mode tambah, object = mode edit
  const [inputNama, setInputNama] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serverAUrl = 'http://localhost:4000/api/kategori/';
  const serverBUrl = 'http://ubuntu.leopard-gila.ts.net:3002/api/kategori/';

  const fetchKategori = useCallback(() => {
    setIsLoading(true);
    setErrorMsg(null);

    // Percobaan 1: Server Utama (Laptop)
    axios.get(serverAUrl, { timeout: 2000 })
      .then(res => {
        if (res.data.status) {
          setKategori(res.data.data);
          setActiveServer('A');
          setServerIdentity('Server Utama (Server A - Port 4000)');
          setIsLoading(false);
        }
      })
      .catch(errA => {
        console.warn('Server Utama (A) gagal, beralih ke Server B...', errA.message);
        
        // Percobaan 2: Fallback ke Server B (Ubuntu)
        axios.get(serverBUrl, { timeout: 4000 })
          .then(res => {
            if (res.data.status) {
              setKategori(res.data.data);
              setActiveServer('B');
              setServerIdentity('Server Cadangan / Fallback (Server B Ubuntu - Port 3002)');
              setIsLoading(false);
            }
          })
          .catch(errB => {
            console.error('Kedua server gagal:', errB.message);
            setActiveServer('DOWN');
            setErrorMsg('Kedua server tidak dapat diakses.');
            setIsLoading(false);
          });
      });
  }, []);

  useEffect(() => {
    fetchKategori();
  }, [fetchKategori]);

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setEditingItem(null);
    setInputNama('');
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setInputNama(item.nama_kategori);
    setIsModalOpen(true);
  };

  // Tutup Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setInputNama('');
  };

  // Submit Form (Tambah / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputNama.trim()) return;

    setIsSubmitting(true);
    setNoticeMsg(null);
    setErrorMsg(null);

    try {
      if (editingItem) {
        // Mode Edit: PUT ke Server A
        await axios.put(`http://localhost:4000/api/kategori/${editingItem.id}`, {
          nama_kategori: inputNama.trim()
        });
        setNoticeMsg('Kategori berhasil diperbarui & otomatis tersinkron ke Server B.');
      } else {
        // Mode Tambah: POST ke Server A
        await axios.post('http://localhost:4000/api/kategori', {
          nama_kategori: inputNama.trim()
        });
        setNoticeMsg('Kategori baru berhasil ditambahkan & otomatis tersinkron ke Server B.');
      }
      handleCloseModal();
      fetchKategori();
    } catch (err) {
      setErrorMsg('Operasi gagal: ' + (err.response?.data?.message || err.message + ' (Pastikan Server A menyala untuk operasi tambah/edit)'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hapus Kategori
  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus kategori "${nama}"?`)) return;

    try {
      await axios.delete(`http://localhost:4000/api/kategori/${id}`);
      setNoticeMsg(`Kategori "${nama}" berhasil dihapus.`);
      fetchKategori();
    } catch (err) {
      setErrorMsg('Gagal menghapus: ' + (err.response?.data?.message || err.message + ' (Pastikan Server A menyala untuk operasi hapus)'));
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
            Data kategori
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
            Manajemen data kategori dengan failover dan auto-sync multi-server.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchKategori}
            className="btn btn-secondary btn-sm"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary btn-sm"
          >
            + Tambah Kategori
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

      {/* Tabel Kategori */}
      <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
        <table className="clean-table" style={{ border: 'none' }}>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>#</th>
              <th>Nama Kategori</th>
              <th style={{ width: '180px' }}>Sumber Server</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  Memuat data kategori...
                </td>
              </tr>
            ) : kategori.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  Belum ada data kategori.
                </td>
              </tr>
            ) : (
              kategori.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: '#4b5563' }}>{item.id}</td>
                  <td style={{ fontWeight: 500 }}>{item.nama_kategori}</td>
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
                        onClick={() => handleDelete(item.id, item.nama_kategori)}
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

      {/* Modal Form Add / Edit */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>
              {editingItem ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={inputNama}
                  onChange={(e) => setInputNama(e.target.value)}
                  placeholder="Contoh: Perabotan Kantor"
                  className="form-input"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
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
                  {isSubmitting ? 'Menyimpan...' : (editingItem ? 'Simpan Perubahan' : 'Tambah Kategori')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Kategori;
