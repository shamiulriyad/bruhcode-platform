import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'cp_token';
const USER_KEY = 'cp_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [loading, setLoading] = useState(true); // Critical for preventing blank screens

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error("Invalid user JSON in localStorage");
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  // Check storage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) setToken(savedToken);
    setLoading(false); // Auth check complete
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const login = useCallback(({ token: nextToken, user: nextUser }) => {
    setToken(nextToken || '');
    setUser(nextUser || null);
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser(updatedUserData);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(token),
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      token: '',
      user: null,
      loading: false,
      isAuthenticated: false,
      login: () => {},
      logout: () => {},
      updateUser: () => {},
    };
  }
  return context;
}