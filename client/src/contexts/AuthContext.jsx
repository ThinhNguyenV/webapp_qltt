import { createContext, useContext, useState, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('docSysUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    setUser(data.user);
    localStorage.setItem('docSysUser', JSON.stringify(data.user));
    return data.user;
  }, []);

  const register = useCallback(async (fullName, username, email, password) => {
    const data = await api.register(fullName, username, email, password);
    setUser(data.user);
    localStorage.setItem('docSysUser', JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('docSysUser');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
