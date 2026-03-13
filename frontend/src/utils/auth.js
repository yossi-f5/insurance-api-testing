const TOKEN_KEY = 'insurance_jwt_token';
const USER_ROLE_KEY = 'insurance_user_role';
const USER_DATA_KEY = 'insurance_user_data';

import { getApiUrl } from './api.js';

const API_BASE_URL = getApiUrl('api');

const AUTH_DEBUG = import.meta.env.DEV || import.meta.env.VITE_AUTH_DEBUG === 'true';

const logAuth = (...args) => {
  if (AUTH_DEBUG) {
    console.log('[auth]', ...args);
  }
};

const parseJsonResponse = async (response, context) => {
  const contentType = response.headers.get('content-type') || 'unknown';
  const responseText = await response.text();

  logAuth(`${context} response`, {
    url: response.url,
    status: response.status,
    ok: response.ok,
    contentType,
    bodyPreview: responseText.slice(0, 300)
  });

  if (!responseText.trim()) {
    throw new Error(`${context} failed: empty response body (status ${response.status})`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(
      `${context} failed: expected JSON but got non-JSON response (status ${response.status}, content-type ${contentType})`
    );
  }
};

export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_DATA_KEY);
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) {
    return false;
  }
  
  // Basic JWT expiration check (without API call)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      console.log('🔍 Token expired locally, clearing auth');
      clearAuth();
      return false;
    }
    
    return true;
  } catch {
    console.log('🔍 Error parsing token, clearing auth');
    clearAuth();
    return false;
  }
};

export const saveUserRole = (role) => {
  localStorage.setItem(USER_ROLE_KEY, role);
};

export const getUserRole = () => {
  return localStorage.getItem(USER_ROLE_KEY) || 'user';
};

export const isAdmin = () => {
  return getUserRole() === 'admin';
};

export const clearAuth = () => {
  removeToken();
};

// New functions for backend integration
export const registerUser = async (username, password) => {
  try {
    const url = `${API_BASE_URL}/auth/register`;
    logAuth('register request', { url, username });

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await parseJsonResponse(response, 'Registration');

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    // Save token and user data (same as login)
    saveToken(data.token);
    saveUserRole(data.user.role);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (username, password) => {
  try {
    const url = `${API_BASE_URL}/auth/login`;
    logAuth('login request', { url, username });

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await parseJsonResponse(response, 'Login');

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Save token and user data
    saveToken(data.token);
    saveUserRole(data.user.role);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const url = `${API_BASE_URL}/auth/profile`;
    logAuth('profile request', { url });

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await parseJsonResponse(response, 'Profile');

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get profile');
    }
    
    // Update stored user data
    saveUserRole(data.user.role);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
};

export const validateToken = async () => {
  try {
    const token = getToken();
    if (!token) {
      return false;
    }

    // Try to get user profile to validate token
    await getUserProfile();
    return true;
  } catch (error) {
    console.log('🔍 Token validation failed:', error.message);
    
    // If token is expired or invalid, clear it and return false
    if (error.message.includes('Token expired') || 
        error.message.includes('Invalid token') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('401')) {
      console.log('🔍 Clearing expired/invalid token');
      clearAuth();
    }
    return false;
  }
};

export const getUserData = () => {
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
};

// Utility function for testing - manually expire the current token
export const expireTokenForTesting = () => {
  const token = getToken();
  if (!token) {
    console.log('🔍 No token to expire');
    return;
  }
  
  try {
    // Decode the token
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    // Create a new payload with expired timestamp
    const expiredPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    };
    
    // Re-encode the token (this is just for testing, not a real JWT)
    const expiredToken = parts[0] + '.' + btoa(JSON.stringify(expiredPayload)) + '.' + parts[2];
    
    // Save the expired token
    localStorage.setItem(TOKEN_KEY, expiredToken);
    console.log('🔍 Token manually expired for testing');
  } catch (error) {
    console.error('🔍 Error expiring token:', error);
  }
}; 