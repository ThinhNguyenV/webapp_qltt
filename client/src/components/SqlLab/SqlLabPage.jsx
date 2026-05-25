import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const BASE = '/api';
const get  = (url) => fetch(BASE + url).then(r => r.json());
const post = (url, body) => fetch(BASE + url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}).then(r => r.json());

// ── Simple data table ──────────────────────────────────────────
function renderLabel(text) {
  if (!text) return null;
  // Cho phép render HTML từ backend trả về (như thẻ <i> của FontAwesome)
  return <div className="demo-table-label" dangerouslySetInnerHTML={{ __html: text }} />;
}

function DataTable({ columns, rows, label }) {
  if (!columns || columns.length === 0) return (
    <div className="demo-empty">— Không có dữ liệu —</div>
  );
  return (
    <div className="demo-table-block">
      {renderLabel(label)}
      <div className="demo-table-wrap">
        <table className="demo-table">
          <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map(c => <td key={c}>{row[c] != null ? String(row[c]) : <em>NULL</em>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="demo-row-count">{rows.length} dòng</div>
      </div>
    </div>
  );
}

// ── Category badge ─────────────────────────────────────────────
const CAT_STYLE = {
  'Stored Procedure': { bg: '#dbeafe', color: '#1d4ed8' },
  'Trigger':          { bg: '#fef3c7', color: '#92400e' },
  'Function':         { bg: '#d1fae5', color: '#065f46' },
  'Cursor':           { bg: '#ede9fe', color: '#5b21b6' },
};

// ── Single Demo Item ───────────────────────────────────────────
function DemoItem({ demo }) {
  const [open,      setOpen]      = useState(false);
  const [before,    setBefore]    = useState(null);
  const [result,    setResult]    = useState(null);
  const [after,     setAfter]     = useState(null);
  const [params,    setParams]    = useState({});
  const [loading,   setLoading]   = useState({});
  const [error,     setError]     = useState(null);
  const cs = CAT_STYLE[demo.category] || { bg:'#f3f4f6', color:'#374151' };

  function setLoad(k, v) { setLoading(p => ({ ...p, [k]: v })); }

  async function loadBefore() {
    setLoad('before', true);
    try { setBefore(await get(`/demos/${demo.id}/before`)); }
    catch (e) { setError(e.message); }
    finally { setLoad('before', false); }
  }

  async function execute() {
    setLoad('exec', true); setResult(null); setAfter(null); setError(null);
    try {
      const r = await post(`/demos/${demo.id}/execute`, { params });
      setResult(r);
      if (demo.hasAfter) {
        const a = await get(`/demos/${demo.id}/after`);
        setAfter(a);
      }
    } catch (e) { setError(e.message); }
    finally { setLoad('exec', false); }
  }

  return (
    <div className="demo-item" id={`demo-${demo.id}`}>
      {/* Header */}
      <div className="demo-header" onClick={() => { setOpen(o => !o); if (!open && !before) loadBefore(); }}>
        <span className="demo-icon"><i className={demo.icon}></i></span>
        <div className="demo-header-text">
          <span className="demo-cat-badge" style={{ background: cs.bg, color: cs.color }}>{demo.category}</span>
          <span className="demo-title">{demo.b1}</span>
        </div>
        <span className="demo-chevron"><i className={`fas fa-chevron-${open ? 'up' : 'down'}`}></i></span>
      </div>

      {open && (
        <div className="demo-body">
          {/* B1 */}
          <div className="demo-step">
            <div className="step-label"><i className="fas fa-thumbtack"></i> B1 — Bài toán</div>
            <div className="step-content b1-content">{demo.b1}</div>
          </div>

          {/* B2 */}
          <div className="demo-step">
            <div className="step-label"><i className="fas fa-code"></i> B2 — Câu lệnh SQL</div>
            <pre className="sql-pre">{demo.b2}</pre>
          </div>

          {/* B3 */}
          <div className="demo-step">
            <div className="step-label"><i className="fas fa-clipboard-list"></i> B3 — Bảng dữ liệu liên quan (trước khi thực thi)</div>
            {loading.before && <div className="demo-loading"><i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu từ SQL Server…</div>}
            {!loading.before && !before && (
              <button className="demo-btn secondary" onClick={loadBefore}><i className="fas fa-download"></i> Tải dữ liệu từ DB</button>
            )}
            {before && before.map((t, i) => <DataTable key={i} label={t.label} columns={t.columns} rows={t.rows} />)}
          </div>

          {/* Params + B4 */}
          <div className="demo-step">
            <div className="step-label"><i className="fas fa-play"></i> B4 — Thực thi câu lệnh</div>
            {demo.params && demo.params.length > 0 && (
              <div className="demo-params">
                {demo.params.map(p => (
                  <div key={p.name} className="demo-param-row">
                    <label>@{p.name} <span className="param-type">({p.type}){p.required ? ' *' : ''}</span></label>
                    <input
                      type={p.type === 'int' ? 'number' : 'text'}
                      placeholder={p.placeholder}
                      value={params[p.name] || ''}
                      onChange={e => setParams(prev => ({ ...prev, [p.name]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}
            <button
              className="demo-btn primary"
              onClick={execute}
              disabled={loading.exec}
              id={`exec-${demo.id}`}
            >
              {loading.exec ? <><i className="fas fa-spinner fa-spin"></i> Đang thực thi trên SQL Server…</> : <><i className="fas fa-play"></i> Thực thi</>}
            </button>

            {error && <div className="demo-error"><i className="fas fa-exclamation-circle"></i> Lỗi: {error}</div>}

            {result && (
              <div className="exec-result-box">
                {result.isExpectedError ? (
                  <div className="exec-expected-error">
                    <i className="fas fa-check-circle"></i> <strong>{result.message}</strong>
                    <div className="exec-error-detail">Chi tiết lỗi từ SQL Server: {result.errorDetail}</div>
                  </div>
                ) : (
                  <>
                    <div className="exec-success"><i className="fas fa-check-circle"></i> Thực thi thành công — {result.elapsed}ms</div>
                    {result.recordsets && result.recordsets.map((rs, i) => (
                      <DataTable key={i} label={result.recordsets.length > 1 ? `Recordset #${i+1}` : null} columns={rs.columns} rows={rs.rows} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* B5 */}
          {after && (
            <div className="demo-step">
              <div className="step-label"><i className="fas fa-sync-alt"></i> B5 — Kết quả sau khi thực thi (so sánh thay đổi)</div>
              {after.map((t, i) => <DataTable key={i} label={t.label} columns={t.columns} rows={t.rows} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reports Section (Section B) ────────────────────────────────
function ReportsSection() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const loadingRef = useRef(false);

  async function loadReports(background = false) {
    if (!background) setLoading(true);
    loadingRef.current = true;
    setError(null);
    try { setData(await get('/reports')); }
    catch (e) { setError(e.message); }
    finally { 
      if (!background) setLoading(false); 
      loadingRef.current = false;
    }
  }

  // Socket.io listener for auto updates
  useEffect(() => {
    const socket = io();
    
    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket for real-time updates');
    });

    socket.on('data_updated', (event) => {
      console.log('🔄 Có dữ liệu mới từ backend:', event);
      // Nếu đang không load, load lại background một cách ngầm định (không hiển thị chữ Loading để tránh giật hình)
      if (!loadingRef.current) {
        loadReports(true);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="section-b">
      <h2 className="section-title"><i className="fas fa-chart-bar"></i> B — Trình bày thông tin (Reports từ SQL Server)</h2>
      <p className="section-desc">Dữ liệu được load trực tiếp từ SQL Server thông qua các Stored Procedures. Tự động cập nhật (Real-time) qua WebSocket khi có thay đổi.</p>

      {!data && !loading && (
        <button className="demo-btn primary" onClick={() => loadReports(false)} id="load-reports-btn">
          <i className="fas fa-download"></i> Load tất cả Reports từ DB
        </button>
      )}
      {loading && <div className="demo-loading"><i className="fas fa-spinner fa-spin"></i> Đang truy vấn SQL Server…</div>}
      {error && <div className="demo-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

      {data && (
        <div className="reports-grid">
          <div className="report-card">
            <h3><i className="fas fa-trophy"></i> Top 10 Tài liệu được xem nhiều nhất</h3>
            <p className="report-proc">sp_Report_TopDocuments</p>
            <DataTable columns={data.topDocuments.length ? Object.keys(data.topDocuments[0]) : []} rows={data.topDocuments} />
          </div>
          <div className="report-card">
            <h3><i className="fas fa-calendar-alt"></i> Thống kê bài đăng theo tháng ({new Date().getFullYear()})</h3>
            <p className="report-proc">sp_Report_MonthlyPosts</p>
            <DataTable columns={data.monthlyPosts.length ? Object.keys(data.monthlyPosts[0]) : []} rows={data.monthlyPosts} />
            {data.monthlyPosts.length > 0 && (
              <div className="bar-chart">
                {data.monthlyPosts.map(r => (
                  <div key={r.Month} className="bar-row">
                    <span className="bar-label">T{r.Month}</span>
                    <div className="bar-fill" style={{ width: `${Math.max(4, r.TotalDocuments * 30)}px` }}>{r.TotalDocuments}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="report-card">
            <h3><i className="fas fa-users"></i> Top 20 Người dùng hoạt động tích cực</h3>
            <p className="report-proc">sp_Report_ActiveUsers</p>
            <DataTable columns={data.activeUsers.length ? Object.keys(data.activeUsers[0]) : []} rows={data.activeUsers} />
          </div>
          <div className="report-card">
            <h3><i className="fas fa-database"></i> Thống kê tài liệu theo danh mục</h3>
            <p className="report-proc">sp_Report_StorageByCategory</p>
            <DataTable columns={data.storageByCategory.length ? Object.keys(data.storageByCategory[0]) : []} rows={data.storageByCategory} />
            {data.storageByCategory.length > 0 && (
              <div className="bar-chart">
                {data.storageByCategory.map((r, i) => (
                  <div key={i} className="bar-row">
                    <span className="bar-label" title={r.CatName}>{r.CatName.substring(0,15)}…</span>
                    <div className="bar-fill" style={{ width: `${Math.max(4, r.TotalDocuments * 30)}px` }}>{r.TotalDocuments}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="report-card">
            <h3><i className="fas fa-fire"></i> Top 10 Từ khóa xu hướng (30 ngày)</h3>
            <p className="report-proc">sp_Report_TrendingKeywords</p>
            <DataTable columns={data.trendingKeywords.length ? Object.keys(data.trendingKeywords[0]) : []} rows={data.trendingKeywords} />
          </div>
          <div className="report-card">
            <h3><i className="fas fa-chart-pie"></i> Thống kê Trạng thái Tài liệu</h3>
            <p className="report-proc">sp_Report_DocumentStatus</p>
            <DataTable columns={data.documentStatus.length ? Object.keys(data.documentStatus[0]) : []} rows={data.documentStatus} />
          </div>
          <div className="report-card">
            <h3><i className="fas fa-comments"></i> Thống kê Tương tác (Like & Comment)</h3>
            <p className="report-proc">sp_Report_InteractionsSummary</p>
            <DataTable columns={data.interactionsSummary.length ? Object.keys(data.interactionsSummary[0]) : []} rows={data.interactionsSummary} />
          </div>
          <div className="report-card">
            <h3><i className="fas fa-tags"></i> Top 10 Thẻ (Tags) phổ biến nhất</h3>
            <p className="report-proc">sp_Report_TopTags</p>
            <DataTable columns={data.topTags.length ? Object.keys(data.topTags[0]) : []} rows={data.topTags} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main SQL Lab Page ──────────────────────────────────────────
export default function SqlLabPage() {
  const [demos,   setDemos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [section, setSection] = useState('A');
  const CATS = ['all', 'Stored Procedure', 'Trigger', 'Function', 'Cursor'];

  useEffect(() => {
    get('/demos').then(setDemos).catch(console.error).finally(() => setLoading(false));
  }, []);

  const shown = filter === 'all' ? demos : demos.filter(d => d.category === filter);

  return (
    <div className="sqllab-page">
      <div className="sqllab-page-header">
        <h1><i className="fas fa-flask"></i> SQL Lab — Demo Database Objects</h1>
        <p>Tương tác trực tiếp với SQL Server: load data, thực thi, so sánh kết quả trước/sau</p>
      </div>

      {/* Section switcher */}
      <div className="section-tabs">
        <button className={`sec-tab ${section==='A'?'active':''}`} onClick={() => setSection('A')} id="sec-tab-a">
          <i className="fas fa-cogs"></i> A — Xử lý thông tin
        </button>
        <button className={`sec-tab ${section==='B'?'active':''}`} onClick={() => setSection('B')} id="sec-tab-b">
          <i className="fas fa-chart-bar"></i> B — Trình bày thông tin (Reports)
        </button>
      </div>

      {/* Section A */}
      {section === 'A' && (
        <div className="section-a">
          <h2 className="section-title"><i className="fas fa-cogs"></i> A — Xử lý thông tin: Procedure / Trigger / Function / Cursor</h2>
          <p className="section-desc">Mỗi demo gồm: B1 Bài toán → B2 SQL → B3 Dữ liệu trước → B4 Thực thi → B5 Kết quả sau</p>

          {/* Category filter */}
          <div className="cat-filter-bar">
            {CATS.map(c => (
              <button key={c} className={`cat-filter-btn ${filter===c?'active':''}`} onClick={() => setFilter(c)}>
                {c === 'all' ? 'Tất cả' : c}
              </button>
            ))}
          </div>

          {loading && <div className="demo-loading"><i className="fas fa-spinner fa-spin"></i> Đang tải…</div>}
          <div className="demo-list">
            {shown.map(d => <DemoItem key={d.id} demo={d} />)}
          </div>
        </div>
      )}

      {/* Section B */}
      {section === 'B' && <ReportsSection />}
    </div>
  );
}
