/**
 * hash_passwords.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Script chạy MỘT LẦN sau khi deploy để hash toàn bộ mật khẩu
 * plain-text trong bảng Users thành bcrypt hash.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

const SALT_ROUNDS = 10;

async function main() {
    let config = {
        server: 'localhost',
        database: 'DocumentDB',
        options: { encrypt: false, trustServerCertificate: true }
    };

    const cfgPath = path.join(__dirname, 'db_config.json');
    if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        if (cfg.type === 'sql') {
            config.user = cfg.user;
            config.password = cfg.password;
            config.server = cfg.server;
        } else if (cfg.type === 'win') {
            config.connectionString = `Driver=${cfg.driver};Server=${cfg.server};Database=DocumentDB;Trusted_Connection=yes;TrustServerCertificate=yes;`;
        }
    }

    console.log(`\nKết nối đến DB để hash mật khẩu...`);
    const pool = await sql.connect(config);
    console.log('Đã kết nối!\n');

    const users = await pool.request().query('SELECT UserID, Username, PasswordHash FROM Users');
    let updated = 0;
    let skipped = 0;

    for (const user of users.recordset) {
        const hash = user.PasswordHash;
        const isAlreadyHashed = hash && (hash.startsWith('$2b$') || hash.startsWith('$2a$'));

        if (isAlreadyHashed) {
            skipped++;
            continue;
        }

        const newHash = await bcrypt.hash(hash, SALT_ROUNDS);
        await pool.request()
            .input('NewHash', sql.NVarChar(255), newHash)
            .input('UserID', sql.Int, user.UserID)
            .query('UPDATE Users SET PasswordHash = @NewHash WHERE UserID = @UserID');

        console.log(`  [${user.Username}] — OK`);
        updated++;
    }

    console.log(`\nHoàn tất! Đã hash: ${updated} | Bỏ qua: ${skipped}\n`);
    await pool.close();
    process.exit(0);
}

main().catch(err => {
    console.error('Lỗi:', err.message);
    process.exit(1);
});
