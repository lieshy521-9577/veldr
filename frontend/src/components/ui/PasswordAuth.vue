<template>
  <div class="password-auth-overlay">
    <div class="password-auth-modal">
      <div class="password-auth-header">
        <i class="fas fa-lock"></i>
        <h2>Password Required</h2>
        <p class="password-auth-subtitle">
          Enter the 6-digit password to access protected notes.
        </p>
      </div>

      <div class="password-auth-body">
        <div class="password-input-container">
          <input
            ref="passwordInput"
            v-model="password"
            type="password"
            maxlength="6"
            inputmode="numeric"
            class="password-input"
            placeholder="000000"
            @input="onPasswordInput"
            @keyup.enter="handleSubmit"
            :disabled="isVerifying"
          />
          <div class="password-dots" aria-hidden="true">
            <span
              v-for="i in 6"
              :key="i"
              :class="['password-dot', { filled: password.length >= i }]"
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
            {{ isVerifying ? 'Verifying...' : 'Verify' }}
          </button>

          <button
            @click="handleClear"
            class="btn btn-outline-secondary"
            :disabled="isVerifying"
          >
            <i class="fas fa-eraser"></i>
            Clear
          </button>
        </div>

        <div class="password-auth-footer">
          <button
            @click="handleLogout"
            class="btn btn-link"
            :disabled="isVerifying"
          >
            <i class="fas fa-arrow-left"></i>
            Back home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { usePasswordAuth } from '@/composables/usePasswordAuth.js';

const emit = defineEmits(['success', 'cancel']);
const { verifyPassword, clearAllPasswords } = usePasswordAuth();

const password = ref('');
const isVerifying = ref(false);
const errorMessage = ref('');
const passwordInput = ref(null);

onMounted(() => {
  nextTick(() => passwordInput.value?.focus());
});

const onPasswordInput = () => {
  password.value = password.value.replace(/\D/g, '');
  if (errorMessage.value) {
    errorMessage.value = '';
  }
};

const handleSubmit = async () => {
  if (password.value.length !== 6) {
    errorMessage.value = 'Enter the complete 6-digit password.';
    return;
  }

  try {
    isVerifying.value = true;
    errorMessage.value = '';

    const isValid = await verifyPassword(password.value);

    if (isValid) {
      emit('success');
    } else {
      errorMessage.value = 'Incorrect password. Please try again.';
      password.value = '';
      nextTick(() => passwordInput.value?.focus());
    }
  } catch (error) {
    console.error('Password verification error:', error);
    errorMessage.value = 'Verification failed. Please try again.';
  } finally {
    isVerifying.value = false;
  }
};

const handleClear = () => {
  password.value = '';
  errorMessage.value = '';
  nextTick(() => passwordInput.value?.focus());
};

const handleLogout = () => {
  clearAllPasswords();
  emit('cancel');
};
</script>

<style lang="scss" scoped>
.password-auth-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(8, 17, 28, 0.72);
  backdrop-filter: blur(10px);
}

.password-auth-modal {
  width: min(100%, 26rem);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
  animation: modalSlideIn 0.25s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.password-auth-header {
  padding: 2rem;
  text-align: center;
  background: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border);

  i {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    margin-bottom: 1rem;
    color: var(--color-accent);
    background: var(--color-accent-soft);
    border-radius: 999px;
  }

  h2 {
    margin: 0;
    color: var(--color-heading);
    font-size: 1.45rem;
  }
}

.password-auth-subtitle {
  margin: 0.55rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.password-auth-body {
  padding: 1.5rem;
}

.password-input-container {
  margin-bottom: 1.25rem;
}

.password-input {
  width: 100%;
  padding: 0.9rem;
  color: var(--color-heading);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-family: var(--font-family-mono);
  font-size: 1.35rem;
  letter-spacing: 0.45rem;
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.password-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.password-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 999px;
  background: var(--color-light-bg);

  &.filled {
    background: var(--color-accent);
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  color: var(--color-danger);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.24);
  border-radius: var(--border-radius);
  font-size: 0.88rem;
}

.password-auth-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.password-auth-footer {
  padding-top: 1rem;
  text-align: center;
  border-top: 1px solid var(--color-border);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.65rem;
  padding: 0.65rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 800;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.btn-primary {
  flex: 1;
  color: var(--color-text-inverse);
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.btn-outline-secondary {
  color: var(--color-text);
  background: transparent;
  border-color: var(--color-border);
}

.btn-link {
  min-height: 2rem;
  padding: 0.4rem;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;

  &:hover:not(:disabled) {
    color: var(--color-accent);
  }
}

@media (max-width: 480px) {
  .password-auth-actions {
    flex-direction: column;
  }
}
</style>
