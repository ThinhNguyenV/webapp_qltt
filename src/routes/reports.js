/**
 * routes/reports.js — Báo cáo thống kê (5 Reports)
 */

const router = require('express').Router();
const { getPool } = require('../config/db');

// ── GET /api/top-searches ─────────────────────────────────────────────────
// Report 5: Từ khóa xu hướng (30 ngày qua)
router.get('/top-searches', async (req, res) => {
    try {
        const result = await getPool().request().execute('sp_Report_TrendingKeywords');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/reports/top-documents ───────────────────────────────────────
// Report 1: Top 10 tài liệu được xem nhiều nhất
router.get('/reports/top-documents', async (req, res) => {
    try {
        const result = await getPool().request().execute('sp_Report_TopDocuments');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/reports/monthly-posts ───────────────────────────────────────
// Report 2: Thống kê bài đăng theo tháng
router.get('/reports/monthly-posts', async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const result = await getPool().request()
            .input('Year', require('../config/db').sql.Int, year)
            .execute('sp_Report_MonthlyPosts');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/reports/active-users ────────────────────────────────────────
// Report 3: Người dùng hoạt động tích cực
router.get('/reports/active-users', async (req, res) => {
    try {
        const result = await getPool().request().execute('sp_Report_ActiveUsers');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/reports/storage-by-category ─────────────────────────────────
// Report 4: Dung lượng theo danh mục
router.get('/reports/storage-by-category', async (req, res) => {
    try {
        const result = await getPool().request().execute('sp_Report_StorageByCategory');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/reports/trending-keywords ───────────────────────────────────
// Report 5: Từ khóa xu hướng (với tùy chọn số ngày)
router.get('/reports/trending-keywords', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const result = await getPool().request()
            .input('Days', require('../config/db').sql.Int, days)
            .execute('sp_Report_TrendingKeywords');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/reports/document-status ─────────────────────────────────────
// Report 6: Thống kê trạng thái tài liệu
router.get('/reports/document-status', async (req, res) => {
    try {
        const result = await getPool().request().execute('sp_Report_DocumentStatus');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/reports/interactions ────────────────────────────────────────
// Report 7: Tổng hợp tương tác theo loại
router.get('/reports/interactions', async (req, res) => {
    try {
        const result = await getPool().request().execute('sp_Report_InteractionsSummary');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/reports/top-tags ────────────────────────────────────────────
// Report 8: Top 10 Thẻ phổ biến nhất
router.get('/reports/top-tags', async (req, res) => {
    try {
        const result = await getPool().request().execute('sp_Report_TopTags');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
