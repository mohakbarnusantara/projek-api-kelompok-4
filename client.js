const http = require('http');
const readline = require('readline');

const SERVER_HOST = 'localhost';
const SERVER_PORT = 3000;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper Function untuk Mengirim HTTP Request (Tanpa Menampilkan Stack Trace Saat Error)
function makeRequest(options, postData = null) {
    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: body });
                }
            });
        });

        // Penanganan error tanpa stack trace
        req.on('error', (err) => {
            resolve({ statusCode: 500, error: `Koneksi gagal: ${err.message}` });
        });

        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

// 1. Tampilkan Semua Buku (GET /books)
async function getAllBooks() {
    console.log("\n--- DAFTAR SELURUH BUKU ---");
    const res = await makeRequest({
        host: SERVER_HOST,
        port: SERVER_PORT,
        path: '/books',
        method: 'GET'
    });

    if (res.error) {
        console.log(`[ERROR] ${res.error}`);
    } else {
        console.log(`Status Code: ${res.statusCode}`);
        console.log("Respon Server:", JSON.stringify(res.data, null, 2));
    }
}

// 2. Cari Buku Berdasarkan ID (GET /books?id={id})
function getBookById() {
    rl.question("\nMasukkan ID Buku: ", async (id) => {
        const res = await makeRequest({
            host: SERVER_HOST,
            port: SERVER_PORT,
            path: `/books?id=${encodeURIComponent(id)}`,
            method: 'GET'
        });

        if (res.error) {
            console.log(`[ERROR] ${res.error}`);
        } else {
            console.log(`Status Code: ${res.statusCode}`);
            console.log("Respon Server:", JSON.stringify(res.data, null, 2));
        }
        showMenu();
    });
}

// 3. Tambah Buku Baru via ISBN (POST /books)
function addBook() {
    rl.question("\nMasukkan ISBN (contoh: 9780261102217): ", (isbn) => {
        rl.question("Masukkan Jumlah Stok: ", (stok) => {
            rl.question("Masukkan Kategori: ", async (kategori) => {
                const res = await makeRequest({
                    host: SERVER_HOST,
                    port: SERVER_PORT,
                    path: '/books',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }, { isbn: isbn.trim(), stok: Number(stok), kategori: kategori.trim() });

                if (res.error) {
                    console.log(`[ERROR] ${res.error}`);
                } else {
                    console.log(`Status Code: ${res.statusCode}`);
                    console.log("Respon Server:", JSON.stringify(res.data, null, 2));
                }
                showMenu();
            });
        });
    });
}

// 4. Update Stok/Kategori Buku (PUT /books?id={id})
function updateBook() {
    rl.question("\nMasukkan ID Buku yang ingin diubah: ", (id) => {
        rl.question("Stok Baru (Kosongkan jika tidak ingin diubah): ", (stok) => {
            rl.question("Kategori Baru (Kosongkan jika tidak ingin diubah): ", async (kategori) => {
                const payload = {};
                if (stok.trim() !== "") payload.stok = Number(stok);
                if (kategori.trim() !== "") payload.kategori = kategori.trim();

                const res = await makeRequest({
                    host: SERVER_HOST,
                    port: SERVER_PORT,
                    path: `/books?id=${encodeURIComponent(id.trim())}`,
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                }, payload);

                if (res.error) {
                    console.log(`[ERROR] ${res.error}`);
                } else {
                    console.log(`Status Code: ${res.statusCode}`);
                    console.log("Respon Server:", JSON.stringify(res.data, null, 2));
                }
                showMenu();
            });
        });
    });
}

// 5. Hapus Buku (DELETE /books?id={id})
function deleteBook() {
    rl.question("\nMasukkan ID Buku yang ingin dihapus: ", async (id) => {
        const res = await makeRequest({
            host: SERVER_HOST,
            port: SERVER_PORT,
            path: `/books?id=${encodeURIComponent(id.trim())}`,
            method: 'DELETE'
        });

        if (res.error) {
            console.log(`[ERROR] ${res.error}`);
        } else {
            console.log(`Status Code: ${res.statusCode}`);
            console.log("Respon Server:", JSON.stringify(res.data, null, 2));
        }
        showMenu();
    });
}

// Menu Utama Client Console CLI
function showMenu() {
    console.log("\n==================================");
    console.log("   CLIENT CONSOLE KATALOG BUKU    ");
    console.log("==================================");
    console.log("1. Lihat Semua Buku (GET /books)");
    console.log("2. Cari Buku Berdasarkan ID (GET /books?id=x)");
    console.log("3. Tambah Buku Baru via ISBN (POST /books)");
    console.log("4. Update Stok / Kategori (PUT /books?id=x)");
    console.log("5. Hapus Buku (DELETE /books?id=x)");
    console.log("0. Keluar");
    console.log("==================================");
    
    rl.question("Pilih menu (0-5): ", async (choice) => {
        switch (choice.trim()) {
            case '1':
                await getAllBooks();
                showMenu();
                break;
            case '2':
                getBookById();
                break;
            case '3':
                addBook();
                break;
            case '4':
                updateBook();
                break;
            case '5':
                deleteBook();
                break;
            case '0':
                console.log("Keluar dari Client Console.");
                rl.close();
                break;
            default:
                console.log("Pilihan menu tidak valid!");
                showMenu();
                break;
        }
    });
}

showMenu();