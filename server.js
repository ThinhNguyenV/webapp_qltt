/**
 * server.js — DocSys Backend Entry Point
 * ─────────────────────────────────────────────────────────────
 * Khởi động Express server, kết nối SQL Server và Elasticsearch,
 * sau đó đăng ký tất cả các routes.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const { connect } = require('./src/config/db');
const { initElastic } = require('./src/config/elasticsearch');
const authRoutes = require('./src/routes/auth');
const documentsRoutes = require('./src/routes/documents');
const interactionsRoutes = require('./src/routes/interactions');
const reportsRoutes = require('./src/routes/reports');
const sqllabRoutes = require('./src/routes/sqllab');
const usersRoutes = require('./src/routes/users');

// ── Express App ──────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`[Socket] User disconnected: ${socket.id}`));
});

// Phục vụ frontend tĩnh (legacy fallback — React dùng Vite riêng)
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ───────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', documentsRoutes);
app.use('/api', interactionsRoutes);
app.use('/api', reportsRoutes);
app.use('/api', sqllabRoutes);
app.use('/api', usersRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

// ── Boot ──────────────────────────────────────────────────────
async function boot() {
    try {
        await connect();       // SQL Server
        await initElastic();   // Elasticsearch (non-blocking nếu lỗi)

        server.listen(PORT, () => {
            console.log(`\nDocSys Backend đang chạy tại http://localhost:${PORT}`);
            console.log(`React Frontend: http://localhost:5173`);
            console.log(`Health check:  http://localhost:${PORT}/api/health\n`);
        });
    } catch (err) {
        console.error('[BOOT] Lỗi khởi động:', err.message);
        process.exit(1);
    }
}

boot();
