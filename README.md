# Proyek API Katalog Buku (Project Based 1)

Aplikasi pengelolaan katalog buku berbasis RESTful API menggunakan Node.js core module (`http`, `fs`, `https`) tanpa framework. Terintegrasi dengan Public API Open Library.

## Fitur & Endpoint
- `GET /books` : Menampilkan seluruh daftar buku
- `GET /books?id={id}` : Menampilkan detail buku berdasarkan ID
- `POST /books` : Menambah buku baru & mengambil metadata otomatis via ISBN dari Open Library API
- `PUT /books?id={id}` : Mengubah stok atau kategori buku
- `DELETE /books?id={id}` : Menghapus buku dari sistem

## Cara Menjalankan
1. Dapatkan file server: `node server.js`
2. Jalankan client console di terminal terpisah: `node client.js`