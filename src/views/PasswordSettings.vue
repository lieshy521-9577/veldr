<template>
  <div class="password-settings">
    <div class="container">
      <div class="page-header">
        <h1>口令设置</h1>
        <p>管理管理员和私密文章的口令</p>
      </div>
      
      <div class="settings-grid">
        <!-- 当前口令信息 -->
        <div class="settings-card">
          <div class="card-header">
            <h3>当前口令</h3>
          </div>
          <div class="card-body">
            <div class="password-info">
              <div class="password-item">
                <label>系统口令:</label>
                <div class="password-display">
                  <span class="password-mask">{{ passwordMask }}</span>
                  <button @click="togglePasswordVisibility()" class="btn btn-sm btn-outline-secondary">
                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                <div class="password-status">
                  <span class="status-text">{{ passwordStatus }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 修改口令 -->
        <div class="settings-card">
          <div class="card-header">
            <h3>修改口令</h3>
          </div>
          <div class="card-body">
            <form @submit.prevent="updatePassword">
              
              <div class="form-group">
                <label for="new-password">新口令 (6位数字):</label>
                <input
                  v-model="newPassword"
                  type="password"
                  id="new-password"
                  class="form-control"
                  maxlength="6"
                  placeholder="请输入6位数字"
                  @input="onPasswordInput"
                />
                <div class="password-dots">
                  <span 
                    v-for="i in 6" 
                    :key="i"
                    :class="['password-dot', { 'filled': newPassword.length >= i }]"
                  ></span>
                </div>
              </div>
              
              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="newPassword.length !== 6 || isUpdating"
                >
                  <i v-if="isUpdating" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-save"></i>
                  {{ isUpdating ? '更新中...' : '更新口令' }}
                </button>
                <button 
                  type="button" 
                  @click="resetPassword"
                  class="btn btn-outline-warning"
                  :disabled="isUpdating"
                >
                  <i class="fas fa-undo"></i>
                  重置为默认
                </button>
              </div>
            </form>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePasswordAuth } from '@/composables/usePasswordAuth.js';
import { useToast } from 'vue-toastification';

const { 
  getPasswordInfo, 
  setPassword, 
  resetToDefault
} = usePasswordAuth();
const toast = useToast();

const newPassword = ref('');
const isUpdating = ref(false);
const showPassword = ref(false);
const passwordInfo = ref({
  isSet: false,
  length: 0,
  isDefault: true,
  lastModified: null,
  password: null
});

// 计算属性
const passwordDisplay = computed(() => {
  if (!passwordInfo.value.isSet) {
    return '未设置';
  }
  if (passwordInfo.value.isDefault) {
    return '●●●●●●';
  }
  return '●●●●●●';
});

const passwordMask = computed(() => {
  if (showPassword.value) {
    if (!passwordInfo.value.isSet) {
      return '未设置';
    }
    if (passwordInfo.value.isDefault) {
      return '123456';
    }
    // 自定义口令显示首尾数值加中间四个点
    const password = passwordInfo.value.password || '';
    if (password.length >= 2) {
      return password[0] + '●●●●' + password[password.length - 1];
    }
  }
  return passwordDisplay.value;
});

const passwordStatus = computed(() => {
  if (!passwordInfo.value.isSet) {
    return '未设置';
  }
  return passwordInfo.value.isDefault ? '默认口令 (123456)' : '自定义口令';
});

// 监听密码输入
const onPasswordInput = () => {
  // 只允许数字
  newPassword.value = newPassword.value.replace(/\D/g, '');
};

// 切换密码显示
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 加载口令信息
const loadPasswordInfo = async () => {
  try {
    const info = await getPasswordInfo();
    passwordInfo.value = info;
    console.log('Password info loaded:', info);
  } catch (error) {
    console.error('Load password info error:', error);
    toast.error('加载口令信息失败');
  }
};

// 更新口令
const updatePassword = async () => {
  if (newPassword.value.length !== 6) {
    toast.error('请输入完整的6位数字口令');
    return;
  }
  
  try {
    isUpdating.value = true;
    await setPassword(newPassword.value);
    toast.success('口令更新成功');
    newPassword.value = '';
    // 重新加载口令信息
    await loadPasswordInfo();
  } catch (error) {
    toast.error(error.message || '更新口令失败');
  } finally {
    isUpdating.value = false;
  }
};

// 重置口令
const resetPassword = async () => {
  if (confirm('确定要将口令重置为默认值吗？')) {
    try {
      isUpdating.value = true;
      await resetToDefault();
      toast.success('口令已重置为默认值');
      // 重新加载口令信息
      await loadPasswordInfo();
    } catch (error) {
      toast.error(error.message || '重置口令失败');
    } finally {
      isUpdating.value = false;
    }
  }
};


onMounted(() => {
  // 组件挂载时加载口令信息
  loadPasswordInfo();
});
</script>

<style lang="scss" scoped>
.password-settings {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #6b7280;
    font-size: 1.125rem;
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.settings-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  &.warning-card {
    border: 1px solid #fed7aa;
    background: #fffbeb;
  }
}

.card-header {
  padding: 1.5rem 1.5rem 0;
  
  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
}

.card-body {
  padding: 1.5rem;
}

.password-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.password-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  label {
    font-weight: 500;
    color: #374151;
  }
}

.password-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.password-mask {
  font-family: 'Courier New', monospace;
  font-size: 1.25rem;
  letter-spacing: 0.25rem;
  color: #6b7280;
}

.password-status {
  margin-top: 0.5rem;
  
  .status-text {
    font-size: 0.875rem;
    color: #6b7280;
    font-style: italic;
  }
}

.form-group {
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.password-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.password-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e5e7eb;
  transition: all 0.2s ease;
  
  &.filled {
    background: #3b82f6;
    transform: scale(1.1);
  }
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &-primary {
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  }
  
  &-outline-secondary {
    color: #6b7280;
    border-color: #d1d5db;
    background: transparent;
    
    &:hover:not(:disabled) {
      background: #f9fafb;
    }
  }
  
  &-outline-warning {
    color: #f59e0b;
    border-color: #f59e0b;
    background: transparent;
    
    &:hover:not(:disabled) {
      background: #fffbeb;
    }
  }
  
  &-danger {
    background: #ef4444;
    color: white;
    
    &:hover:not(:disabled) {
      background: #dc2626;
    }
  }
  
  &-sm {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    justify-content: center;
  }
}
</style>
