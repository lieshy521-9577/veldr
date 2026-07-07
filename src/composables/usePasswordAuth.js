import { ref, computed } from 'vue';

/**
 * 口令验证 composable
 * 管理六位数字口令的存储、验证和清除
 */
export function usePasswordAuth() {
  // API 基础URL
  const API_BASE = '/api';
  
  // localStorage 键名
  const STORAGE_KEYS = {
    AUTHENTICATED: 'cms_authenticated',
    TOKEN: 'cms_token'
  };
  
  // 响应式状态
  const isAuthenticated = ref(false);
  
  // 从 localStorage 初始化状态
  const initializeAuth = () => {
    isAuthenticated.value = localStorage.getItem(STORAGE_KEYS.AUTHENTICATED) === 'true';
  };
  
  // 监听 localStorage 变化
  const handleStorageChange = (e) => {
    if (e.key === STORAGE_KEYS.AUTHENTICATED) {
      isAuthenticated.value = e.newValue === 'true';
    }
  };
  
  // 监听自定义认证状态变化事件
  const handleAuthStateChange = () => {
    isAuthenticated.value = localStorage.getItem(STORAGE_KEYS.AUTHENTICATED) === 'true';
  };
  
  // 初始化
  initializeAuth();
  
  // 添加全局监听器
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChange);
  }
  
  /**
   * 验证口令
   * @param {string} password - 输入的口令
   * @returns {Promise<boolean>} 验证结果
   */
  const verifyPassword = async (password) => {
    try {
      const response = await fetch(`${API_BASE}/password/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 设置认证状态和令牌
        isAuthenticated.value = true;
        localStorage.setItem(STORAGE_KEYS.AUTHENTICATED, 'true');
        if (data.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        }
        // 触发自定义事件通知其他组件
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('authStateChanged'));
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };
  
  /**
   * 设置口令
   * @param {string} password - 新口令
   */
  const setPassword = async (password) => {
    if (password.length !== 6 || !/^\d{6}$/.test(password)) {
      throw new Error('口令必须是六位数字');
    }
    
    try {
      const response = await fetch(`${API_BASE}/password/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '更新口令失败');
      }
      
      return data;
    } catch (error) {
      console.error('Set password error:', error);
      throw error;
    }
  };
  
  /**
   * 获取口令信息
   * @returns {Promise<Object>} 口令信息
   */
  const getPasswordInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/password/info`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '获取口令信息失败');
      }
      console.log('Password info loaded-----------:', data);
      return data.data;
    } catch (error) {
      console.error('Get password info error:', error);
      throw error;
    }
  };
  
  /**
   * 清除认证状态
   */
  const clearAuth = () => {
    isAuthenticated.value = false;
    localStorage.removeItem(STORAGE_KEYS.AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    // 触发自定义事件通知其他组件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }
  };
  
  /**
   * 清除所有口令和认证状态
   */
  const clearAllPasswords = async () => {
    try {
      const response = await fetch(`${API_BASE}/password/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 清除本地认证状态
        isAuthenticated.value = false;
        localStorage.removeItem(STORAGE_KEYS.AUTHENTICATED);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        // 触发自定义事件通知其他组件
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('authStateChanged'));
        }
      }
      
      return data;
    } catch (error) {
      console.error('Clear password error:', error);
      throw error;
    }
  };
  
  /**
   * 重置为默认口令
   */
  const resetToDefault = async () => {
    try {
      const response = await fetch(`${API_BASE}/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '重置口令失败');
      }
      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };
  
  /**
   * 检查是否需要验证
   * @returns {boolean} 是否需要验证
   */
  const needsVerification = () => {
    return !isAuthenticated.value;
  };
  
  /**
   * 登出（清除认证状态但保留口令）
   */
  const logout = () => {
    clearAuth();
  };
  
  return {
    // 状态
    isAuthenticated,
    
    // 方法
    verifyPassword,
    setPassword,
    getPasswordInfo,
    clearAuth,
    clearAllPasswords,
    resetToDefault,
    needsVerification,
    logout,
    
    // 常量
    STORAGE_KEYS
  };
}
