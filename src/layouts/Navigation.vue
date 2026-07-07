<template>
  <nav class="navigation">
    <div class="nav-container">
      <!-- Logo -->
      <div class="nav-brand">
        <router-link to="/" class="brand-link">
          <i class="fas fa-newspaper brand-icon"></i>
          <span class="brand-text">TinyMCE CMS</span>
        </router-link>
      </div>

      <!-- Navigation Menu -->
      <div class="nav-menu">
        <router-link to="/" class="nav-link">
          <i class="fas fa-home"></i>
          Home
        </router-link>
        <router-link to="/articles" class="nav-link">
          <i class="fas fa-newspaper"></i>
          Articles
        </router-link>
        <router-link to="/admin/articles" class="nav-link admin-link">
          <i class="fas fa-cog"></i>
          Admin
        </router-link>
      </div>

      <!-- Search Bar -->
      <div class="nav-search">
        <SearchBar @search="handleSearch" @clear="handleSearchClear" />
      </div>

      <!-- Auth Status & Actions -->
      <div class="nav-actions">
        <!-- Auth Status Indicator -->
        <div 
          class="auth-status" 
          :class="{ authenticated: isAuthenticated, clickable: !isAuthenticated }"
          @click="!isAuthenticated && handleAuthClick()"
          :title="isAuthenticated ? '已认证' : '点击进行认证'"
        >
          <i :class="isAuthenticated ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
          <span class="auth-text">{{ isAuthenticated ? '已认证' : '未认证' }}</span>
        </div>
        
        <!-- Auth Actions -->
        <div v-if="isAuthenticated" class="auth-actions">
          <router-link to="/password-settings" class="auth-link" title="口令设置">
            <i class="fas fa-key"></i>
          </router-link>
          <button @click="handleLogout" class="auth-link" title="退出认证">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>

  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePasswordAuth } from '@/composables/usePasswordAuth.js';
import SearchBar from '@/components/ui/SearchBar.vue';

const router = useRouter();
const { isAuthenticated, logout } = usePasswordAuth();

// Handle search
const handleSearch = (data) => {
  // Search functionality
};

// Handle search clear
const handleSearchClear = () => {
  // Clear search functionality
};

// Handle auth click (when not authenticated)
const handleAuthClick = () => {
  router.push({
    name: 'PasswordVerification',
    query: { 
      redirect: router.currentRoute.value.fullPath
    }
  });
};

// Handle logout
const handleLogout = () => {
  if (confirm('确定要退出认证吗？')) {
    logout();
    router.push('/');
  }
};
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.navigation {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
  box-sizing: border-box;
}

// Brand
.nav-brand {
  flex-shrink: 0;
  width: 20%;
  
  .brand-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: $heading-color;
    font-weight: 700;
    font-size: 1.1rem;
    transition: color 0.2s ease;
    white-space: nowrap;
    
    i {
      margin-right: 0.5rem;
    }
    
    @media (max-width: 480px) {
      font-size: 1rem;
    }
    
    &:hover {
      color: $primary-color;
    }
  }
  
  .brand-icon {
    font-size: 1.5rem;
    color: $primary-color;
  }
  
  .brand-text {
    @media (max-width: 640px) {
      display: none;
    }
  }
}

// Navigation Menu
.nav-menu {
  display: flex;
  align-items: center;
  width: 30%;
  min-width: 200px;
  justify-content: space-between;
  margin: 0 2%;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 40%;
    margin: 0 1%;
  }
  
  @media (max-width: 480px) {
    width: 50%;
    margin: 0;
  }
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.5rem;
  color: $text-color;
  text-decoration: none;
  font-weight: 500;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  margin: 0 0.25rem;
  
  &:hover {
    color: $primary-color;
    background-color: rgba($primary-color, 0.1);
  }
  
  &.router-link-active {
    color: $primary-color;
    background-color: rgba($primary-color, 0.1);
  }
  
  &.admin-link {
    color: $success-color;
    
    &:hover {
      color: color.adjust($success-color, $lightness: -10%);
      background-color: rgba($success-color, 0.1);
    }
    
    &.router-link-active {
      background-color: rgba($success-color, 0.1);
    }
  }
  
  i {
    font-size: 0.875rem;
  }
}

// Search
.nav-search {
  flex: 1 1 auto;
  min-width: 100px;
  max-width: 40%;
  margin: 0 1%;
  
  @media (max-width: 768px) {
    display: none;
  }
}

// Auth Status & Actions
.nav-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 20%;
  justify-content: flex-end;
  
  @media (max-width: 768px) {
    width: 30%;
  }
  
  @media (max-width: 480px) {
    width: 40%;
  }
}

.auth-status {
  display: flex;
  align-items: center;
  padding: 0.4rem 0.6rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  
  @media (max-width: 768px) {
    padding: 0.3rem 0.5rem;
    font-size: 0.75rem;
  }
  
  &.authenticated {
    color: #10b981;
    background-color: rgba(16, 185, 129, 0.1);
    
    i {
      color: #10b981;
    }
  }
  
  &:not(.authenticated) {
    color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
    
    i {
      color: #ef4444;
    }
  }
  
  &.clickable {
    cursor: pointer;
    user-select: none;
    
    &:hover {
      background-color: rgba(239, 68, 68, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  i {
    font-size: 1rem;
  }
}

.auth-actions {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
  
  & > * + * {
    margin-left: 0.5rem;
  }
  
  @media (max-width: 480px) {
    & > * + * {
      margin-left: 0.25rem;
    }
  }
}

.auth-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: $text-color;
  text-decoration: none;
  border: 1px solid $border-color;
  border-radius: 0.25rem;
  background: white;
  transition: all 0.2s ease;
  cursor: pointer;
  padding: 0;
  font-size: 0.8rem;
  
  @media (max-width: 768px) {
    width: 1.75rem;
    height: 1.75rem;
  }
  
  &:hover {
    color: $primary-color;
    border-color: $primary-color;
    background-color: rgba($primary-color, 0.05);
  }
  
  i {
    font-size: 0.875rem;
  }
}


// Smooth scrolling for anchor links
:deep(a[href^="#"]) {
  scroll-behavior: smooth;
}

// Focus styles for accessibility
.nav-link:focus {
  outline: 2px solid $primary-color;
  outline-offset: 2px;
}
</style>
