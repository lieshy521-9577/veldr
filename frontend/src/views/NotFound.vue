<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Page not found</h2>
      <p class="error-description">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <div class="error-actions">
        <router-link to="/" class="home-button">
          <svg class="button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Go back home
        </router-link>
      </div>
      
      <div class="admin-link-section">
        <p class="admin-text">
          Looking for the admin panel? 
          <router-link to="/admin" class="admin-link">
            Click here to login
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

// Set the document title
onMounted(() => {
  document.title = 'Page Not Found | Specms';
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.not-found-page {
  min-height: 100vh;
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem 1.5rem;
  
  @media (min-width: 640px) {
    padding: 3rem 1.5rem;
  }
  
  @media (min-width: 1024px) {
    padding: 3rem 2rem;
  }
}

.not-found-container {
  margin: 0 auto;
  width: 100%;
  max-width: 28rem;
  text-align: center;
  
  @media (min-width: 640px) {
    margin: 0 auto;
    width: 100%;
    max-width: 28rem;
  }
}

.error-code {
  font-size: 6rem;
  font-weight: 700;
  color: #4f46e5;
  margin: 0;
  line-height: 1;
  
  @media (max-width: 640px) {
    font-size: 4rem;
  }
}

.error-title {
  margin-top: 0.75rem;
  font-size: 3rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0;
  
  @media (max-width: 640px) {
    font-size: 2rem;
  }
}

.error-description {
  margin-top: 1rem;
  font-size: 1.125rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 0;
}

.error-actions {
  margin-top: 2rem;
}

.home-button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  color: white;
  background-color: #4f46e5;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #4338ca;
    color: white;
    text-decoration: none;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.5);
  }
  
  .button-icon {
    margin-left: -0.25rem;
    margin-right: 0.5rem;
    height: 1.25rem;
    width: 1.25rem;
  }
}

.admin-link-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.admin-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.admin-link {
  font-weight: 500;
  color: #4f46e5;
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: #4338ca;
    text-decoration: underline;
  }
}
</style>
