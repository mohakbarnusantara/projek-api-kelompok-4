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

        res.writeHead(200);
        return res.end(JSON.stringify({ status: 'success', data: books }));
    }

    // 2. ROUTER: POST /books (Tambah buku baru + Integrasi Public API)
    else if (pathname === '/books' && method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { isbn, stok, kategori } = JSON.parse(body);

                if (!isbn || stok === undefined || !kategori) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ 
                        status: 'fail', 
                        message: 'Field isbn, stok, dan kategori wajib diisi!' 
                    }));
                }

                const apiUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;

                https.get(apiUrl, (apiRes) => {
                    let apiData = '';

                    apiRes.on('data', chunk => { apiData += chunk; });

                    apiRes.on('end', () => {
                        let parsedApi = {};
                        try { parsedApi = JSON.parse(apiData); } catch (e) {}
                        
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

                        res.writeHead(201);
                        return res.end(JSON.stringify({
                            status: 'success',
                            message: 'Buku berhasil ditambahkan dan diperkaya dari Open Library API',
                            data: newBook
                        }));
                    });

                }).on('error', (err) => {
                    res.writeHead(500);
                    return res.end(JSON.stringify({ status: 'error', message: 'Gagal menghubungi Open Library API' }));
                });

            } catch (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ status: 'fail', message: 'Format JSON body tidak valid' }));
            }
        });

        return;
    }

    // 3. ROUTER: PUT /books?id={id} (Update Stok atau Kategori Buku)
    else if (pathname === '/books' && method === 'PUT') {
        const id = reqUrl.searchParams.get('id');

        if (!id) {
            res.writeHead(400);
            return res.end(JSON.stringify({ status: 'fail', message: 'Query parameter id wajib disertakan!' }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });

        req.on('end', () => {
            try {
                const { stok, kategori } = JSON.parse(body);
                const books = readData();
                const bookIndex = books.findIndex(b => b.id === id);

                if (bookIndex === -1) {
                    res.writeHead(404);
                    return res.end(JSON.stringify({ status: 'fail', message: 'Buku dengan ID tersebut tidak ditemukan' }));
                }

                if (stok !== undefined) books[bookIndex].stok = Number(stok);
                if (kategori !== undefined) books[bookIndex].kategori = kategori;

                writeData(books);

                res.writeHead(200);
                return res.end(JSON.stringify({
                    status: 'success',
                    message: 'Data buku berhasil diperbarui',
                    data: books[bookIndex]
                }));
            } catch (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ status: 'fail', message: 'Format JSON body tidak valid' }));
            }
        });

        return;
    }

    // 4. ROUTER: DELETE /books?id={id} (Hapus Buku)
    else if (pathname === '/books' && method === 'DELETE') {
        const id = reqUrl.searchParams.get('id');

        if (!id) {
            res.writeHead(400);
            return res.end(JSON.stringify({ status: 'fail', message: 'Query parameter id wajib disertakan!' }));
        }

        const books = readData();
        const bookIndex = books.findIndex(b => b.id === id);

        if (bookIndex === -1) {
            res.writeHead(404);
            return res.end(JSON.stringify({ status: 'fail', message: 'Buku dengan ID tersebut tidak ditemukan' }));
        }

        const deletedBook = books.splice(bookIndex, 1)[0];
        writeData(books);

        res.writeHead(200);
        return res.end(JSON.stringify({
            status: 'success',
            message: 'Buku berhasil dihapus dari sistem',
            data: deletedBook
        }));
    }

    // 5. FALLBACK: Endpoint Tidak Ditemukan
    else {
        res.writeHead(404);
        return res.end(JSON.stringify({ status: 'fail', message: 'Endpoint tidak ditemukan' }));
    }
});

server.listen(PORT, () => {
    console.log(`Server API berjalan di http://localhost:${PORT}`);
});