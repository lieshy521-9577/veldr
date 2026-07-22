<template>
  <div class="admin-layout">
    <button class="mobile-menu-toggle" @click="toggleSidebar">
      <i class="fas fa-bars"></i>
    </button>
    <aside class="admin-sidebar" :class="{ 'is-collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <h2>CMS Admin</h2>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/admin/articles" class="nav-item">
          <i class="fas fa-newspaper"></i>
          <span>Articles</span>
        </router-link>
        <router-link to="/admin/articles/create" class="nav-item nav-item--new">
          <i class="fas fa-plus-circle"></i>
          <span>New Article</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button @click="handleLogout" class="nav-item nav-item--logout">
          <i class="fas fa-sign-out-alt"></i>
          <span>退出管理</span>
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

const router = useRouter();
const { logout } = usePasswordAuth();
const isSidebarCollapsed = ref(false);
const isMobile = ref(false);

// Toggle sidebar on mobile
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// Check if mobile view
const checkIfMobile = () => {
  isMobile.value = window.innerWidth < 768;
  isSidebarCollapsed.value = isMobile.value;
};

// Add event listener for window resize
onMounted(() => {
  checkIfMobile();
  window.addEventListener('resize', checkIfMobile);
});

// Clean up event listener
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkIfMobile);
});

// Handle logout
const handleLogout = () => {
  if (confirm('确定要退出认证吗？')) {
    logout();
    router.push('/');
  }
};
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
}

.admin-sidebar {
  width: 250px;
  background-color: #2c3e50;
  color: white;
  padding: 1.5rem 0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: fixed;
  height: 100vh;
  z-index: 100;
  overflow-y: auto;
  
  @media (max-width: 767px) {
    display: none; /* Hide sidebar completely on mobile */
  }
  
  @media (min-width: 768px) and (max-width: 1023px) {
    width: 220px;
  }
}

.sidebar-header {
  padding: 0 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.75rem;
  flex: 1;
}

.sidebar-footer {
  padding: 0 0.75rem;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 0.375rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &.router-link-active {
    background-color: #3498db;
    color: white;
    font-weight: 500;
  }

  &--new {
    margin-top: 1rem;
    background-color: rgba(46, 204, 113, 0.1);
    color: #2ecc71;
    
    &:hover {
      background-color: rgba(46, 204, 113, 0.2);
      color: #2ecc71;
    }
  }
  
  &--logout {
    background-color: rgba(231, 76, 60, 0.1);
    color: #e74c3c;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    
    &:hover {
      background-color: rgba(231, 76, 60, 0.2);
      color: #e74c3c;
    }
  }

  i {
    width: 20px;
    text-align: center;
  }
}

.admin-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  margin-left: 0;
  width: 100%;
  transition: margin-left 0.3s ease, width 0.3s ease;
  
  @media (min-width: 768px) {
    margin-left: 250px;
    width: calc(100% - 250px);
  }
  
  @media (min-width: 768px) and (max-width: 1023px) {
    margin-left: 220px;
    width: calc(100% - 220px);
  }
  
  @media (max-width: 767px) {
    padding: 1rem;
  }
}

// Mobile menu toggle button
.mobile-menu-toggle {
  display: none; /* Hide menu toggle button on all screens by default */
  
  /* Only show on larger screens if you want to keep the toggle for other purposes */
  @media (min-width: 768px) {
    display: none;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
  }
}

// Overlay for mobile when sidebar is open
.overlay {
  display: none; /* Hide overlay on all screens */
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
