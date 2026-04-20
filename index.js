const express = require('express')
const cors = require('cors')
const mysql = require('mysql2')
require('dotenv').config()
const app = express()

app.use(cors())
app.use(express.json())

const pool = mysql.createPool(process.env.DATABASE_URL)

app.get('/', (req, res) => {
    res.send('Hello world!!')
})

app.get('/users', (req, res) => {
    pool.query(
        'SELECT * FROM users',
        function (err, results, fields) {
            res.send(results)
        }
    )
})

app.get('/users/:id', (req, res) => {
    const id = req.params.id;
    pool.query(
        'SELECT * FROM users WHERE id = ?', [id],
        function (err, results, fields) {
            res.send(results)
        }
    )
})

app.post('/register', (req, res) => {
    const { username, userpassword, avatar } = req.body;
    pool.query(
        'INSERT INTO users (username, userpassword, avatar) VALUES (?, ?, ?)',
        [username, userpassword, avatar],
        function (err, results) {
            if (err) return res.status(500).send(err);
            res.status(200).send({ message: "สมัครสมาชิกสำเร็จ" });
        }
    );
});

app.post('/login', (req, res) => {
    const { username, userpassword } = req.body;
    pool.query(
        'SELECT * FROM users WHERE username = ? AND userpassword = ?',
        [username, userpassword],
        function (err, results) {
            if (err) return res.status(500).send(err);
            if (results.length > 0) {
                res.status(200).send({ status: "ok", user: results[0] });
            } else {
                res.status(401).send({ status: "error", message: "ชื่อผู้ใช้หรือรหัสผ่านผิด" });
            }
        }
    );
});

app.put('/users', (req, res) => {
    pool.query(
        'UPDATE `users` SET `username`=?, `userpassword`=?, `avatar`=? WHERE id =?',
        [req.body.username, req.body.userpassword, req.body.avatar, req.body.id],
         function (err, results, fields) {
            res.send(results)
        }
    )
})

app.delete('/users', (req, res) => {
    pool.query(
        'DELETE FROM `users` WHERE id =?',
        [req.body.id],
         function (err, results, fields) {
            res.send(results)
        }
    )
})

app.listen(process.env.PORT || 3000, () => {
    console.log('CORS-enabled web server listening on port 3000')
})

// export the app for vercel serverless functions
module.exports = app;
