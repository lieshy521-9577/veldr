<template>
  <div id="app">
    <!-- Navigation -->
    <Navigation />
    
    <!-- Main Content -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
    </main>
    
    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-container">
        <p class="footer-text">
          &copy; 2023 Specms. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import Navigation from '@/layouts/Navigation.vue';
</script>

<style lang="scss">
@use 'assets/styles/main.scss';

#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
}

.app-footer {
  background-color: white;
  
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
    margin-top: 2rem;
    text-align: center;
    font-size: 1rem;
    color: #9ca3af;
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
