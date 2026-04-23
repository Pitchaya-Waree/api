const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// สร้างการเชื่อมต่อฐานข้อมูลโดยใช้ DATABASE_URL จากไฟล์ .env [cite: 685, 725, 726]
const connection = mysql.createConnection(process.env.DATABASE_URL);

// หน้าแรก (Home) [cite: 727, 729]
app.get('/', (req, res) => {
    res.send('Gacha System API is running!');
});

// หน้าข้อมูล Games
app.get('/games', (req, res) => {
    try {
    // เชื่อมต่อฐานข้อมูล TiDB
    const connection = await mysql.createConnection(dbConfig);

    // คำสั่ง SQL ดึงข้อมูลจากตาราง games
    // อ้างอิงตาม ERD คือดึง game_id, gamename, gametype, gameavatar
    const sql = `
      SELECT 
        game_id, 
        gamename, 
        gametype, 
        gameavatar 
      FROM games
      ORDER BY game_id ASC;
    `;

    // สั่งรัน SQL
    const [rows] = await connection.execute(sql);
    
    // ส่งข้อมูลกลับไปให้ Flutter ในรูปแบบ JSON
    res.json(rows);

    // ปิดการเชื่อมต่อ
    await connection.end();

  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
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

// app.get('/items/:game_id', async (req, res) => {
//   try {
//     const connection = await mysql.createConnection(dbConfig);
//     const gameId = req.params.game_id;
    
//     const sql = `SELECT * FROM items WHERE game_id = ?`;
//     const [rows] = await connection.execute(sql, [gameId]);
    
//     res.json(rows);
//     await connection.end();
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch items' });
//   }
// });

// app.post('/api/gacha', async (req, res) => {
//   try {
//     const connection = await mysql.createConnection(dbConfig);
//     // รับค่า item_id และ amount จาก Flutter
//     const { item_id, amount } = req.body; 
    
//     // บันทึกข้อมูล โดยใช้ NOW() สำหรับเวลาปัจจุบัน
//     const sql = `INSERT INTO gacha (item_id, amount, gacha_date) VALUES (?, ?, NOW())`;
//     const [result] = await connection.execute(sql, [item_id, amount]);
    
//     res.json({ success: true, message: 'บันทึกสำเร็จ', insertId: result.insertId });
//     await connection.end();
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to save gacha history' });
//   }
// });


// export the app for vercel serverless functions [cite: 785]
module.exports = app;