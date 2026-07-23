<template>
  <div class="admin-layout">
    <button class="mobile-menu-toggle" type="button" aria-label="Open admin menu" @click="toggleSidebar">
      <i class="fas fa-bars"></i>
    </button>

    <aside class="admin-sidebar" :class="{ 'is-collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <router-link to="/" class="admin-brand" title="Back to Home">
          <h2>Veldr Admin</h2>
          <p>Write and organize</p>
        </router-link>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/admin/articles" class="nav-item">
          <i class="fas fa-newspaper"></i>
          <span>Notes</span>
        </router-link>
        <router-link to="/admin/articles/create" class="nav-item nav-item--new">
          <i class="fas fa-plus-circle"></i>
          <span>New Note</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button @click="handleLogout" class="nav-item nav-item--logout">
          <i class="fas fa-sign-out-alt"></i>
          <span>Log out</span>
        </button>
      </div>
    </aside>

    <div class="overlay" :class="{ 'is-visible': !isSidebarCollapsed && isMobile }" @click="toggleSidebar"></div>

    <main class="admin-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { usePasswordAuth } from '@/composables/usePasswordAuth.js';
import { useTheme } from '@/composables/useTheme.js';

const router = useRouter();
const { logout } = usePasswordAuth();
useTheme();

const isSidebarCollapsed = ref(false);
const isMobile = ref(false);

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const checkIfMobile = () => {
  isMobile.value = window.innerWidth < 768;
  isSidebarCollapsed.value = isMobile.value;
};

onMounted(() => {
  checkIfMobile();
  window.addEventListener('resize', checkIfMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkIfMobile);
});

const handleLogout = async () => {
  if (confirm('Log out of admin?')) {
    await logout();
    router.push('/');
  }
};
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, var(--color-accent-soft), transparent 24rem),
    var(--color-bg);
  position: relative;
}

.admin-sidebar {
  width: 250px;
  height: 100vh;
  padding: 1.5rem 0;
  position: fixed;
  z-index: 100;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  color: white;
  background-color: var(--color-sidebar-bg);
  box-shadow: 1px 0 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.3s ease;

  @media (min-width: 768px) and (max-width: 1023px) {
    width: 220px;
  }

  @media (max-width: 767px) {
    transform: translateX(-100%);

    &:not(.is-collapsed) {
      transform: translateX(0);
    }
  }
}

.sidebar-header {
  padding: 0 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 1.5rem;
}

.admin-brand {
  display: block;
  color: inherit;
  text-decoration: none;
  border-radius: var(--border-radius);
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover,
  &:focus-visible {
    transform: translateX(2px);
    outline: none;

    h2 {
      color: var(--accent-strong);
    }

    p {
      color: rgba(255, 255, 255, 0.82);
    }
  }

  h2 {
    margin: 0;
    color: #ffffff;
    font-size: 1.22rem;
    font-weight: 800;
    transition: color 0.2s ease;
  }

  p {
    margin: 0.35rem 0 0;
    color: rgba(255, 255, 255, 0.62);
    font-size: 0.82rem;
    transition: color 0.2s ease;
  }
}

.sidebar-nav,
.sidebar-footer {
  padding: 0 0.75rem;
}

.sidebar-nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  background: transparent;
  border: 0;
  border-radius: var(--border-radius);
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: var(--color-sidebar-hover);
    color: white;
  }

  &.router-link-active {
    background-color: var(--color-sidebar-active);
    color: white;
    font-weight: 700;
  }

  &--new {
    margin-top: 0.75rem;
    background-color: rgba(16, 185, 129, 0.12);
    color: #6ee7b7;

    &:hover {
      background-color: rgba(16, 185, 129, 0.2);
      color: #a7f3d0;
    }
  }

  &--logout {
    background-color: rgba(239, 68, 68, 0.1);
    color: #fca5a5;

    &:hover {
      background-color: rgba(239, 68, 68, 0.18);
      color: #fecaca;
    }
  }

  i {
    width: 20px;
    text-align: center;
  }
}

.admin-main {
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: 2rem;
  margin-left: 0;
  overflow-y: auto;

  @media (min-width: 768px) {
    width: calc(100% - 250px);
    margin-left: 250px;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    width: calc(100% - 220px);
    margin-left: 220px;
  }

  @media (max-width: 767px) {
    padding: 4.25rem 1rem 1rem;
  }
}

.mobile-menu-toggle {
  display: none;

  @media (max-width: 767px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 120;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-heading);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-card);
  }
}

.overlay {
  display: none;

  &.is-visible {
    @media (max-width: 767px) {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 90;
      background: rgba(15, 23, 42, 0.38);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
