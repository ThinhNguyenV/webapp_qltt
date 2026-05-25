/**
 * routes/interactions.js — Like & Comment
 */

const router = require('express').Router();
const { getPool, sql } = require('../config/db');

// ── POST /api/interactions ─────────────────────────────────────────────────
router.post('/interactions', async (req, res) => {
    try {
        const { userId, docId, type, commentText } = req.body;
        if (!userId || !docId || !type)
            return res.status(400).json({ error: 'Thiếu thông tin tương tác' });

        const pool = getPool();

        // Toggle Like
        if (type === 'Like') {
            const existing = await pool.request()
                .input('UserID', sql.Int, userId)
                .input('DocID', sql.Int, docId)
                .query("SELECT InteractionID FROM Interactions WHERE UserID = @UserID AND DocID = @DocID AND InteractionType = 'Like'");

            if (existing.recordset.length > 0) {
                await pool.request()
                    .input('InteractionID', sql.Int, existing.recordset[0].InteractionID)
                    .query('DELETE FROM Interactions WHERE InteractionID = @InteractionID');

                if (req.app.get('io')) req.app.get('io').emit('data_updated', { source: 'interactions', type: 'delete' });
                return res.json({ message: 'Đã bỏ thích', liked: false });
            }
        }

        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('DocID', sql.Int, docId)
            .input('InteractionType', sql.NVarChar(20), type)
            .input('CommentText', sql.NVarChar(500), commentText || null)
            .query(`INSERT INTO Interactions (UserID, DocID, InteractionType, CommentText)
                    VALUES (@UserID, @DocID, @InteractionType, @CommentText)`);

        if (req.app.get('io')) req.app.get('io').emit('data_updated', { source: 'interactions', type: 'insert' });

        res.json({ message: 'Thành công', liked: type === 'Like' ? true : undefined });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
