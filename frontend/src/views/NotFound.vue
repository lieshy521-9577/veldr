<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <p class="error-code">404</p>
      <h1 class="error-title">Page not found</h1>
      <p class="error-description">
        This note or page may have been moved, deleted, or never existed.
      </p>
      <div class="error-actions">
        <router-link to="/" class="home-button">
          <i class="fas fa-arrow-left"></i>
          Back to notes
        </router-link>
      </div>

      <div class="admin-link-section">
        <p class="admin-text">
          Looking for the writing desk?
          <router-link to="/admin/articles" class="admin-link">
            Open admin
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  document.title = 'Page Not Found | Veldr';
});
</script>

<style lang="scss" scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background:
    radial-gradient(circle at 70% 24%, var(--color-accent-soft), transparent 18rem),
    var(--color-bg);
}

.not-found-container {
  width: min(100%, 32rem);
  text-align: center;
}

.error-code {
  margin: 0;
  color: var(--color-accent);
  font-size: clamp(5rem, 18vw, 8rem);
  font-weight: 900;
  line-height: 0.9;
}

.error-title {
  margin: 1rem 0 0;
  color: var(--color-heading);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 8vw, 3.4rem);
  line-height: 1.05;
}

.error-description {
  margin: 1rem 0 0;
  color: var(--color-text-muted);
  font-size: 1.08rem;
  line-height: 1.65;
}

.error-actions {
  margin-top: 2rem;
}

.home-button {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.75rem;
  padding: 0.75rem 1.15rem;
  color: var(--color-text-inverse);
  background: var(--color-accent);
  border-radius: var(--border-radius);
  font-weight: 800;
  text-decoration: none;
}

.admin-link-section {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.admin-text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.admin-link {
  color: var(--color-accent);
  font-weight: 800;
  text-decoration: none;
}
</style>
