import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [tab, setTab]       = useState('login');
  const [alert, setAlert]   = useState(null); // { type: 'error'|'success', msg }
  const [loading, setLoading] = useState(false);

  // Login fields
  const [lUser, setLUser] = useState('');
  const [lPass, setLPass] = useState('');

  // Register fields
  const [rName, setRName]   = useState('');
  const [rUser, setRUser]   = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPass, setRPass]   = useState('');

  function switchTab(t) { setTab(t); setAlert(null); }

  async function handleLogin(e) {
    e.preventDefault();
    if (!lUser || !lPass) { setAlert({ type: 'error', msg: 'Vui lòng nhập đầy đủ thông tin.' }); return; }
    setLoading(true); setAlert(null);
    try {
      await login(lUser, lPass);
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!rName || !rUser || !rEmail || !rPass) { setAlert({ type: 'error', msg: 'Vui lòng điền đầy đủ các trường.' }); return; }
    if (rPass.length < 4) { setAlert({ type: 'error', msg: 'Mật khẩu phải có ít nhất 4 ký tự.' }); return; }
    setLoading(true); setAlert(null);
    try {
      await register(rName, rUser, rEmail, rPass);
      setAlert({ type: 'success', msg: `Đăng ký thành công! Chào mừng ${rName}` });
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
    } finally { setLoading(false); }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <i className="fa-solid fa-layer-group" />
          <h1>Doc<span>Sys</span></h1>
        </div>
        <p className="login-subtitle">Hệ thống Quản lý Tài liệu Thông minh</p>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
            Đăng nhập
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
            Đăng ký
          </button>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`auth-alert ${alert.type}`}>{alert.msg}</div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label><i className="fa-solid fa-user" /> Tên đăng nhập</label>
              <input value={lUser} onChange={e => setLUser(e.target.value)} placeholder="admin, thinh, huong..." />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-lock" /> Mật khẩu</label>
              <input type="password" value={lPass} onChange={e => setLPass(e.target.value)} placeholder="123456" />
            </div>
            <button type="submit" className="btn-primary full" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : <><span>Đăng nhập</span> <i className="fa-solid fa-arrow-right-to-bracket" /></>}
            </button>
            <p className="login-hint">Tài khoản mẫu: <strong>admin</strong> / <strong>123456</strong></p>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label><i className="fa-solid fa-id-card" /> Họ và tên</label>
              <input value={rName} onChange={e => setRName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label><i className="fa-solid fa-user" /> Tên đăng nhập</label>
                <input value={rUser} onChange={e => setRUser(e.target.value)} placeholder="username" />
              </div>
              <div className="form-group">
                <label><i className="fa-solid fa-envelope" /> Email</label>
                <input type="email" value={rEmail} onChange={e => setREmail(e.target.value)} placeholder="email@mail.com" />
              </div>
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-lock" /> Mật khẩu</label>
              <input type="password" value={rPass} onChange={e => setRPass(e.target.value)} placeholder="Nhập mật khẩu..." />
            </div>
            <button type="submit" className="btn-primary full" disabled={loading}>
              {loading ? 'Đang tạo tài khoản...' : <><span>Tạo tài khoản</span> <i className="fa-solid fa-user-plus" /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
