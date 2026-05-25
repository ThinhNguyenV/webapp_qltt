/**
 * elasticsearch.js — Elasticsearch Client & Sync Logic
 */

const { Client } = require('@elastic/elasticsearch');
const { getPool, sql } = require('./db');

const esClient = new Client({ node: 'http://localhost:9200', requestTimeout: 3000 });
let esAvailable = false;

const INDEX = 'documents';

async function checkElastic() {
    try {
        await esClient.ping();
        esAvailable = true;
        console.log('[ES] Elasticsearch đang chạy tại localhost:9200');
    } catch {
        esAvailable = false;
        console.log('[ES] Elasticsearch chưa chạy — dùng SQL Server search (fallback)');
    }
    return esAvailable;
}

async function ensureIndex() {
    const exists = await esClient.indices.exists({ index: INDEX });
    if (!exists) {
        await esClient.indices.create({
            index: INDEX,
            body: {
                mappings: {
                    properties: {
                        DocID: { type: 'integer' },
                        Title: { type: 'text', analyzer: 'standard' },
                        Summary: { type: 'text', analyzer: 'standard' },
                        Content: { type: 'text', analyzer: 'standard' },
                        AuthorName: { type: 'keyword' },
                        CatName: { type: 'keyword' },
                        ViewCount: { type: 'integer' },
                        PostDate: { type: 'date' },
                    },
                },
            },
        });
        console.log(`[ES] Đã tạo index "${INDEX}"`);
    }
}

async function syncAllDocuments() {
    const pool = getPool();
    const result = await pool.request().query(`
        SELECT d.DocID, d.Title, d.Summary, d.Content, d.ViewCount, d.PostDate,
               u.FullName AS AuthorName, c.CatName
        FROM Documents d
        JOIN Users u      ON d.AuthorID   = u.UserID
        JOIN Categories c ON d.CategoryID = c.CatID
        WHERE d.Status = 'Published'
    `);

    if (result.recordset.length === 0) return;

    const operations = result.recordset.flatMap(doc => [
        { index: { _index: INDEX, _id: String(doc.DocID) } },
        {
            DocID: doc.DocID, Title: doc.Title, Summary: doc.Summary,
            Content: doc.Content, AuthorName: doc.AuthorName,
            CatName: doc.CatName, ViewCount: doc.ViewCount, PostDate: doc.PostDate,
        },
    ]);

    await esClient.bulk({ operations });
    console.log(`[ES] Đã sync ${result.recordset.length} tài liệu lên Elasticsearch`);
}

async function initElastic() {
    const available = await checkElastic();
    if (!available) return;
    try {
        await ensureIndex();
        await syncAllDocuments();
    } catch (err) {
        console.error('[ES] Lỗi khởi tạo:', err.message);
    }
}

async function indexDocument(doc) {
    if (!esAvailable) return;
    try {
        await esClient.index({ index: INDEX, id: String(doc.DocID), document: doc });
    } catch (err) {
        console.error('[ES] Lỗi index document:', err.message);
    }
}

function isEsAvailable() { return esAvailable; }
function getEsClient() { return esClient; }

module.exports = { initElastic, indexDocument, isEsAvailable, getEsClient };
