import Spinner from '../ui/Spinner';
import DocumentCard from './DocumentCard';

export default function DocumentGrid({ docs, loading, title, onCardClick }) {
  return (
    <main className="content">
      <div className="content-header">
        <h2 className="content-title">{title}</h2>
        {!loading && (
          <span className="result-badge">{docs.length} tài liệu</span>
        )}
      </div>

      <div className="doc-grid">
        {loading ? (
          <div style={{ gridColumn: '1 / -1' }}><Spinner /></div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-file-circle-xmark" />
            <p>Không tìm thấy tài liệu nào.</p>
          </div>
        ) : (
          docs.map(doc => (
            <DocumentCard key={doc.DocID} doc={doc} onClick={() => onCardClick(doc.DocID)} />
          ))
        )}
      </div>
    </main>
  );
}
