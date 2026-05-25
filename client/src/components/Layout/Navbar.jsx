import { useAuth } from '../../contexts/AuthContext';

function getInitial(name) { return (name || 'U').charAt(0).toUpperCase(); }

export default function Navbar({ search, onSearchChange, onSearch, esOnline, activePage, onNavigate, onLogoClick }) {
  const { user, logout } = useAuth();

  function handleKey(e) { if (e.key === 'Enter') onSearch(); }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        {/* Logo */}
        <div className="nav-logo" onClick={onLogoClick} title="Trang chủ">
          <i className="fa-solid fa-layer-group" />
          Doc<span>Sys</span>
        </div>

        {/* Nav Tabs */}
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activePage === 'documents' ? 'active' : ''}`}
            onClick={() => onNavigate('documents')}
            id="nav-tab-documents"
          >
            <i className="fa-solid fa-file-lines" /> Tài liệu
          </button>
          <button
            className={`nav-tab ${activePage === 'sqllab' ? 'active' : ''}`}
            onClick={() => onNavigate('sqllab')}
            id="nav-tab-sqllab"
          >
            <i className="fa-solid fa-flask" /> SQL Lab
          </button>
        </div>

        {/* Search Bar — only on documents page */}
        {activePage === 'documents' && (
          <div className="search-bar">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              id="search-input"
              name="search"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Tìm kiếm tài liệu, sản phẩm..."
              autoComplete="off"
            />
            <button className="search-btn" onClick={onSearch}>Tìm</button>
            <span
              className={`es-dot ${esOnline ? 'on' : 'off'}`}
              title={esOnline ? 'Elasticsearch đang hoạt động' : 'Dùng SQL Server search (fallback)'}
            />
          </div>
        )}

        {activePage === 'sqllab' && (
          <div className="nav-sqllab-badge">
            <span className="sqllab-nav-icon"><i className="fa-solid fa-microscope" /></span>
            <span>Database Objects Visualizer</span>
          </div>
        )}

        {/* User info + Logout */}
        <div className="nav-user">
          <div className="user-chip">
            <div className="avatar">{getInitial(user?.FullName)}</div>
            <div className="user-chip-text">
              <div className="name">{user?.FullName}</div>
              <div className="role">{user?.Role}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={logout} title="Đăng xuất">
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        </div>
      </div>
    </nav>
  );
}
