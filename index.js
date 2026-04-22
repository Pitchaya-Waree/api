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

// หน้าข้อมูลประวัติการสุ่ม Gacha (Join ตารางเพื่อแสดงชื่อ)
app.get('/gacha', async (req, res) => {
    try {
    // 1. เชื่อมต่อฐานข้อมูล TiDB
    const connection = await mysql.createConnection(dbConfig);

    // 2. เอาคำสั่ง SQL มาใส่ตรงนี้!
    const sql = `
      SELECT 
          ga.gacha_id, 
          ga.gacha_date, 
          gm.gamename, 
          i.itemname, 
          i.itemrarity
      FROM gacha ga
      JOIN items i ON ga.item_id = i.item_id
      JOIN games gm ON i.game_id = gm.game_id
      ORDER BY ga.gacha_date DESC;
    `;

    // 3. สั่งรัน SQL
    const [rows] = await connection.execute(sql);
    
    // 4. ส่งข้อมูลกลับไปให้ Flutter ในรูปแบบ JSON
    res.json(rows);

    // ปิดการเชื่อมต่อ
    await connection.end();

  } catch (error) {
    console.error('Error fetching gacha history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// export the app for vercel serverless functions [cite: 785]
module.exports = app;