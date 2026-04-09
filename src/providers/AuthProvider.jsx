import React, { useState, useEffect, useCallback } from 'react';
import AuthContext from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = 'https://smart-attendance-system-backend-r2o0.onrender.com/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Test backend connection on startup
  useEffect(() => {
    const testConnection = async () => {
      try {
        await axios.get('http://localhost:5000/api/test');
        console.log('✅ Backend connection successful');
      } catch (error) {
        console.error('❌ Cannot connect to backend:', error.message);
        console.log('⚠️ Make sure backend is running on port 5000');
      }
    };
    testConnection();
  }, []);

  // Define logout using useCallback
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setUserType(null);
    delete axiosInstance.defaults.headers.common['Authorization'];
  }, []);

  // Set axios default header
  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on token change
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axiosInstance.get('/auth/me');
          setCurrentUser(response.data.user);
          setUserType(response.data.user.role);
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token, logout]);

  const login = async (email, password, role) => {
    try {
      console.log('Login request payload:', { email, password: '***', role });
      
      const response = await axiosInstance.post('/auth/login', {
        email: email?.trim()?.toLowerCase(),
        password: password?.trim(),
        role: role?.trim()
      });

      console.log('Login response:', response.data);

      const { token: newToken, user } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(user);
      setUserType(user.role);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });

      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        return { 
          success: false, 
          error: 'Cannot connect to server. Please make sure the backend is running on port 5000.' 
        };
      }

      if (error.response) {
        const errorMessage = error.response.data?.error || 
                            error.response.data?.message || 
                            `Server error: ${error.response.status}`;
        return { success: false, error: errorMessage };
      } else if (error.request) {
        return { success: false, error: 'No response from server. Please check your network connection.' };
      } else {
        return { success: false, error: error.message };
      }
    }
  };

  const registerStudent = async (formData) => {
    try {
      console.log('Registering student with FormData');
      
      // Log FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'faceImage' ? 'File: ' + pair[1].name : pair[1]));
      }

      const response = await axiosInstance.post('/auth/register/student', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Registration response:', response.data);

      const { token: newToken, user } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(user);
      setUserType(user.role);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });
      
      let errorMessage = 'Registration failed';
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 5000.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const registerFaculty = async (formData) => {
    try {
      console.log('Registering faculty with data:', formData);

      const response = await axiosInstance.post('/auth/register/faculty', formData);

      console.log('Registration response:', response.data);

      const { token: newToken, user } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(user);
      setUserType(user.role);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });
      
      let errorMessage = 'Registration failed';
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 5000.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const value = {
    currentUser,
    userType,
    loading,
    login,
    logout,
    registerStudent,
    registerFaculty,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};