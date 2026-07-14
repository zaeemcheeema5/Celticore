import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The JWT itself now lives in an httpOnly cookie the frontend can
    // never read — there's no token to pull out of localStorage anymore.
    // A cached `user` object (just display data, nothing sensitive) is
    // used for an instant, flicker-free UI on load, then reconciled
    // against the server, which is the actual source of truth: if the
    // cookie is missing/expired, this call 401s and we fall back to
    // logged-out state.
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }

    authService.getProfile()
      .then((data) => {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      })
      .catch(() => {
        // No valid session cookie (never logged in, expired, or logged
        // out elsewhere) — make sure stale cached UI state doesn't linger.
        setUser(null);
        localStorage.removeItem('user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      // The backend sets the auth cookie itself via Set-Cookie on this
      // response — nothing for the client to store except display data.
      const data = await authService.login(credentials);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: any) => {
    setLoading(true);
    try {
      const data = await authService.signup(userData);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Fire-and-forget: clears the httpOnly cookie server-side. UI updates
    // immediately above regardless of whether this network call succeeds.
    authService.logout().catch(() => {});
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'main_admin';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
