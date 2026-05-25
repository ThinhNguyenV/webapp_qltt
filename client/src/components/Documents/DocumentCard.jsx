function parseTags(tagsStr) {
  return (tagsStr || '').split(',').map(t => t.trim()).filter(Boolean);
}

export default function DocumentCard({ doc, onClick }) {
  const tags = parseTags(doc.Tags).slice(0, 3);

  return (
    <article className="doc-card glass" onClick={onClick}>
      <div className="doc-cat">{doc.CatName}</div>
      <h3 className="doc-title">{doc.Title}</h3>
      <p className="doc-summary">{doc.Summary}</p>

      {tags.length > 0 && (
        <div className="doc-tags">
          {tags.map((t, i) => <span key={i} className="doc-tag">{t}</span>)}
        </div>
      )}

      <div className="doc-meta">
        <span className="doc-author">
          <i className="fa-solid fa-user-pen" style={{ marginRight: 5, color: 'var(--primary)' }} />
          {doc.AuthorName}
        </span>
        <div className="doc-stats">
          <span><i className="fa-regular fa-eye" /> {doc.ViewCount ?? 0}</span>
          <span><i className="fa-regular fa-heart" /> {doc.LikeCount ?? 0}</span>
        </div>
      </div>
    </article>
  );
}
