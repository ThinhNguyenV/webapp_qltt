import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole, user.Role);
      setUsers(users.map(u => u.UserID === userId ? { ...u, Role: newRole } : u));
    } catch (err) {
      alert('Lỗi cập nhật quyền: ' + err.message);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Bạn có chắc chắn muốn vô hiệu hóa tài khoản này không? (Soft Delete)')) return;
    try {
      await api.deleteUser(userId, user.Role);
      setUsers(users.map(u => u.UserID === userId ? { ...u, Status: 'Inactive' } : u));
    } catch (err) {
      alert('Lỗi vô hiệu hóa tài khoản: ' + err.message);
    }
  };

  if (loading) return <div className="loader-center"><i className="fas fa-spinner fa-spin"></i> Đang tải danh sách người dùng...</div>;
  if (error) return <div className="p-4 text-red-500">Lỗi: {error}</div>;

  return (
    <div className="content-area" style={{ width: '100%', padding: '20px' }}>
      <div className="content-header">
        <h2 className="content-title"><i className="fas fa-users-cog"></i> Quản lý Người dùng</h2>
      </div>
      
      <div className="glass" style={{ padding: '20px', overflowX: 'auto' }}>
        <table className="demo-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '2px solid #e2e8f0', padding: '12px' }}>ID</th>
              <th style={{ borderBottom: '2px solid #e2e8f0', padding: '12px' }}>Tài khoản</th>
              <th style={{ borderBottom: '2px solid #e2e8f0', padding: '12px' }}>Họ tên</th>
              <th style={{ borderBottom: '2px solid #e2e8f0', padding: '12px' }}>Email</th>
              <th style={{ borderBottom: '2px solid #e2e8f0', padding: '12px' }}>Vai trò</th>
              <th style={{ borderBottom: '2px solid #e2e8f0', padding: '12px' }}>Trạng thái</th>
              <th style={{ borderBottom: '2px solid #e2e8f0', padding: '12px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.UserID} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>{u.UserID}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.Username}</td>
                <td style={{ padding: '12px' }}>{u.FullName}</td>
                <td style={{ padding: '12px' }}>{u.Email}</td>
                <td style={{ padding: '12px' }}>
                  <select
                    value={u.Role}
                    onChange={(e) => handleRoleChange(u.UserID, e.target.value)}
                    disabled={u.UserID === user.UserID || u.Status === 'Inactive' || u.Username === 'admin'}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="User">User</option>
                  </select>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                    backgroundColor: u.Status === 'Active' ? '#d1fae5' : '#fee2e2',
                    color: u.Status === 'Active' ? '#065f46' : '#991b1b'
                  }}>
                    {u.Status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {u.UserID !== user.UserID && u.Status === 'Active' && u.Username !== 'admin' && (
                    <button
                      onClick={() => handleDelete(u.UserID)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                      title="Vô hiệu hóa tài khoản"
                    >
                      <i className="fas fa-ban"></i> Vô hiệu hóa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
