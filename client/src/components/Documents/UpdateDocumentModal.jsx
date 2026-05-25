import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';

export default function UpdateDocumentModal({ docId, onClose, categories, tags, onSuccess }) {
  const { user } = useAuth();
  const [title,      setTitle]      = useState('');
  const [summary,    setSummary]    = useState('');
  const [content,    setContent]    = useState('');
  const [catId,      setCatId]      = useState('');
  const [selTags,    setSelTags]    = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    async function fetchDoc() {
      if (!docId) return;
      setLoading(true);
      try {
        const data = await api.getDocumentById(docId);
        const doc = data.document;
        setTitle(doc.Title);
        setSummary(doc.Summary || '');
        setContent(doc.Content);
        setCatId(doc.CategoryID);
        setSelTags(data.tagIds || []);
      } catch (err) {
        setError('Không thể tải thông tin tài liệu: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDoc();
  }, [docId]);

  function toggleTag(id) {
    setSelTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !catId) {
      setError('Vui lòng điền Tiêu đề, Danh mục và Nội dung!'); return;
    }
    setSaving(true); setError('');
    try {
      await api.updateDocument(docId, {
        title, summary, content,
        categoryId: parseInt(catId),
        tags:       selTags,
      }, user.UserID, user.Role);
      onClose();
      onSuccess();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal show={true} onClose={onClose}>
      <div className="modal-header">
        <h2><i className="fa-solid fa-pen-to-square" /> Sửa Tài Liệu</h2>
        <button className="modal-close" onClick={onClose}>&times;</button>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0' }}><Spinner /></div>
      ) : (
        <form onSubmit={handleSave}>
          {error && <div className="auth-alert error">{error}</div>}

          <div className="form-group">
            <label>Tiêu đề <span className="required">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tiêu đề tài liệu..." />
          </div>

          <div className="form-group">
            <label>Tóm tắt</label>
            <textarea rows={2} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Mô tả ngắn gọn..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Danh mục <span className="required">*</span></label>
              <select value={catId} onChange={e => setCatId(e.target.value)}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => <option key={c.CatID} value={c.CatID}>{c.CatName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
                {tags.map(t => (
                  <button
                    key={t.TagID} type="button"
                    className="tag-pill"
                    style={selTags.includes(t.TagID) ? { background: 'var(--primary)', color: '#fff' } : {}}
                    onClick={() => toggleTag(t.TagID)}
                  >
                    {t.TagName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Nội dung đầy đủ <span className="required">*</span></label>
            <textarea rows={8} value={content} onChange={e => setContent(e.target.value)} placeholder="Nội dung chi tiết..." />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : <><i className="fa-solid fa-floppy-disk" /> Cập nhật</>}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
