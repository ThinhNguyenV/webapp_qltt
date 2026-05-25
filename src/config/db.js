/**
 * db.js — SQL Server Connection Pool
 * Khởi tạo và xuất connection pool dùng chung toàn app.
 */

const fs = require('fs');
const path = require('path');

let sql;
const isWin = process.platform === 'win32';

if (isWin) {
    try {
        sql = require('mssql/msnodesqlv8');
    } catch (e) {
        sql = require('mssql');
    }
} else {
    sql = require('mssql');
}

let pool;

async function connect() {
    // Giá trị mặc định
    let config = {
        server: 'localhost',
        database: 'DocumentDB',
        options: { encrypt: false, trustServerCertificate: true }
    };

    const cfgPath = path.join(__dirname, '../../scripts/db_config.json');
    if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

        if (cfg.type === 'sql') {
            // Docker / SQL Auth
            config.user = cfg.user;
            config.password = cfg.password;
            config.server = cfg.server;
            config.port = cfg.port || 1433;
        } else if (cfg.type === 'win') {
            // Windows Auth
            config.connectionString = `Driver=${cfg.driver};Server=${cfg.server};Database=DocumentDB;Trusted_Connection=yes;TrustServerCertificate=yes;`;
        }
    }

    const connectionType = config.connectionString ? 'Windows Auth' : 'SQL Auth';
    console.log(`[DB] Kết nối đến: ${config.server || 'Local'} (${connectionType})`);

    pool = await sql.connect(config);

    console.log('[DB] Đã kết nối SQL Server — DocumentDB');
    return pool;
}

function getPool() {
    if (!pool) throw new Error('[DB] Chưa kết nối database!');
    return pool;
}

module.exports = { connect, getPool, sql };
