<template>
  <div id="app">
    <Navigation v-if="$route.meta?.layout !== 'admin' && $route.meta?.layout !== 'minimal'" />
    
    <!-- Main Content -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
    </main>
    
    <footer v-if="$route.meta?.layout !== 'admin' && $route.meta?.layout !== 'minimal'" class="app-footer">
      <div class="footer-container">
        <p class="footer-text">
          &copy; 2026 Veldr. Private notes, calmly kept.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import Navigation from '@/layouts/Navigation.vue';
import { useTheme } from '@/composables/useTheme.js';

useTheme();
</script>

<style lang="scss">
@use 'assets/styles/main.scss';

#app {
  font-family: var(--font-family-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
}

.app-main {
  flex: 1;
}

.app-footer {
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  
  .footer-container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 2rem 1rem;
    overflow: hidden;
    
    @media (min-width: 640px) {
      padding: 2rem 1.5rem;
    }
    
    @media (min-width: 1024px) {
      padding: 2rem 2rem;
    }
  }
  
  .footer-text {
    text-align: center;
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
