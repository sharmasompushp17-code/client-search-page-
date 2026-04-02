import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);

  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if admin is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          if (response.data.success) {
            setAdmin(response.data.admin);
          } else {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (identifier, secret) => {
    // Client secret login by code + name
    if (identifier && secret && !identifier.includes('@')) {
      try {
        const response = await axios.get('/api/clients/search', {
          params: {
            clientCode: identifier.toUpperCase(),
            clientName: secret
          }
        });

        if (response.data.success) {
          const client = response.data.client;
          const fakeToken = `client-${client.clientCode}`;
          localStorage.setItem('adminToken', fakeToken);
          setToken(fakeToken);
          setAdmin({ name: client.name, clientCode: client.clientCode, role: 'client-admin' });
          return { success: true };
        }

        return { success: false, message: response.data.message || 'Client not found' };
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Client login failed' };
      }
    }

    // Existing admin email/password login fallback
    try {
      const response = await axios.post('/api/auth/login', { email: identifier, password: secret });
      
      if (response.data.success) {
        const { token: newToken, admin: adminData } = response.data;
        
        localStorage.setItem('adminToken', newToken);
        setToken(newToken);
        setAdmin(adminData);
        
        return { success: true };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setAdmin(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.put('/api/auth/updatepassword', {
        currentPassword,
        newPassword
      });
      
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password update failed'
      };
    }
  };

  const value = {
    admin,
    token,
    loading,
    login,
    logout,
    updatePassword,
    // Allow route access after login via either JWT or client code login
    isAuthenticated: !!admin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
