/**
 * routes/users.js — Quản lý Người dùng (Dành cho Admin)
 */

const router = require('express').Router();
const { getPool, sql } = require('../config/db');

// Middleware kiểm tra quyền Admin
function requireAdmin(req, res, next) {
    const role = req.headers['x-user-role'];
    if (role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Require Admin role.' });
    }
    next();
}

// ── GET /api/users ────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const result = await getPool().request()
            .query('SELECT UserID, Username, FullName, Email, Role, Status FROM Users ORDER BY UserID DESC');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/users/:id/role ───────────────────────────────────────────────
router.put('/users/:id/role', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;

        if (!['Admin', 'Editor', 'User'].includes(role)) {
            return res.status(400).json({ error: 'Role không hợp lệ' });
        }

        const pool = getPool();

        // Ngăn chặn thay đổi quyền của Quản trị viên mặc định (admin)
        const targetUser = await pool.request()
            .input('UserID', sql.Int, userId)
            .query("SELECT Username FROM Users WHERE UserID = @UserID");

        if (targetUser.recordset.length > 0 && targetUser.recordset[0].Username === 'admin') {
            return res.status(403).json({ error: 'Không thể thay đổi quyền của Quản trị viên Hệ thống mặc định.' });
        }

        await pool.request()
            .input('Role', sql.NVarChar(20), role)
            .input('UserID', sql.Int, userId)
            .query('UPDATE Users SET Role = @Role WHERE UserID = @UserID');

        res.json({ message: 'Cập nhật quyền thành công' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/users/:id ─────────────────────────────────────────────────
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const pool = getPool();

        // Ngăn chặn vô hiệu hóa Quản trị viên mặc định (admin)
        const targetUser = await pool.request()
            .input('UserID', sql.Int, userId)
            .query("SELECT Username FROM Users WHERE UserID = @UserID");

        if (targetUser.recordset.length > 0 && targetUser.recordset[0].Username === 'admin') {
            return res.status(403).json({ error: 'Không thể vô hiệu hóa Quản trị viên Hệ thống mặc định.' });
        }

        // Trigger trg_SoftDeleteUser sẽ chuyển Status thành 'Inactive'
        await pool.request()
            .input('UserID', sql.Int, userId)
            .query('DELETE FROM Users WHERE UserID = @UserID');

        res.json({ message: 'Đã vô hiệu hóa tài khoản (Soft Delete)' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
