// Baris paling atas mencetak identitas kelompok
console.log("==========================================");
console.log("KELOMPOK: [Nomor Kelompok]");
console.log("ANGGOTA:");
console.log("1. Moh Akbar Nusantara (F5512520037)");
console.log("2. [Nama Anggota 2] ([NIM])");
console.log("3. [Nama Anggota 3] ([NIM])");
console.log("4. [Nama Anggota 4] ([NIM])");
console.log("==========================================");

const http = require('http');
const fs = require('fs');
const https = require('https');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'books.json');

// Helper function untuk membaca data file JSON
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Helper function untuk menulis data ke file JSON
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Server HTTP Utama
const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = reqUrl.pathname;
    const method = req.method;

    // Set header agar respons selalu berformat JSON
    res.setHeader('Content-Type', 'application/json');

    // 1. ROUTER: GET /books & GET /books?id={id}
    if (pathname === '/books' && method === 'GET') {
        const books = readData();
        const id = reqUrl.searchParams.get('id');

        // GET /books?id={id} -> Cari detail 1 buku
        if (id) {
            const book = books.find(b => b.id === id);
            if (book) {
                res.writeHead(200);
                return res.end(JSON.stringify({ status: 'success', data: book }));
            } else {
                res.writeHead(404);
                return res.end(JSON.stringify({ status: 'fail', message: 'Buku tidak ditemukan' }));
            }
        }

        // GET /books -> Tampilkan semua data buku
        res.writeHead(200);
        return res.end(JSON.stringify({ status: 'success', data: books }));
    }

    // 2. ROUTER: POST /books (Tambah buku baru + Integrasi Public API)
    if (pathname === '/books' && method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { isbn, stok, kategori } = JSON.parse(body);

                // Validasi Input (400 Bad Request)
                if (!isbn || stok === undefined || !kategori) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ 
                        status: 'fail', 
                        message: 'Field isbn, stok, dan kategori wajib diisi!' 
                    }));
                }

                // Panggil Public API Open Library dari Sisi Server
                const apiUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;

                https.get(apiUrl, (apiRes) => {
                    let apiData = '';

                    apiRes.on('data', chunk => { apiData += chunk; });

                    apiRes.on('end', () => {
                        const parsedApi = JSON.parse(apiData);
                        const bookKey = `ISBN:${isbn}`;

                        if (!parsedApi[bookKey]) {
                            res.writeHead(404);
                            return res.end(JSON.stringify({ 
                                status: 'fail', 
                                message: 'Data ISBN tidak ditemukan di Open Library API' 
                            }));
                        }

                        const externalData = parsedApi[bookKey];
                        const books = readData();

                        // Gabungkan Data Input Lokal + Data dari Public API
                        const newBook = {
                            id: (books.length + 1).toString(),
                            isbn: isbn,
                            title: externalData.title || 'Tanpa Judul',
                            authors: externalData.authors ? externalData.authors.map(a => a.name).join(', ') : 'Tidak Diketahui',
                            publish_date: externalData.publish_date || 'Tidak Diketahui',
                            stok: Number(stok),
                            kategori: kategori
                        };

                        books.push(newBook);
                        writeData(books);

                        // Respon Berhasil (201 Created)
                        res.writeHead(201);
                        res.end(JSON.stringify({
                            status: 'success',
                            message: 'Buku berhasil ditambahkan dan diperkaya dari Open Library API',
                            data: newBook
                        }));
                    });

                }).on('error', (err) => {
                    res.writeHead(500);
                    res.end(JSON.stringify({ status: 'error', message: 'Gagal menghubungi Open Library API' }));
                });

            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ status: 'fail', message: 'Format JSON body tidak valid' }));
            }
        });
        return;
    }

    // Endpoint yang tidak terdaftar (Default Fallback)
    res.writeHead(404);
    res.end(JSON.stringify({ status: 'fail', message: 'Endpoint tidak ditemukan' }));
});

server.listen(PORT, () => {
    console.log(`Server API berjalan di http://localhost:${PORT}`);
});