-- ========================================================
-- SKRIP BASIS DATA SISTEM ENKRIPSI MULTI-SERVER (UTS WORKSHOP)
-- DB A (Data Asli / Plaintext) & DB B (Data Terenkripsi / Ciphertext)
-- ========================================================

-- --------------------------------------------------------
-- 1. SETUP DATABASE A (Sumber Data pada Server A)
-- --------------------------------------------------------
CREATE DATABASE IF NOT EXISTS db_a;
USE db_a;

-- Drop table jika sudah ada (agar bersih)
DROP TABLE IF EXISTS produk;
DROP TABLE IF EXISTS kategori;

-- Tabel Kategori di DB A
CREATE TABLE kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Produk di DB A (Relasi One-to-Many ke Kategori)
CREATE TABLE produk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_produk VARCHAR(150) NOT NULL,
    harga_produk DECIMAL(12, 2) NOT NULL,
    foto_produk VARCHAR(255) NOT NULL,
    id_kategori INT NOT NULL,
    FOREIGN KEY (id_kategori) REFERENCES kategori(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seeder Data Awal untuk DB A
INSERT INTO kategori (id, nama_kategori) VALUES
(1, 'Elektronik'),
(2, 'Fashion & Pakaian'),
(3, 'Makanan & Minuman');

INSERT INTO produk (nama_produk, harga_produk, foto_produk, id_kategori) VALUES
('Laptop Asus ROG Strix', 21500000.00, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300', 1),
('Mouse Wireless Logitech', 350000.00, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300', 1),
('Jaket Hoodie Canvas Hitam', 285000.00, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300', 2),
('Kopi Robusta Lampung 250gr', 65000.00, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300', 3);


-- --------------------------------------------------------
-- 2. SETUP DATABASE B (Penyimpanan Terenkripsi pada Server B)
-- --------------------------------------------------------
CREATE DATABASE IF NOT EXISTS db_b;
USE db_b;

-- Drop table jika sudah ada
DROP TABLE IF EXISTS produk;
DROP TABLE IF EXISTS kategori;

-- Tabel Kategori di DB B
-- Kolom nama_kategori bertipe TEXT untuk menampung ciphertext hasil enkripsi
CREATE TABLE kategori (
    id INT PRIMARY KEY,
    nama_kategori TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Produk di DB B
-- Kolom nama_produk, harga_produk, foto_produk bertipe TEXT untuk menampung ciphertext
CREATE TABLE produk (
    id INT PRIMARY KEY,
    nama_produk TEXT NOT NULL,
    harga_produk TEXT NOT NULL,
    foto_produk TEXT NOT NULL,
    id_kategori INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
