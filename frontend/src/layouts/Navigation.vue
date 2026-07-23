<template>
  <nav class="navigation">
    <div class="nav-container">
      <div class="nav-brand">
        <router-link to="/" class="brand-link" aria-label="Veldr home">
          <i class="fas fa-seedling brand-icon"></i>
          <span class="brand-text">Veldr</span>
        </router-link>
      </div>

      <div class="nav-menu">
        <router-link to="/" class="nav-link">
          <i class="fas fa-home"></i>
          <span>Notes Home</span>
        </router-link>
        <router-link to="/articles" class="nav-link">
          <i class="fas fa-lock"></i>
          <span>Private Notes</span>
        </router-link>
        <router-link to="/admin/articles" class="nav-link admin-link">
          <i class="fas fa-pen"></i>
          <span>Write</span>
        </router-link>
      </div>

      <div class="nav-search">
        <SearchBar @search="handleSearch" @clear="handleSearchClear" />
      </div>

      <div class="nav-actions">
        <div class="theme-control" aria-label="Theme controls">
          <span class="theme-label">
            <i class="fas fa-palette"></i>
            <span>Theme</span>
          </span>
          <div class="theme-swatches">
            <button
              v-for="option in accentOptions"
              :key="option.value"
              class="theme-swatch"
              :class="[`theme-swatch--${option.value}`, { active: accent === option.value }]"
              type="button"
              :title="`Use ${option.label} accent`"
              :aria-label="`Use ${option.label} accent`"
              @click="setAccent(option.value)"
            ></button>
          </div>
          <button
            class="mode-toggle theme-icon-button"
            type="button"
            :title="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
            :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="toggleMode"
          >
            <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
          </button>
        </div>

        <div
          class="auth-status"
          :class="{ authenticated: isAuthenticated, clickable: !isAuthenticated }"
          :title="isAuthenticated ? 'Authenticated' : 'Verify password'"
          @click="!isAuthenticated && handleAuthClick()"
        >
          <i :class="isAuthenticated ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
          <span class="auth-text">{{ isAuthenticated ? 'Verified' : 'Locked' }}</span>
        </div>

        <div v-if="isAuthenticated" class="auth-actions">
          <router-link to="/password-settings" class="auth-link theme-icon-button" title="Password settings">
            <i class="fas fa-key"></i>
          </router-link>
          <button @click="handleLogout" class="auth-link theme-icon-button" title="Log out">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { usePasswordAuth } from '@/composables/usePasswordAuth.js';
import { useTheme } from '@/composables/useTheme.js';
import SearchBar from '@/components/ui/SearchBar.vue';

const router = useRouter();
const { isAuthenticated, logout } = usePasswordAuth();
const { accent, isDark, setAccent, toggleMode } = useTheme();

const accentOptions = [
  { value: 'teal', label: 'Teal' },
  { value: 'rose', label: 'Rose' },
  { value: 'amber', label: 'Amber' },
  { value: 'ink', label: 'Ink' }
];

const handleSearch = () => {};
const handleSearchClear = () => {};

const handleAuthClick = () => {
  router.push({
    name: 'PasswordVerification',
    query: {
      redirect: router.currentRoute.value.fullPath
    }
  });
};

const handleLogout = async () => {
  if (confirm('Log out of this writing session?')) {
    await logout();
    router.push('/');
  }
};
</script>

<style lang="scss" scoped>
.navigation {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--color-nav-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(16px);
}

.nav-container {
  width: 100%;
  max-width: 1280px;
  min-height: 4.5rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-sizing: border-box;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--color-heading);
  font-size: 1.35rem;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-accent);
  }
}

.brand-icon {
  color: var(--color-accent);
  font-size: 1.35rem;
}

.nav-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin: 0 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.8rem;
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.94rem;
  font-weight: 600;
  border-radius: var(--border-radius);
  white-space: nowrap;
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover,
  &.router-link-active {
    color: var(--color-accent);
    background-color: var(--color-accent-soft);
  }

  &.admin-link {
    color: var(--color-success);

    &:hover,
    &.router-link-active {
      color: var(--color-success);
      background-color: rgba(16, 185, 129, 0.1);
    }
  }

  &:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
}

.nav-search {
  flex: 1 1 260px;
  max-width: 360px;
  margin-left: auto;
}

.nav-actions,
.theme-control,
.theme-swatches,
.auth-actions {
  display: flex;
  align-items: center;
}

.nav-actions {
  flex-shrink: 0;
  justify-content: flex-end;
  gap: 0.65rem;
}

.theme-control {
  gap: 0.5rem;
  min-height: 2.35rem;
  padding: 0.26rem 0.34rem 0.26rem 0.58rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0)),
    var(--color-surface);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.theme-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding-right: 0.15rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-text-muted);

  i {
    color: var(--color-accent);
    font-size: 0.78rem;
  }
}

.theme-swatches {
  gap: 0.32rem;
}

.theme-swatch,
.theme-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.82rem;
  height: 1.82rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
}

.theme-swatch {
  position: relative;
  border-color: color-mix(in srgb, var(--swatch-color) 36%, var(--color-border));
  background: color-mix(in srgb, var(--swatch-color) 10%, var(--color-surface));

  &::before {
    content: '';
    width: 1.12rem;
    height: 1.12rem;
    border-radius: 999px;
    background: var(--swatch-color);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.18),
      0 1px 2px rgba(15, 23, 42, 0.16);
  }

  &.active {
    border-color: var(--swatch-color);
    background: color-mix(in srgb, var(--swatch-color) 16%, var(--color-surface));
    box-shadow:
      0 0 0 2px var(--color-nav-bg),
      0 0 0 4px color-mix(in srgb, var(--swatch-color) 88%, transparent);

    &::after {
      content: '';
      position: absolute;
      inset: 0.47rem;
      border-radius: 999px;
      border: 1.5px solid rgba(255, 255, 255, 0.78);
      pointer-events: none;
    }
  }

  &--teal { --swatch-color: #087f95; }
  &--rose { --swatch-color: #c23b58; }
  &--amber { --swatch-color: #b76d16; }
  &--ink { --swatch-color: #1e293b; }
}

.mode-toggle {
  margin-left: 0.08rem;
  box-shadow: -0.5rem 0 0 -0.46rem var(--color-border);
}

.auth-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 7rem;
  min-height: 2.2rem;
  padding: 0.45rem 0.72rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;

  &.authenticated {
    color: var(--color-success);
    background-color: rgba(16, 185, 129, 0.1);
  }

  &:not(.authenticated) {
    color: var(--color-danger);
    background-color: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.14);
  }

  &.clickable {
    cursor: pointer;
    user-select: none;

    &:hover {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
    }
  }
}

.auth-actions {
  gap: 0.45rem;
}

.auth-link {
  padding: 0;
  font-size: 0.8rem;
  text-decoration: none;
}

:deep(a[href^="#"]) {
  scroll-behavior: smooth;
}

@media (max-width: 1080px) {
  .nav-container {
    flex-wrap: wrap;
    padding: 0.75rem 1rem;
  }

  .nav-search {
    order: 4;
    flex-basis: 100%;
    max-width: none;
    margin-left: 0;
  }

  .theme-label {
    display: none;
  }
}

@media (max-width: 720px) {
  .nav-menu {
    order: 3;
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
    margin: 0;
  }

  .nav-actions {
    margin-left: auto;
  }

  .auth-text {
    display: none;
  }
}

@media (max-width: 520px) {
  .brand-text {
    display: none;
  }

  .theme-control {
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .theme-swatches {
    display: none;
  }
}
</style>
