<template>
  <div class="password-settings">
    <div class="container">
      <div class="page-header">
        <h1>Password Settings</h1>
        <p>Manage the 6-digit password used for admin and private notes.</p>
      </div>

      <div class="settings-grid">
        <section class="settings-card">
          <div class="card-header">
            <h3>Password Status</h3>
          </div>
          <div class="card-body">
            <div class="password-item">
              <label>System password</label>
              <div class="password-display">
                <span class="password-mask">{{ passwordDisplay }}</span>
              </div>
            </div>
            <p class="status-text">{{ passwordStatus }}</p>
            <p v-if="passwordInfo.lastModified" class="status-text">
              Last changed {{ formatDate(passwordInfo.lastModified) }}
            </p>
          </div>
        </section>

        <section class="settings-card">
          <div class="card-header">
            <h3>Change Password</h3>
          </div>
          <div class="card-body">
            <form @submit.prevent="updatePassword">
              <div class="form-group">
                <label for="new-password">New password (6 digits)</label>
                <input
                  v-model="newPassword"
                  type="password"
                  id="new-password"
                  class="form-control"
                  maxlength="6"
                  inputmode="numeric"
                  placeholder="Enter 6 digits"
                  @input="onPasswordInput"
                />
                <div class="password-dots" aria-hidden="true">
                  <span
                    v-for="i in 6"
                    :key="i"
                    :class="['password-dot', { filled: newPassword.length >= i }]"
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
                  {{ isUpdating ? 'Updating...' : 'Update Password' }}
                </button>
                <button
                  type="button"
                  @click="resetPassword"
                  class="btn btn-outline-warning"
                  :disabled="isUpdating"
                >
                  <i class="fas fa-undo"></i>
                  Reset Default
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePasswordAuth } from '@/composables/usePasswordAuth.js';
import { useToast } from 'vue-toastification';

const {
  getPasswordInfo,
  setPassword,
  resetToDefault,
} = usePasswordAuth();

const toast = useToast();
const router = useRouter();

const newPassword = ref('');
const isUpdating = ref(false);
const passwordInfo = ref({
  isSet: false,
  length: 0,
  isDefault: true,
  lastModified: null,
});

const passwordDisplay = computed(() => {
  if (!passwordInfo.value.isSet) return 'Not set';
  return `${passwordInfo.value.length || 6}-digit password set`;
});

const passwordStatus = computed(() => {
  if (!passwordInfo.value.isSet) return 'No password has been configured yet.';
  return passwordInfo.value.isDefault ? 'Default password is active.' : 'Custom password is active.';
});

const onPasswordInput = () => {
  newPassword.value = newPassword.value.replace(/\D/g, '');
};

const formatDate = (value) => new Date(value).toLocaleString();

const redirectToVerification = () => {
  router.push({ name: 'PasswordVerification', query: { redirect: '/password-settings' } });
};

const loadPasswordInfo = async () => {
  try {
    passwordInfo.value = await getPasswordInfo();
  } catch (error) {
    console.error('Load password info error:', error);
    toast.error('Failed to load password information');
  }
};

const updatePassword = async () => {
  if (newPassword.value.length !== 6) {
    toast.error('Enter a complete 6-digit password');
    return;
  }

  try {
    isUpdating.value = true;
    await setPassword(newPassword.value);
    toast.success('Password updated. Please sign in again.');
    newPassword.value = '';
    redirectToVerification();
  } catch (error) {
    toast.error(error.message || 'Failed to update password');
  } finally {
    isUpdating.value = false;
  }
};

const resetPassword = async () => {
  if (!confirm('Reset the password to the default value?')) return;

  try {
    isUpdating.value = true;
    await resetToDefault();
    toast.success('Password reset to default. Please sign in again.');
    redirectToVerification();
  } catch (error) {
    toast.error(error.message || 'Failed to reset password');
  } finally {
    isUpdating.value = false;
  }
};

onMounted(loadPasswordInfo);
</script>

<style lang="scss" scoped>
.password-settings {
  min-height: 100vh;
  padding: 4rem 0;
  background:
    radial-gradient(circle at 85% 5%, var(--color-accent-soft), transparent 22rem),
    var(--color-bg);
}

.container {
  width: min(100% - 2rem, 1120px);
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;

  h1 {
    margin: 0;
    color: var(--color-heading);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(2.25rem, 5vw, 3.6rem);
    line-height: 1.05;
  }

  p {
    max-width: 40rem;
    margin: 0.75rem auto 0;
    color: var(--color-text-muted);
    font-size: 1.05rem;
    line-height: 1.7;
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

.settings-card {
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
}

.card-header {
  padding: 1.25rem 1.5rem;
  background: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border);

  h3 {
    margin: 0;
    color: var(--color-heading);
    font-size: 1.1rem;
  }
}

.card-body {
  padding: 1.5rem;
}

.password-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  label {
    color: var(--color-text);
    font-weight: 700;
  }
}

.password-display,
.form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.password-mask {
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
  font-size: 1rem;
  font-weight: 700;
}

.status-text {
  margin: 1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.55rem;
    color: var(--color-text);
    font-weight: 700;
  }
}

.form-control {
  width: 100%;
  padding: 0.8rem 0.9rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
}

.password-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.8rem;
}

.password-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 999px;
  background: var(--color-light-bg);

  &.filled {
    background: var(--color-accent);
    transform: scale(1.08);
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0.6rem 1rem;
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
  color: var(--color-text-inverse);
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.btn-outline-warning {
  color: var(--color-warning);
  background: transparent;
  border-color: rgba(245, 158, 11, 0.38);
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .password-item,
  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
