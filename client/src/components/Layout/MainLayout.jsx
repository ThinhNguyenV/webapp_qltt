import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import DocumentGrid from '../Documents/DocumentGrid';
import DocumentDetail from '../Documents/DocumentDetail';
import AddDocumentModal from '../Documents/AddDocumentModal';
import UpdateDocumentModal from '../Documents/UpdateDocumentModal';
import SqlLabPage from '../SqlLab/SqlLabPage';
import UserManagement from '../Admin/UserManagement';

export default function MainLayout() {
  const { user } = useAuth();

  // Navigation
  const [activePage, setActivePage] = useState('documents'); // 'documents' | 'sqllab'


  // Meta
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [esOnline, setEsOnline] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('');

  // Documents
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [detailDocId, setDetailDocId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDocId, setEditDocId]       = useState(null);

  // ── Load meta on mount ─────────────────────────────────────
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
    api.getTags().then(setTags).catch(console.error);
    loadTopSearches();
    checkEs();
  }, []);

  async function checkEs() {
    try {
      await fetch('/api/documents?q=__ping__');
      setEsOnline(true);
    } catch { setEsOnline(false); }
  }

  async function loadTopSearches() {
    try { setTopSearches(await api.getTopSearches()); }
    catch { /* silently fail */ }
  }

  // ── Load documents ─────────────────────────────────────────
  const loadDocuments = useCallback(async (q = search, catId = activeCat) => {
    setLoading(true);
    try {
      const docs = await api.getDocuments({ q, categoryId: catId, userId: user?.UserID });
      setDocs(docs);
    } catch (err) { console.error(err); setDocs([]); }
    finally { setLoading(false); }
  }, [search, activeCat, user]);

  useEffect(() => { loadDocuments(); }, []); // initial load

  // ── Handlers ───────────────────────────────────────────────
  function handleGoHome() {
    setActivePage('documents');
    setSearch('');
    setActiveCat('');
    loadDocuments('', '');
  }

  function handleSearch() {
    setActiveCat('');
    loadDocuments(search, '');
    loadTopSearches();
  }

  function handleSelectCategory(catId) {
    setActiveCat(catId);
    setSearch('');
    loadDocuments('', catId);
  }

  function handleSelectKeyword(kw) {
    setSearch(kw);
    setActiveCat('');
    loadDocuments(kw, '');
    loadTopSearches();
  }

  function handleDocAdded() {
    loadDocuments();
    loadTopSearches();
  }

  // ── Compute grid title ─────────────────────────────────────
  function getTitle() {
    if (search) return `Kết quả: "${search}"`;
    if (activeCat) return categories.find(c => c.CatID === activeCat)?.CatName || 'Danh mục';
    return 'Tất cả tài liệu';
  }

  return (
    <>
      <Navbar
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        esOnline={esOnline}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogoClick={handleGoHome}
      />

      <div className={`main-layout${activePage === 'sqllab' ? ' full-width' : ''}`}>
        {activePage !== 'sqllab' && (
          <Sidebar
            categories={categories}
            topSearches={topSearches}
            activeCatId={activeCat}
            onSelectCategory={handleSelectCategory}
            onSelectKeyword={handleSelectKeyword}
            onAddDoc={() => setShowAddModal(true)}
            activePage={activePage}
            onNavigate={setActivePage}
          />
        )}

        {activePage === 'documents' && (
          <DocumentGrid
            docs={docs}
            loading={loading}
            title={getTitle()}
            onCardClick={setDetailDocId}
          />
        )}

        {activePage === 'sqllab' && <SqlLabPage />}

        {activePage === 'users' && <UserManagement />}
      </div>

      {/* Document Detail Modal */}
      {detailDocId && (
        <DocumentDetail
          docId={detailDocId}
          onClose={() => setDetailDocId(null)}
          onEdit={(id) => {
            setDetailDocId(null);
            setEditDocId(id);
          }}
        />
      )}

      {/* Add Document Modal */}
      <AddDocumentModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
        tags={tags}
        onSuccess={handleDocAdded}
      />

      {/* Edit Document Modal */}
      {editDocId && (
        <UpdateDocumentModal
          docId={editDocId}
          onClose={() => setEditDocId(null)}
          categories={categories}
          tags={tags}
          onSuccess={handleDocAdded}
        />
      )}
    </>
  );
}
