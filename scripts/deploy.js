/**
 * deploy.js — Triển khai Database lên SQL Server
 * ─────────────────────────────────────────────────────────
 * Hỗ trợ cả Docker (macOS/Linux/Windows) và SQL Server cục bộ (Windows).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Kiểm tra HĐH
const isWin = process.platform === 'win32';

let sql;
if (isWin) {
    try {
        // Ưu tiên msnodesqlv8 trên Windows để hỗ trợ Windows Auth
        sql = require('mssql/msnodesqlv8');
    } catch (e) {
        sql = require('mssql');
    }
} else {
    sql = require('mssql');
}

// Cấu hình Docker mặc định
const DOCKER_CONFIG = {
    server: process.env.DB_SERVER || 'localhost',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Root@1234',
    port: 1433
};

// Danh sách máy chủ Windows để dò tìm (chỉ dùng nếu Docker thất bại trên Windows)
const WIN_SERVERS = ['(local)', 'localhost', '.', '.\\SQLEXPRESS', 'localhost\\SQLEXPRESS'];
const WIN_DRIVERS = ['{ODBC Driver 18 for SQL Server}', '{ODBC Driver 17 for SQL Server}', '{SQL Server}'];

async function executeSqlFile(config, filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const queries = content.split(/\bGO\b/gi);
    const pool = await new sql.ConnectionPool(config).connect();

    for (const raw of queries) {
        const q = raw.replace(/^\uFEFF/, '').replace(/--.*$/gm, '').trim();
        if (!q) continue;
        if (/^\s*(USE|CREATE DATABASE|DROP DATABASE)\s+/i.test(q)) continue;

        try {
            await pool.request().query(q);
        } catch (e) {
            console.error(`  ⚠  Lỗi lệnh: ${q.substring(0, 50)}...\n     ${e.message}`);
        }
    }
    await pool.close();
}

async function runDeploy() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║             DocSys — Deploy Database             ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    let masterPool;
    let finalConfig = null;

    // 1. Thử kết nối Docker (SQL Server Auth)
    console.log(`BƯỚC 1: Thử kết nối Docker SQL Server (${DOCKER_CONFIG.server})...`);
    try {
        const config = {
            user: DOCKER_CONFIG.user,
            password: DOCKER_CONFIG.password,
            server: DOCKER_CONFIG.server,
            port: DOCKER_CONFIG.port,
            database: 'master',
            options: { encrypt: false, trustServerCertificate: true }
        };
        masterPool = await new sql.ConnectionPool(config).connect();
        finalConfig = { ...DOCKER_CONFIG, type: 'sql' };
        console.log('  ✔  Kết nối Docker THÀNH CÔNG!\n');
    } catch (dockerErr) {
        console.log('  -  Không kết nối được Docker.');

        // 2. Nếu là Windows, thử dò tìm Windows Auth
        if (isWin) {
            console.log('  → Đang dò tìm SQL Server cục bộ (Windows Auth)...');
            for (let srv of WIN_SERVERS) {
                for (let drv of WIN_DRIVERS) {
                    try {
                        const connStr = `Driver=${drv};Server=${srv};Database=master;Trusted_Connection=yes;TrustServerCertificate=yes;`;
                        masterPool = await new sql.ConnectionPool({ connectionString: connStr }).connect();
                        finalConfig = { server: srv, driver: drv, type: 'win' };
                        console.log(`  ✔  Đã tìm thấy: ${srv} dùng ${drv}\n`);
                        break;
                    } catch (e) { }
                }
                if (finalConfig) break;
            }
        }

        if (!finalConfig) {
            console.error('  ✘  THẤT BẠI: Không thể kết nối đến bất kỳ SQL Server nào.');
            console.error('     Vui lòng kiểm tra Docker hoặc SQL Server Service.\n');
            process.exit(1);
        }
    }

    // Lưu cấu hình
    fs.writeFileSync(path.join(__dirname, 'db_config.json'), JSON.stringify(finalConfig, null, 2));

    // BƯỚC 2: Khởi tạo Database
    console.log('BƯỚC 2: Khởi tạo Database DocumentDB...');
    try {
        await masterPool.request().query(`
            IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'DocumentDB')
            BEGIN
                ALTER DATABASE DocumentDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                DROP DATABASE DocumentDB;
            END
            CREATE DATABASE DocumentDB;
        `);
        console.log('  ✔  Khởi tạo thành công.\n');
    } catch (err) {
        console.error('  ✘  Lỗi khởi tạo:', err.message);
        process.exit(1);
    } finally {
        await masterPool.close();
    }

    // BƯỚC 3: Chạy Scripts
    console.log('BƯỚC 3: Triển khai các file SQL...');
    const dbConfig = finalConfig.type === 'sql'
        ? {
            user: finalConfig.user, password: finalConfig.password,
            server: finalConfig.server, port: finalConfig.port,
            database: 'DocumentDB', options: { encrypt: false, trustServerCertificate: true }
        }
        : {
            connectionString: `Driver=${finalConfig.driver};Server=${finalConfig.server};Database=DocumentDB;Trusted_Connection=yes;TrustServerCertificate=yes;`
        };

    const scripts = ['../database/doc_schema.sql', '../database/doc_advanced.sql', '../database/doc_data.sql'];
    for (const s of scripts) {
        const p = path.join(__dirname, s);
        if (fs.existsSync(p)) {
            console.log(`  → ${path.basename(s)}`);
            await executeSqlFile(dbConfig, p);
        }
    }

    // BƯỚC 4: Hash Passwords
    console.log('\nBƯỚC 4: Mã hóa mật khẩu người dùng...');
    try {
        execSync(`node "${path.join(__dirname, 'hash_passwords.js')}"`, { stdio: 'inherit' });
        console.log('  ✔  Hoàn thành.\n');
    } catch (e) { }

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║           TRIỂN KHAI THÀNH CÔNG! 🎉              ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
}

runDeploy();
