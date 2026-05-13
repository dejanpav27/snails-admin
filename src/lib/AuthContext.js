import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, getMe } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('snails_token');
    if (!token) { setLoading(false); return; }
    getMe()
      .then((data) => setAdmin(data.admin))
      .catch(() => localStorage.removeItem('snails_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    localStorage.setItem('snails_token', data.token);
    setAdmin(data.admin);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('snails_token');
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
