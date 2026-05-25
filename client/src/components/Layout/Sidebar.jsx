import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({ categories, topSearches, activeCatId, onSelectCategory, onSelectKeyword, onAddDoc, activePage, onNavigate }) {
  const { user } = useAuth();
  return (
    <aside className="sidebar">
      {/* Add button - Đưa lên đầu để dễ thấy nhất */}
      <button className="btn-primary full" onClick={onAddDoc} style={{ padding: '14px', fontSize: '15px' }}>
        <i className="fa-solid fa-plus" /> Thêm Tài Liệu Mới
      </button>

      {/* Categories */}
      <div className="sidebar-section glass">
        <div className="sidebar-title">
          <i className="fa-solid fa-folder-open" /> Danh mục
        </div>
        <ul className="cat-list">
          <li>
            <button
              className={`cat-link ${activeCatId === '' ? 'active' : ''}`}
              onClick={() => onSelectCategory('')}
            >
              Tất cả
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat.CatID}>
              <button
                className={`cat-link ${activeCatId === cat.CatID ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.CatID)}
              >
                {cat.CatName}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Trending keywords */}
      <div className="sidebar-section glass">
        <div className="sidebar-title">
          <i className="fa-solid fa-fire" /> Từ khóa nổi bật
        </div>
        <div className="tags-cloud">
          {topSearches.map((item, i) => (
            <button key={i} className="tag-pill" onClick={() => onSelectKeyword(item.SearchQuery)}>
              {item.SearchQuery}
            </button>
          ))}
          {topSearches.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Chưa có dữ liệu</span>}
        </div>
      </div>

      {/* Admin Panel */}
      {user?.Role === 'Admin' && (
        <div className="sidebar-section glass">
          <div className="sidebar-title">
            <i className="fa-solid fa-user-shield" /> Quản trị
          </div>
          <ul className="cat-list">
            <li>
              <button
                className={`cat-link ${activePage === 'users' ? 'active' : ''}`}
                onClick={() => onNavigate('users')}
              >
                <i className="fas fa-users-cog" style={{ marginRight: '8px' }}></i> Quản lý Người dùng
              </button>
            </li>
          </ul>
        </div>
      )}
    </aside>
  );
}
