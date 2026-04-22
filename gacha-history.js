// ดึงไลบรารีที่คุณใช้อยู่แล้วในโปรเจกต์
const express = require('express');
const mysql = require('mysql2/promise'); 
const app = express();

// ... โค้ดตั้งค่า Database ของ TiDB ของคุณที่มีอยู่แล้ว ...
const dbConfig = {
  host: process.env.TIDB_HOST,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  port: 4000, // พอร์ตปกติของ TiDB
};

// สร้าง Endpoint ใหม่สำหรับ Gacha History
app.get('/api/gacha-history', async (req, res) => {
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

// ... โค้ดอื่นๆ ของคุณ ...