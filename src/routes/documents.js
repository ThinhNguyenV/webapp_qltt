/**
 * routes/documents.js — Quản lý Tài liệu, Danh mục, Tags
 */

const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { isEsAvailable, getEsClient, indexDocument } = require('../config/elasticsearch');

// ── GET /api/categories ───────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
    try {
        const result = await getPool().request()
            .query('SELECT CatID, CatName FROM Categories ORDER BY CatName');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/tags ─────────────────────────────────────────────────────────
router.get('/tags', async (req, res) => {
    try {
        const result = await getPool().request()
            .query('SELECT TagID, TagName FROM Tags ORDER BY TagName');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});



// ── GET /api/documents ────────────────────────────────────────────────────
// Tìm kiếm qua Elasticsearch nếu có từ khóa; fallback về SQL Server
router.get('/documents', async (req, res) => {
    try {
        const { q, categoryId, userId } = req.query;
        const pool = getPool();

        // Ghi search log nếu có keyword và userId
        if (q && q.trim() && userId) {
            await pool.request()
                .input('UserID', sql.Int, parseInt(userId))
                .input('Keyword', sql.NVarChar(255), q)
                .query('INSERT INTO SearchLogs (UserID, SearchQuery) VALUES (@UserID, @Keyword)');
        }

        // ── Elasticsearch path ──────────────────────────────────────────
        if (q && q.trim() && isEsAvailable()) {
            const esResult = await getEsClient().search({
                index: 'documents',
                query: {
                    multi_match: {
                        query: q,
                        fields: ['Title^3', 'Summary^2', 'Content', 'AuthorName', 'CatName'],
                        fuzziness: 'AUTO',
                    },
                },
                size: 50,
            });

            const docIds = esResult.hits.hits.map(h => h._source.DocID);
            if (docIds.length === 0) return res.json([]);

            const sqlResult = await pool.request().query(`
                SELECT d.DocID, d.Title, d.Summary, d.PostDate, d.ViewCount,
                       u.FullName AS AuthorName, c.CatName,
                       dbo.fn_GetDocTags(d.DocID)  AS Tags,
                       dbo.fn_CountLikes(d.DocID)  AS LikeCount
                FROM Documents d
                JOIN Users      u ON d.AuthorID   = u.UserID
                JOIN Categories c ON d.CategoryID = c.CatID
                WHERE d.DocID IN (${docIds.join(',')})
            `);
            return res.json(sqlResult.recordset);
        }

        // ── SQL Server fallback ─────────────────────────────────────────
        const request = pool.request()
            .input('Keyword', sql.NVarChar(255), q || null)
            .input('CategoryID', sql.Int, categoryId ? parseInt(categoryId) : null)
            .input('UserID', sql.Int, userId ? parseInt(userId) : null);

        const result = await request.execute('sp_SearchDocument');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/documents/:id ────────────────────────────────────────────────
router.get('/documents/:id', async (req, res) => {
    try {
        const docId = parseInt(req.params.id);
        const pool = getPool();
        const result = await pool.request()
            .input('DocID', sql.Int, docId)
            .execute('sp_GetDocDetails');

        const tagsRes = await pool.request()
            .input('DocID', sql.Int, docId)
            .query('SELECT TagID FROM DocTags WHERE DocID = @DocID');

        res.json({
            document: result.recordsets[0][0],
            comments: result.recordsets[1] || [],
            tagIds: tagsRes.recordset.map(r => r.TagID),
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/documents ───────────────────────────────────────────────────
router.post('/documents', async (req, res) => {
    try {
        const { title, summary, content, categoryId, authorId, tags } = req.body;
        if (!title || !content || !categoryId || !authorId)
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });

        const pool = getPool();

        const result = await pool.request()
            .input('Title', sql.NVarChar(255), title)
            .input('Summary', sql.NVarChar(500), summary || '')
            .input('Content', sql.NVarChar(sql.MAX), content)
            .input('CategoryID', sql.Int, parseInt(categoryId))
            .input('AuthorID', sql.Int, parseInt(authorId))
            .execute('sp_AddDocument');

        const newDocId = result.recordset[0].NewDocID;

        // Thêm tags
        if (Array.isArray(tags)) {
            for (const tagId of tags) {
                await pool.request()
                    .input('DocID', sql.Int, newDocId)
                    .input('TagID', sql.Int, parseInt(tagId))
                    .query('INSERT INTO DocTags (DocID, TagID) VALUES (@DocID, @TagID)');
            }
        }

        // Sync lên Elasticsearch
        const catRes = await pool.request().input('CatID', sql.Int, parseInt(categoryId)).query('SELECT CatName FROM Categories WHERE CatID = @CatID');
        const authorRes = await pool.request().input('AID', sql.Int, parseInt(authorId)).query('SELECT FullName FROM Users WHERE UserID = @AID');
        await indexDocument({
            DocID: newDocId, Title: title, Summary: summary || '', Content: content,
            ViewCount: 0, PostDate: new Date(),
            CatName: catRes.recordset[0]?.CatName || '',
            AuthorName: authorRes.recordset[0]?.FullName || '',
        });

        // Phát sự kiện qua socket.io
        if (req.app.get('io')) {
            req.app.get('io').emit('data_updated', { source: 'documents', type: 'insert' });
        }

        res.status(201).json({ message: 'Tạo tài liệu thành công', docId: newDocId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/documents/:id ────────────────────────────────────────────────
router.put('/documents/:id', async (req, res) => {
    try {
        const docId = parseInt(req.params.id);
        const { title, summary, content, categoryId, tags } = req.body;
        // UserID and Role are passed in custom headers or can be taken from middleware if available.
        // For now, since we haven't implemented JWT, the frontend will pass x-user-id and x-user-role
        const userId = parseInt(req.headers['x-user-id']);
        const userRole = req.headers['x-user-role'];

        if (!title || !content || !categoryId || !userId)
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });

        const pool = getPool();

        // 1. Kiểm tra quyền
        const docRes = await pool.request()
            .input('DocID', sql.Int, docId)
            .query('SELECT AuthorID FROM Documents WHERE DocID = @DocID');

        if (docRes.recordset.length === 0)
            return res.status(404).json({ error: 'Tài liệu không tồn tại' });

        const authorId = docRes.recordset[0].AuthorID;
        if (userId !== authorId && userRole !== 'Admin') {
            return res.status(403).json({ error: 'Bạn không có quyền sửa tài liệu này' });
        }

        // 2. Cập nhật bảng Documents
        await pool.request()
            .input('Title', sql.NVarChar(255), title)
            .input('Summary', sql.NVarChar(500), summary || '')
            .input('Content', sql.NVarChar(sql.MAX), content)
            .input('CategoryID', sql.Int, parseInt(categoryId))
            .input('DocID', sql.Int, docId)
            .query(`
                UPDATE Documents 
                SET Title = @Title, Summary = @Summary, Content = @Content, CategoryID = @CategoryID, LastModified = GETDATE()
                WHERE DocID = @DocID
            `);

        // 3. Cập nhật DocTags (Xóa cũ, Thêm mới)
        await pool.request()
            .input('DocID', sql.Int, docId)
            .query('DELETE FROM DocTags WHERE DocID = @DocID');

        if (Array.isArray(tags)) {
            for (const tagId of tags) {
                await pool.request()
                    .input('DocID', sql.Int, docId)
                    .input('TagID', sql.Int, parseInt(tagId))
                    .query('INSERT INTO DocTags (DocID, TagID) VALUES (@DocID, @TagID)');
            }
        }

        // 4. Sync lên Elasticsearch
        const catRes = await pool.request().input('CatID', sql.Int, parseInt(categoryId)).query('SELECT CatName FROM Categories WHERE CatID = @CatID');
        const authorRes = await pool.request().input('AID', sql.Int, authorId).query('SELECT FullName FROM Users WHERE UserID = @AID');

        await indexDocument({
            DocID: docId, Title: title, Summary: summary || '', Content: content,
            CatName: catRes.recordset[0]?.CatName || '',
            AuthorName: authorRes.recordset[0]?.FullName || '',
        });

        // 5. Phát sự kiện qua socket.io
        if (req.app.get('io')) {
            req.app.get('io').emit('data_updated', { source: 'documents', type: 'update' });
        }

        res.json({ message: 'Cập nhật tài liệu thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

