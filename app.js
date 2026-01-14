const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

// Halaman utama
app.get('/', (req, res) => {
  db.query(`
    SELECT p.id, p.nama_produk, s.jumlah 
    FROM produk p 
    JOIN stok s ON p.id = s.produk_id
  `, (err, produk) => {
    res.render('index', { produk });
  });
});

// Proses pembelian
app.post('/beli', (req, res) => {
  const { produk_id, qty } = req.body;

  db.query(
    `SELECT harga FROM produk WHERE id=?`, 
    [produk_id], 
    (err, result) => {
      const total = result[0].harga * qty;

      db.query(
        `INSERT INTO pembelian (produk_id, qty, total) VALUES (?,?,?)`,
        [produk_id, qty, total]
      );

      db.query(
        `UPDATE stok SET jumlah = jumlah - ? WHERE produk_id = ?`,
        [qty, produk_id]
      );

      res.redirect('/pembelian');
    }
  );
});

// List pembelian
app.get('/pembelian', (req, res) => {
  db.query(`
    SELECT pb.id, p.nama_produk, pb.qty, pb.total, pb.status
    FROM pembelian pb
    JOIN produk p ON pb.produk_id = p.id
  `, (err, data) => {
    res.render('pembelian', { data });
  });
});

// Cancel pembelian
app.post('/cancel/:id', (req, res) => {
  const id = req.params.id;

  db.query(
    `SELECT produk_id, qty FROM pembelian WHERE id=?`,
    [id],
    (err, data) => {
      db.query(
        `UPDATE pembelian SET status='CANCEL' WHERE id=?`,
        [id]
      );

      db.query(
        `UPDATE stok SET jumlah = jumlah + ? WHERE produk_id=?`,
        [data[0].qty, data[0].produk_id]
      );

      res.redirect('/pembelian');
    }
  );
});

app.listen(3000, () => {
  console.log('Server running di http://localhost:3000');
});
