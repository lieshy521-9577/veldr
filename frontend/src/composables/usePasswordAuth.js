import { ref } from 'vue';
import { apiFetch, parseApiResponse, clearLocalAuthState } from '@/utils/apiClient.js';

const API_BASE = '/api';
const STORAGE_KEYS = {
  AUTHENTICATED: 'cms_authenticated',
};

export function usePasswordAuth() {
  const isAuthenticated = ref(false);

  const initializeAuth = () => {
    isAuthenticated.value = localStorage.getItem(STORAGE_KEYS.AUTHENTICATED) === 'true';
  };

  const handleStorageChange = (event) => {
    if (event.key === STORAGE_KEYS.AUTHENTICATED) {
      isAuthenticated.value = event.newValue === 'true';
    }
  };

  const handleAuthStateChange = () => {
    initializeAuth();
  };

  initializeAuth();

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChange);
  }

  const markAuthenticated = () => {
    isAuthenticated.value = true;
    localStorage.setItem(STORAGE_KEYS.AUTHENTICATED, 'true');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }
  };

  const verifyPassword = async (password) => {
    try {
      const response = await apiFetch(`${API_BASE}/password/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (data.success) {
        markAuthenticated();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  const setPassword = async (password) => {
    if (password.length !== 6 || !/^\d{6}$/.test(password)) {
      throw new Error('Password must be 6 digits');
    }

    const response = await apiFetch(`${API_BASE}/password/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await parseApiResponse(response);
    clearAuth();
    return data;
  };

  const getPasswordInfo = async () => {
    const response = await apiFetch(`${API_BASE}/password/info`);
    const data = await parseApiResponse(response);
    return data.data;
  };

  const clearAuth = () => {
    isAuthenticated.value = false;
    clearLocalAuthState();
  };

  const clearAllPasswords = async () => {
    const response = await apiFetch(`${API_BASE}/password/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await parseApiResponse(response);
    clearAuth();
    return data;
  };

  const resetToDefault = async () => {
    const response = await apiFetch(`${API_BASE}/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await parseApiResponse(response);
    clearAuth();
    return data;
  };

  const needsVerification = () => !isAuthenticated.value;

  const logout = async () => {
    try {
      await apiFetch(`${API_BASE}/password/logout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  return {
    isAuthenticated,
    verifyPassword,
    setPassword,
    getPasswordInfo,
    clearAuth,
    clearAllPasswords,
    resetToDefault,
    needsVerification,
    logout,
    STORAGE_KEYS,
  };
}
