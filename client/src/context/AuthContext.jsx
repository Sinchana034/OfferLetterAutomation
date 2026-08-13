import { createContext, useContext, useState, useCallback } from 'react';
import { api, getErrorMessage } from '../api/client';

const AuthContext = createContext(null);

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [staffUser, setStaffUser] = useState(() => readJson('staff_user'));
  const [candidate, setCandidate] = useState(() => readJson('candidate_user'));

  const staffLogin = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('staff_token', data.token);
      localStorage.setItem('staff_user', JSON.stringify(data.user));
      localStorage.removeItem('candidate_token');
      localStorage.removeItem('candidate_user');
      setCandidate(null);
      setStaffUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  }, []);

  const candidateLogin = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/candidate/login', { email, password });
      localStorage.setItem('candidate_token', data.token);
      localStorage.setItem('candidate_user', JSON.stringify(data.candidate));
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_user');
      setStaffUser(null);
      setCandidate(data.candidate);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');
    localStorage.removeItem('candidate_token');
    localStorage.removeItem('candidate_user');
    setStaffUser(null);
    setCandidate(null);
  }, []);

  return (
    <AuthContext.Provider value={{ staffUser, candidate, staffLogin, candidateLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
