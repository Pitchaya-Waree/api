const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// สร้างการเชื่อมต่อฐานข้อมูลโดยใช้ DATABASE_URL จากไฟล์ .env [cite: 685, 725, 726]
const connection = mysql.createConnection(process.env.DATABASE_URL);

// หน้าแรก (Home) [cite: 727, 729]
app.get('/', (req, res) => {
    res.send('Gacha System API is running!');
});

// หน้าข้อมูล Users [cite: 730]
app.get('/users', (req, res) => {
    connection.query(
        'SELECT user_id, username, avatar FROM users',
        function (err, results, fields) {
            if (err) return res.status(500).send(err);
            res.send(results);
        }
    );
});

// หน้าข้อมูล Games
app.get('/games', (req, res) => {
    connection.query(
        'SELECT * FROM games',
        function (err, results, fields) {
            if (err) return res.status(500).send(err);
            res.send(results);
        }
    );
});

// หน้าข้อมูล Items
app.get('/items', (req, res) => {
    connection.query(
        'SELECT * FROM items',
        function (err, results, fields) {
            if (err) return res.status(500).send(err);
            res.send(results);
        }
    );
});

// หน้าข้อมูลประวัติการสุ่ม Gacha (Join ตารางเพื่อแสดงชื่อ)
app.get('/gacha', (req, res) => {
    const query = `
        SELECT 
            g.gacha_id, g.amount, g.gacha_date, 
            u.username, i.itemname, i.itemrarity
        FROM gacha g
        LEFT JOIN users u ON g.user_id = u.user_id
        LEFT JOIN items i ON g.item_id = i.item_id
        ORDER BY g.gacha_date DESC
    `;
    connection.query(
        query,
        function (err, results, fields) {
            if (err) return res.status(500).send(err);
            res.send(results);
        }
    );
});

// export the app for vercel serverless functions [cite: 785]
module.exports = app;