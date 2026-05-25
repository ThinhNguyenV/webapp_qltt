/**
 * routes/auth.js — Đăng nhập & Đăng ký
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');

const SALT_ROUNDS = 10;

// ── POST /api/login ────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ error: 'Thiếu username hoặc password' });

        const result = await getPool().request()
            .input('Username', sql.NVarChar(50), username)
            .query("SELECT UserID, FullName, Username, Role, PasswordHash FROM Users WHERE Username = @Username AND Status = 'Active'");

        if (result.recordset.length === 0)
            return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });

        const user = result.recordset[0];

        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch)
            return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });

        // Loại bỏ hash trước khi trả về client
        const { PasswordHash, ...safeUser } = user;
        res.json({ user: safeUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/register ────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullName, email } = req.body;
        if (!username || !password || !fullName || !email)
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });

        if (password.length < 6)
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });

        const pool = getPool();

        const existing = await pool.request()
            .input('Username', sql.NVarChar(50),  username)
            .input('Email',    sql.NVarChar(100), email)
            .query('SELECT UserID FROM Users WHERE Username = @Username OR Email = @Email');

        if (existing.recordset.length > 0)
            return res.status(409).json({ error: 'Tên đăng nhập hoặc Email đã tồn tại' });

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        await pool.request()
            .input('Username',     sql.NVarChar(50),  username)
            .input('PasswordHash', sql.NVarChar(255), passwordHash)
            .input('FullName',     sql.NVarChar(100), fullName)
            .input('Email',        sql.NVarChar(100), email)
            .input('Role',         sql.NVarChar(20),  'User')
            .query(`INSERT INTO Users (Username, PasswordHash, FullName, Email, Role)
                    VALUES (@Username, @PasswordHash, @FullName, @Email, @Role)`);

        const newUser = await pool.request()
            .input('Username', sql.NVarChar(50), username)
            .query('SELECT UserID, FullName, Username, Role FROM Users WHERE Username = @Username');

        // Phát sự kiện qua socket.io
        if (req.app.get('io')) {
            req.app.get('io').emit('data_updated', { source: 'users', type: 'insert' });
        }

        res.status(201).json({ user: newUser.recordset[0], message: 'Đăng ký thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
