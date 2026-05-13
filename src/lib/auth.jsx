import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

function loadSession() {
  try {
    const stored = sessionStorage.getItem('cms_auth');
    if (stored) return JSON.parse(stored);
  } catch { /* storage unavailable */ }
  return { token: '', user: null };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => loadSession().token);
  const [user, setUser]   = useState(() => loadSession().user);

  function login(ghToken, userInfo) {
    setToken(ghToken);
    setUser(userInfo);
    try { sessionStorage.setItem('cms_auth', JSON.stringify({ token: ghToken, user: userInfo })); } catch { /* ignore */ }
  }

  function logout() {
    setToken('');
    setUser(null);
    try { sessionStorage.removeItem('cms_auth'); } catch { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
