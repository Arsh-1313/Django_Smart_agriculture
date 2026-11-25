import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [roleProfile, setRoleProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('role_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.getProfile()
        .then((res) => {
          if (res?.data?.user) {
            setUser(res.data.user);
            setRoleProfile(res.data.role_profile);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            if (res.data.role_profile) {
              localStorage.setItem('role_profile', JSON.stringify(res.data.role_profile));
            }
          }
        })
        .catch(() => {
          // Token invalid or expired
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const res = await authAPI.login({ username_or_email: identifier, password });
    if (res?.data) {
      const { access, refresh, user: userData, role_profile: roleData } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      if (roleData) {
        localStorage.setItem('role_profile', JSON.stringify(roleData));
      }
      setUser(userData);
      setRoleProfile(roleData);
      return userData;
    }
    throw new Error(res?.message || 'Login failed.');
  };

  const register = async (registrationData) => {
    const res = await authAPI.register(registrationData);
    if (res?.data) {
      const { access, refresh, user: userData, role_profile: roleData } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      if (roleData) {
        localStorage.setItem('role_profile', JSON.stringify(roleData));
      }
      setUser(userData);
      setRoleProfile(roleData);
      return userData;
    }
    throw new Error(res?.message || 'Registration failed.');
  };

  const logout = () => {
    try {
      authAPI.logout();
    } catch {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('role_profile');
    setUser(null);
    setRoleProfile(null);
  };

  const updateProfile = async (updateData) => {
    const res = await authAPI.updateProfile(updateData);
    if (res?.data) {
      const { user: userData, role_profile: roleData } = res.data;
      localStorage.setItem('user', JSON.stringify(userData));
      if (roleData) {
        localStorage.setItem('role_profile', JSON.stringify(roleData));
      }
      setUser(userData);
      setRoleProfile(roleData);
      return res.data;
    }
    throw new Error(res?.message || 'Profile update failed.');
  };

  const refreshProfile = async () => {
    const res = await authAPI.getProfile();
    if (res?.data?.user) {
      setUser(res.data.user);
      setRoleProfile(res.data.role_profile);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.role_profile) {
        localStorage.setItem('role_profile', JSON.stringify(res.data.role_profile));
      }
    }
  };

  const value = {
    user,
    roleProfile,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
