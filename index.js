const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// สร้าง Connection Pool สำหรับ Vercel Serverless
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/', (req, res) => {
  res.send('Welcome to Gacha API!');
});

//GAMES - จัดการข้อมูลเกม
// ดึงข้อมูลเกมทั้งหมด (game_id, gamename, gametype, gameavatar)
app.get('/games', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM games');
    res.json(results);
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ITEMS - จัดการข้อมูลไอเท็ม
// ดึงไอเท็มทั้งหมดที่มีในระบบ
app.get('/items', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM items');
    res.json(results);
  } catch (err) {
    console.error('Error fetching all items:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ดึงไอเท็มโดยฟิลเตอร์ตาม game_id ที่เลือก
app.get('/games/:game_id/items', async (req, res) => {
  try {
    const gameId = req.params.game_id;
    const [results] = await pool.query('SELECT * FROM items WHERE game_id = ?', [gameId]);
    res.json(results);
  } catch (err) {
    console.error('Error fetching items for game:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GACHA - จัดการประวัติการสุ่ม
// บันทึกผลการสุ่มกาชา (เพิ่มข้อมูลลงตาราง gacha)
app.post('/gacha', async (req, res) => {
  try {
    // รับค่า amount และ item_id ที่สุ่มได้จากแอป Flutter
    const { amount, item_id } = req.body;
    
    // สร้าง timestamp สำหรับ gacha_date ในฝั่ง Server
    const gacha_date = new Date();

    const [result] = await pool.query(
      'INSERT INTO gacha (amount, gacha_date, item_id) VALUES (?, ?, ?)',
      [amount, gacha_date, item_id]
    );
    
    res.status(201).json({ 
      message: 'Gacha recorded successfully!',
      gacha_id: result.insertId 
    });
  } catch (err) {
    console.error('Error recording gacha:', err);
    res.status(500).json({ error: 'Failed to record gacha result' });
  }
});

// ดึงประวัติการสุ่มทั้งหมด (JOIN ตารางเพื่อให้ได้ชื่อไอเท็มและชื่อเกมไปแสดงผล)
app.get('/gacha', async (req, res) => {
  try {
    const query = `
      SELECT 
        g.gacha_id, 
        g.amount, 
        g.gacha_date, 
        i.itemname, 
        i.itemrarity, 
        gm.gamename 
      FROM gacha g
      JOIN items i ON g.item_id = i.item_id
      JOIN games gm ON i.game_id = gm.game_id
      ORDER BY g.gacha_date DESC
    `;
    const [results] = await pool.query(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching gacha history:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// เริ่มการทำงานของ Server
app.listen(process.env.PORT || 3000, () => {
  console.log('Gacha API server listening on port 3000');
});

app.post('/games', async (req, res) => {
    try {
        const { gamename, gametype, gameavatar } = req.body;

        // เพิ่มคำสั่ง INSERT จริงๆ ลงไปตรงนี้
        const [result] = await pool.query(
            'INSERT INTO games (gamename, gametype, gameavatar) VALUES (?, ?, ?)',
            [gamename, gametype, gameavatar]
        );

        res.status(201).json({ 
            message: "Success", 
            id: result.insertId 
        });
    } catch (err) {
        console.error('Error inserting game:', err);
        res.status(500).send(err.message);
    }
});

// เริ่มการทำงานของ Server (เฉพาะ Local)
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}

// --- เพิ่มประตูสำหรับบันทึก Item ใหม่ ---
app.post('/items', async (req, res) => {
    try {
        // รับค่าจาก Flutter (itemname, itemtype, itemrarity, game_id)
        const { itemname, itemtype, itemrarity, game_id } = req.body;

        // ตรวจสอบว่าส่งค่ามาครบไหม (ป้องกัน Error)
        if (!itemname || !game_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // คำสั่ง SQL สำหรับ INSERT ลงตาราง items
        const [result] = await pool.query(
            'INSERT INTO items (itemname, itemtype, itemrarity, game_id) VALUES (?, ?, ?, ?)',
            [itemname, itemtype, itemrarity, game_id]
        );

        res.status(201).json({ 
            message: "Item added successfully!", 
            item_id: result.insertId 
        });
    } catch (err) {
        console.error('Error inserting item:', err);
        res.status(500).send("Server Error: " + err.message);
    }
});

// Export app สำหรับ Vercel Serverless Functions
module.exports = app;