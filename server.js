console.log("=============================================");
console.log("KELOMPOK: 4");
console.log("ANGGOTA:");
console.log("1. MOH AKBAR NUSANTARA        || F5512520037");
console.log("2. HUMAIRA ISLAMI RISYA ADAM  || F5512510006");
console.log("3. BAGUS ALDY PUTRA           || F5512510009");
console.log("4. ANDHIN ANGGRAINI BANTULU   || F5512510010");
console.log("5. CUT SAFIRA                 || F5512510022");
console.log("=============================================");

const http = require('http');
const https = require('https');
const fs = require('fs/promises');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'books.json');

// ---------- HELPER DATA & RESPONS ----------
async function bacaData() {
  try {
    const isi = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(isi);
  } catch (err) {
    return [];
  }
}

async function simpanData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function kirimJSON(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function kirimSukses(res, statusCode, data, message = null) {
  const payload = { status: 'success' };
  if (message) payload.message = message;
  if (data !== undefined) payload.data = data;
  kirimJSON(res, statusCode, payload);
}

function kirimGagal(res, statusCode, message) {
  const statusText = statusCode >= 500 ? 'error' : 'fail';
  kirimJSON(res, statusCode, { status: statusText, message });
}

// ---------- HELPER REQUEST ----------
function buatError(statusCode, pesan) {
  const err = new Error(pesan);
  err.statusCode = statusCode;
  return err;
}

function bacaBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      if (body.trim() === '') return resolve(null);
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(buatError(400, 'Format JSON body tidak valid'));
      }
    });
    req.on('error', reject);
  });
}

// Helper External API (Open Library)
function ambilDataOpenLibrary(isbn) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    https.get(apiUrl, (apiRes) => {
      let apiData = '';
      apiRes.on('data', (chunk) => { apiData += chunk; });
      apiRes.on('end', () => {
        try {
          const parsedApi = JSON.parse(apiData);
          const bookKey = `ISBN:${isbn}`;
          if (!parsedApi[bookKey]) {
            return reject(buatError(404, 'Data ISBN tidak ditemukan di Open Library API'));
          }
          resolve(parsedApi[bookKey]);
        } catch (e) {
          reject(buatError(500, 'Gagal memproses data dari Open Library API'));
        }
      });
    }).on('error', () => {
      reject(buatError(500, 'Gagal menghubungi Open Library API'));
    });
  });
}

// ---------- HANDLER ----------
// GET /books & GET /books?id={id}
async function handlerGetBooks(req, res, url) {
  const books = await bacaData();
  const id = url.searchParams.get('id');

  if (id) {
    const book = books.find((b) => b.id.toString() === id.toString());
    if (!book) {
      return kirimGagal(res, 404, 'Buku tidak ditemukan');
    }
    return kirimSukses(res, 200, book);
  }

  return kirimSukses(res, 200, books);
}

// POST /books
async function handlerPostBooks(req, res) {
  const input = await bacaBody(req);
  if (!input) {
    return kirimGagal(res, 400, 'Format JSON body tidak valid');
  }

  const { isbn, stok, kategori } = input;
  if (!isbn || stok === undefined || !kategori) {
    return kirimGagal(res, 400, 'Field isbn, stok, dan kategori wajib diisi!');
  }

  // Integrasi Open Library API
  const externalData = await ambilDataOpenLibrary(isbn);

  const books = await bacaData();
  const newId = (books.length + 1).toString();

  const newBook = {
    id: newId,
    isbn: isbn.toString(),
    title: externalData.title || 'Tanpa Judul',
    authors: externalData.authors ? externalData.authors.map((a) => a.name).join(', ') : 'Tidak Diketahui',
    publish_date: externalData.publish_date || 'Tidak Diketahui',
    stok: Number(stok),
    kategori: kategori.toString()
  };

  books.push(newBook);
  await simpanData(books);

  return kirimSukses(res, 201, newBook, 'Buku berhasil ditambahkan dan diperkaya dari Open Library API');
}

// PUT /books?id={id}
async function handlerPutBooks(req, res, url) {
  const id = url.searchParams.get('id');
  if (!id) {
    return kirimGagal(res, 400, 'Query parameter id wajib disertakan!');
  }

  const input = await bacaBody(req);
  if (!input) {
    return kirimGagal(res, 400, 'Format JSON body tidak valid');
  }

  const books = await bacaData();
  const bookIndex = books.findIndex((b) => b.id.toString() === id.toString());

  if (bookIndex === -1) {
    return kirimGagal(res, 404, 'Buku dengan ID tersebut tidak ditemukan');
  }

  if (input.stok !== undefined) books[bookIndex].stok = Number(input.stok);
  if (input.kategori !== undefined) books[bookIndex].kategori = input.kategori.toString();

  await simpanData(books);
  return kirimSukses(res, 200, books[bookIndex], 'Data buku berhasil diperbarui');
}

// DELETE /books?id={id}
async function handlerDeleteBooks(req, res, url) {
  const id = url.searchParams.get('id');
  if (!id) {
    return kirimGagal(res, 400, 'Query parameter id wajib disertakan!');
  }

  const books = await bacaData();
  const bookIndex = books.findIndex((b) => b.id.toString() === id.toString());

  if (bookIndex === -1) {
    return kirimGagal(res, 404, 'Buku dengan ID tersebut tidak ditemukan');
  }

  const [deletedBook] = books.splice(bookIndex, 1);
  await simpanData(books);

  return kirimSukses(res, 200, deletedBook, 'Buku berhasil dihapus dari sistem');
}

// ---------- ROUTER ----------
async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/books') {
    if (req.method === 'GET') return await handlerGetBooks(req, res, url);
    if (req.method === 'POST') return await handlerPostBooks(req, res);
    if (req.method === 'PUT') return await handlerPutBooks(req, res, url);
    if (req.method === 'DELETE') return await handlerDeleteBooks(req, res, url);

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return kirimGagal(res, 405, `Method ${req.method} tidak didukung pada endpoint ini`);
  }

  return kirimGagal(res, 404, 'Endpoint tidak ditemukan');
}

// ---------- SERVER ----------
const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  try {
    await router(req, res);
  } catch (err) {
    if (err.statusCode) {
      return kirimGagal(res, err.statusCode, err.message);
    }
    console.error(err);
    kirimGagal(res, 500, 'Terjadi kesalahan pada server');
  }
});

server.listen(PORT, () => {
  console.log(`Server API berjalan di http://localhost:${PORT}`);
});