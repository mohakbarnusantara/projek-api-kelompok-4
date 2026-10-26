# Proyek API Katalog Buku (Project Based 1)

Aplikasi pengelolaan katalog buku berbasis RESTful API menggunakan core module Node.js (`http`, `fs`, `https`) tanpa framework. Aplikasi ini mengintegrasikan data lokal dengan Public API dari Open Library untuk pengayaan metadata buku secara otomatis.

---

## Kelompok 4

| No | Nama Anggota | NIM |
|---|---|---|
| 1 | MOH AKBAR NUSANTARA | F5512520037 |
| 2 | HUMAIRA ISLAMI RISYA ADAM | F5512510006 |
| 3 | BAGUS ALDY PUTRA | F5512510009 |
| 4 | ANDHIN ANGGRAINI BANTULU | F5512510010 |
| 5 | CUT SAFIRA | F5512510022 |

---

## Deskripsi Sistem & Arsitektur

Sistem ini terdiri dari dua aplikasi terpisah:
1. **API Server (`server.js`)**: Server HTTP murni menggunakan module `http`. Server bertindak sebagai **API Provider** (melayani request client) sekaligus **API Consumer** (mengambil metadata buku dari Open Library API).
2. **Client Console (`client.js`)**: Aplikasi CLI berbasis terminal yang berinteraksi langsung dengan API Server melalui protokol HTTP.

---

## Endpoint API

| Method | Endpoint | Deskripsi | Status Code |
|---|---|---|---|
| `GET` | `/books` | Menampilkan seluruh daftar buku | `200 OK` |
| `GET` | `/books?id={id}` | Menampilkan detail 1 buku berdasarkan ID | `200 OK`, `404 Not Found` |
| `POST` | `/books` | Menambah buku baru via ISBN & mengambil metadata dari Open Library API | `201 Created`, `400 Bad Request`, `404 Not Found` |
| `PUT` | `/books?id={id}` | Mengubah stok atau kategori buku | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/books?id={id}` | Menghapus buku dari sistem simpanan | `200 OK`, `400 Bad Request`, `404 Not Found` |

---

## Cara Menjalankan Aplikasi

### 1. Jalankan API Server
Buka terminal pertama dan jalankan:
```bash
node server.js
```
*Identitas kelompok akan otomatis dicetak pada baris paling atas terminal.*

### 2. Jalankan Client Console
Buka terminal kedua (terpisah) dan jalankan:
```bash
node client.js
```
Pilih opsi menu 0-5 untuk menjalankan operasi CRUD secara interaktif.

---

## Struktur File
```text
katalog-buku-api/
├── server.js         # RESTful API Server
├── client.js         # Client CLI Console
├── data/
│   └── books.json    # Media penyimpanan JSON
├── README.md         # Dokumentasi proyek
```