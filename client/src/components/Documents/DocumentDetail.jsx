import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';

function formatDate(str) {
  return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitial(name) { return (name || 'U').charAt(0).toUpperCase(); }

function parseTags(str) {
  return (str || '').split(',').map(t => t.trim()).filter(Boolean);
}

export default function DocumentDetail({ docId, onClose, onEdit }) {
  const { user } = useAuth();
  const [doc, setDoc]           = useState(null);
  const [comments, setComments] = useState([]);
  const [liked, setLiked]       = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [loading, setLoading]   = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!docId) return;
    setLoading(true);
    try {
      const data = await api.getDocumentById(docId);
      setDoc(data.document);
      setComments(data.comments || []);
      setLikeCount(data.document?.LikeCount ?? 0);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, [docId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  async function handleLike() {
    try {
      const res = await api.postInteraction({ userId: user.UserID, docId, type: 'Like' });
      if (res.liked) { setLiked(true);  setLikeCount(c => c + 1); }
      else            { setLiked(false); setLikeCount(c => Math.max(0, c - 1)); }
    } catch (err) { console.error(err); }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.postInteraction({ userId: user.UserID, docId, type: 'Comment', commentText });
      setCommentText('');
      const data = await api.getDocumentById(docId);
      setComments(data.comments || []);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  }

  const canEdit = doc && user && (user.UserID === doc.AuthorID || user.Role === 'Admin');

  return (
    <Modal show onClose={onClose} wide>
      {/* Header */}
      <div className="modal-header">
        <h2 id="detail-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {loading ? 'Đang tải...' : (doc?.Title ?? 'Tài liệu')}
          {canEdit && (
            <button 
              className="btn-ghost sm" 
              onClick={() => onEdit(doc.DocID)}
              title="Sửa bài viết"
              style={{ padding: '4px 8px', fontSize: '13px', borderRadius: '4px' }}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
          )}
        </h2>
        <button className="modal-close" onClick={onClose}>&times;</button>
      </div>

      {loading ? <Spinner /> : doc ? (
        <>
          {/* Meta */}
          <div className="detail-meta">
            <span className="cat-badge">{doc.CatName}</span>
            <span><i className="fa-solid fa-user" /> {doc.AuthorName}</span>
            <span><i className="fa-regular fa-calendar" /> {formatDate(doc.PostDate)}</span>
            <span><i className="fa-regular fa-eye" /> {doc.ViewCount} lượt xem</span>
            {parseTags(doc.Tags).map((t, i) => (
              <span key={i} className="tag-pill" style={{ fontSize: 11, cursor: 'default' }}>{t}</span>
            ))}
          </div>

          {/* Summary */}
          {doc.Summary && <p className="detail-summary">{doc.Summary}</p>}

          {/* Content */}
          <div className="detail-content">{doc.Content}</div>

          {/* Interaction bar */}
          <div className="interaction-bar">
            <button className={`btn-like ${liked ? 'liked' : ''}`} onClick={handleLike}>
              <i className={liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
              {likeCount} Thích
            </button>
            <span className="comment-count-label">
              <i className="fa-regular fa-comment" /> {comments.length} Bình luận
            </span>
          </div>

          {/* Comment input */}
          <div className="comment-input-row">
            <div className="avatar sm">{getInitial(user?.FullName)}</div>
            <form className="comment-input-wrap" onSubmit={handleComment}>
              <textarea
                rows={2}
                placeholder="Viết bình luận... (Enter để gửi)"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(e); } }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary sm" disabled={submitting || !commentText.trim()}>
                  {submitting ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </form>
          </div>

          {/* Comments list */}
          <div className="comments-list">
            {comments.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
                Chưa có bình luận. Hãy là người đầu tiên!
              </p>
            ) : (
              comments.map(c => (
                <div key={c.InteractionID} className="comment-item">
                  <div className="avatar sm">{getInitial(c.FullName)}</div>
                  <div className="comment-body">
                    <div className="comment-author">{c.FullName}</div>
                    <div className="comment-text">{c.CommentText}</div>
                    <div className="comment-date">{formatDate(c.InteractionDate)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Không tìm thấy tài liệu.</p>
      )}
    </Modal>
  );
}
