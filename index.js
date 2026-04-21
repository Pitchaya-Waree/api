const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();

// ==========================================
// 1. ตั้งค่า Middleware (เพิ่มประสิทธิภาพการรับส่งข้อมูล)
// ==========================================
app.use(cors()); // อนุญาตให้ Flutter เข้าถึง API ได้จากทุกที่
app.use(express.json()); // แปลงข้อมูลที่ส่งมาให้อยู่ในรูปแบบ JSON อัตโนมัติ

// ==========================================
// 2. ตั้งค่าฐานข้อมูล (Database Connection)
// ==========================================
// ใช้ createPool แทน createConnection เพื่อจัดการการเชื่อมต่อหลายๆ เส้นพร้อมกัน 
// ป้องกันปัญหา "Can't add new command when connection is in closed state"
const pool = mysql.createPool(process.env.DATABASE_URL);

// ==========================================
// 3. ระบบผู้ใช้งาน (Authentication)
// ==========================================

// [POST] สมัครสมาชิก
app.post('/register', (req, res) => {
    const { username, userpassword, avatar } = req.body;
    const sql = "INSERT INTO users (username, userpassword, avatar) VALUES (?, ?, ?)";
    
    pool.query(sql, [username, userpassword, avatar], (err, result) => {
        if (err) {
            console.error("Register Error:", err);
            return res.status(500).json({ status: "error", message: "ดึงข้อมูลไม่สำเร็จ หรือ ข้อมูลซ้ำ" });
        }
        res.status(201).json({ status: "ok", message: "สมัครสมาชิกสำเร็จ", id: result.insertId });
    });
});

// [POST] เข้าสู่ระบบ
app.post('/login', (req, res) => {
    const { username, userpassword } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND userpassword = ?";
    
    pool.query(sql, [username, userpassword], (err, results) => {
        if (err) {
            console.error("Login Error:", err);
            return res.status(500).json({ status: "error", message: "เซิร์ฟเวอร์ขัดข้อง" });
        }
        if (results.length > 0) {
            res.json({ status: "ok", message: "เข้าสู่ระบบสำเร็จ", user: results[0] });
        } else {
            res.status(401).json({ status: "error", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
        }
    });
});

// ==========================================
// 4. ระบบดึงข้อมูล (Games & Items)
// ==========================================

// [GET] ดึงข้อมูลเกมทั้งหมดไปแสดงที่หน้า Home
app.get('/games', (req, res) => {
    // ORDER BY เพื่อให้เกมเรียงตามตัวอักษร ลดภาระการคำนวณของ Flutter
    const sql = "SELECT * FROM games ORDER BY game_name ASC";
    
    pool.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลเกมได้" });
        res.json(results);
    });
});

// [GET] ดึงข้อมูลไอเท็มทั้งหมด (สามารถกรองตามเกมได้ เช่น /items?game_id=1)
app.get('/items', (req, res) => {
    const gameId = req.query.game_id;
    let sql = "SELECT * FROM items";
    let params = [];

    // ถ้ามีการส่ง game_id มา ให้ดึงเฉพาะไอเท็มของเกมนั้น
    if (gameId) {
        sql += " WHERE game_id = ?";
        params.push(gameId);
    }

    pool.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลไอเท็มได้" });
        res.json(results);
    });
});

// ==========================================
// 5. ระบบประวัติการสุ่ม (Gacha History)
// ==========================================

// [GET] ดึงข้อมูลประวัติการสุ่ม (JOIN ตารางให้แล้ว เพื่อให้แอปนำไปโชว์ได้เลย)
app.get('/gacha', (req, res) => {
    const userId = req.query.user_id; // ดึงเฉพาะประวัติของคนที่ Login (เช่น /gacha?user_id=5)
    
    // ใช้ SQL JOIN ดึงชื่อเกม และชื่อไอเท็ม มาประกอบร่างกันจากฐานข้อมูลเลย
    let sql = `
        SELECT 
            h.id AS history_id,
            h.created_at,
            u.username,
            g.game_name,
            i.item_name,
            i.rarity,
            i.item_image
        FROM gacha_history h
        JOIN users u ON h.user_id = u.id
        JOIN items i ON h.item_id = i.id
        JOIN games g ON i.game_id = g.id
    `;
    let params = [];

    // กรองเฉพาะ User คนนั้นๆ
    if (userId) {
        sql += " WHERE h.user_id = ?";
        params.push(userId);
    }

    // เรียงจากประวัติล่าสุด (DESC) ไปหาเก่าสุด
    sql += " ORDER BY h.created_at DESC";

    pool.query(sql, params, (err, results) => {
        if (err) {
            console.error("Gacha History Error:", err);
            return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลประวัติได้" });
        }
        res.json(results);
    });
});

// ==========================================
// 6. การส่งออกและเริ่มทำงาน (Export & Listen)
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running smoothly on port ${PORT}`);
});

// จำเป็นมากสำหรับ Vercel Serverless Function
module.exports = app;