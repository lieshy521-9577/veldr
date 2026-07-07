<template>
  <div class="password-auth-overlay">
    <div class="password-auth-modal">
      <div class="password-auth-header">
        <h2>安全验证</h2>
        <p class="password-auth-subtitle">
          请输入口令以访问受保护的页面
        </p>
      </div>
      
      <div class="password-auth-body">
        <div class="password-input-container">
          <input
            ref="passwordInput"
            v-model="password"
            type="password"
            maxlength="6"
            class="password-input"
            placeholder="请输入六位数字"
            @input="onPasswordInput"
            @keyup.enter="handleSubmit"
            :disabled="isVerifying"
          />
          <div class="password-dots">
            <span 
              v-for="i in 6" 
              :key="i"
              :class="['password-dot', { 'filled': password.length >= i }]"
            ></span>
          </div>
        </div>
        
        <div v-if="errorMessage" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ errorMessage }}
        </div>
        
        <div class="password-auth-actions">
          <button 
            @click="handleSubmit"
            class="btn btn-primary"
            :disabled="password.length !== 6 || isVerifying"
          >
            <i v-if="isVerifying" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-unlock"></i>
            {{ isVerifying ? '验证中...' : '验证' }}
          </button>
          
          <button 
            @click="handleClear"
            class="btn btn-outline-secondary"
            :disabled="isVerifying"
          >
            <i class="fas fa-eraser"></i>
            清除
          </button>
        </div>
        
        <div class="password-auth-footer">
          <button 
            @click="handleLogout"
            class="btn btn-link"
            :disabled="isVerifying"
          >
            <i class="fas fa-sign-out-alt"></i>
            退出
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { usePasswordAuth } from '@/composables/usePasswordAuth.js';

const emit = defineEmits(['success', 'cancel']);

const { verifyPassword, clearAllPasswords } = usePasswordAuth();

const password = ref('');
const isVerifying = ref(false);
const errorMessage = ref('');
const passwordInput = ref(null);

// 自动聚焦到输入框
onMounted(() => {
  nextTick(() => {
    if (passwordInput.value) {
      passwordInput.value.focus();
    }
  });
});

// 监听密码输入
const onPasswordInput = () => {
  // 只允许数字
  password.value = password.value.replace(/\D/g, '');
  // 清除错误信息
  if (errorMessage.value) {
    errorMessage.value = '';
  }
};

// 处理提交
const handleSubmit = async () => {
  if (password.value.length !== 6) {
    errorMessage.value = '请输入完整的六位数字口令';
    return;
  }
  
  try {
    isVerifying.value = true;
    errorMessage.value = '';
    
    const isValid = await verifyPassword(password.value);
    
    if (isValid) {
      emit('success');
    } else {
      errorMessage.value = '口令错误，请重新输入';
      password.value = '';
      // 重新聚焦
      nextTick(() => {
        if (passwordInput.value) {
          passwordInput.value.focus();
        }
      });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    errorMessage.value = '验证失败，请重试';
  } finally {
    isVerifying.value = false;
  }
};

// 清除输入
const handleClear = () => {
  password.value = '';
  errorMessage.value = '';
  nextTick(() => {
    if (passwordInput.value) {
      passwordInput.value.focus();
    }
  });
};

// 退出
const handleLogout = () => {
  clearAllPasswords();
  emit('cancel');
};
</script>

<style lang="scss" scoped>
.password-auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.password-auth-modal {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.password-auth-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  
  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .password-auth-subtitle {
    margin: 0;
    opacity: 0.9;
    font-size: 0.875rem;
  }
}

.password-auth-body {
  padding: 2rem;
}

.password-input-container {
  position: relative;
  margin-bottom: 1.5rem;
}

.password-input {
  width: 100%;
  padding: 1rem;
  font-size: 1.5rem;
  text-align: center;
  letter-spacing: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.password-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.password-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e5e7eb;
  transition: all 0.2s ease;
  
  &.filled {
    background: #667eea;
    transform: scale(1.1);
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  
  i {
    font-size: 0.75rem;
  }
}

.password-auth-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.password-auth-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    flex: 1;
    
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  }
  
  &-outline-secondary {
    color: #6b7280;
    border-color: #d1d5db;
    background: transparent;
    
    &:hover:not(:disabled) {
      background: #f9fafb;
      color: #374151;
    }
  }
  
  &-link {
    color: #6b7280;
    background: transparent;
    border: none;
    padding: 0.5rem;
    font-size: 0.875rem;
    
    &:hover:not(:disabled) {
      color: #ef4444;
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .password-auth-modal {
    margin: 1rem;
    width: calc(100% - 2rem);
  }
  
  .password-auth-header,
  .password-auth-body {
    padding: 1.5rem;
  }
  
  .password-auth-actions {
    flex-direction: column;
  }
}
</style>
