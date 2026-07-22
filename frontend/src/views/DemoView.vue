<template>
  <div class="demo-view">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">Welcome to TinyMCE CMS</h1>
          <p class="hero-subtitle">
            A modern, responsive content management system built with Vue.js and TinyMCE editor.
            Create, edit, and manage your content with ease.
          </p>
          <div class="hero-actions">
            <router-link to="/admin" class="btn btn-primary btn-lg">
              <i class="fas fa-cog"></i>
              Admin Panel
            </router-link>
            <router-link to="/articles" class="btn btn-outline-primary btn-lg">
              <i class="fas fa-lock"></i>
              Private Articles
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Articles Section -->
    <section id="articles" class="articles-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Latest Articles</h2>
          <p class="section-subtitle">Discover our latest content and insights</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="articles-loading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">Loading articles...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="articles-error">
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i>
            {{ error }}
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="articles.length === 0" class="articles-empty">
          <div class="empty-state">
            <i class="fas fa-newspaper empty-icon"></i>
            <h3>No articles yet</h3>
            <p>Be the first to create an article!</p>
            <router-link to="/admin/articles/create" class="btn btn-primary">
              <i class="fas fa-plus"></i>
              Create First Article
            </router-link>
          </div>
        </div>

        <!-- Articles Grid -->
        <div v-else class="articles-grid">
          <article 
            v-for="article in articles" 
            :key="article.id" 
            class="article-card"
          >
            <div class="article-image" v-if="article.featuredImage">
              <LazyImage 
                :src="`/uploads/${article.featuredImage}`" 
                :alt="article.title"
                :lazy="true"
              />
            </div>
            <div class="article-content">
              <div class="article-meta">
                <time :datetime="article.createdAt" class="article-date">
                  {{ formatDate(article.createdAt) }}
                </time>
                <span class="article-status" :class="`status-${article.status}`">
                  {{ article.status }}
                </span>
              </div>
              <h3 class="article-title">
                <router-link :to="`/article/${article.slug}`">
                  {{ article.title }}
                </router-link>
              </h3>
              <p class="article-excerpt" v-if="article.excerpt">
                {{ article.excerpt }}
              </p>
              <div class="article-footer">
                <router-link 
                  :to="`/article/${article.slug}`" 
                  class="article-link"
                >
                  Read More
                  <i class="fas fa-arrow-right"></i>
                </router-link>
              </div>
            </div>
          </article>
        </div>

        <!-- Load More Button -->
        <div v-if="articles.length > 0 && hasMore" class="load-more">
          <button 
            @click="loadMore" 
            :disabled="loadingMore"
            class="btn btn-outline-primary"
          >
            <span v-if="loadingMore" class="spinner-border spinner-border-sm me-2"></span>
            Load More Articles
          </button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Why Choose Our CMS?</h2>
          <p class="section-subtitle">Powerful features for modern content management</p>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-edit"></i>
            </div>
            <h3 class="feature-title">Rich Text Editor</h3>
            <p class="feature-description">
              Powered by TinyMCE, create beautiful content with advanced formatting options.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-mobile-alt"></i>
            </div>
            <h3 class="feature-title">Responsive Design</h3>
            <p class="feature-description">
              Your content looks great on all devices with our responsive design system.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-image"></i>
            </div>
            <h3 class="feature-title">Media Management</h3>
            <p class="feature-description">
              Upload and manage images, videos, and other media files with ease.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-search"></i>
            </div>
            <h3 class="feature-title">SEO Friendly</h3>
            <p class="feature-description">
              Built with SEO best practices to help your content rank better in search engines.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { format } from 'date-fns';
import LazyImage from '@/components/ui/LazyImage.vue';

const articles = ref([]);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref(null);
const hasMore = ref(false);
const currentPage = ref(1);
const pageSize = 6;

// Format date for display
const formatDate = (dateString) => {
  return format(new Date(dateString), 'MMM d, yyyy');
};

// Fetch articles
const fetchArticles = async (page = 1, append = false) => {
  try {
    if (page === 1) {
      loading.value = true;
      error.value = null;
    } else {
      loadingMore.value = true;
    }

    const response = await fetch(`/api/articles?page=${page}&limit=${pageSize}&status=published`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch articles');
    }

    const data = await response.json();
    
    if (data.success) {
      if (append) {
        articles.value = [...articles.value, ...data.data];
      } else {
        articles.value = data.data;
      }
      
      hasMore.value = data.data.length === pageSize;
      currentPage.value = page;
    } else {
      throw new Error(data.message || 'Failed to load articles');
    }
  } catch (err) {
    console.error('Error fetching articles:', err);
    error.value = 'Failed to load articles. Please try again later.';
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// Load more articles
const loadMore = () => {
  fetchArticles(currentPage.value + 1, true);
};

// Fetch articles on component mount
onMounted(() => {
  fetchArticles();
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.demo-view {
  min-height: 100vh;
}

// Hero Section
.hero-section {
  background: linear-gradient(135deg, $primary-color 0%, color.adjust($primary-color, $lightness: -20%) 100%);
  color: white;
  padding: 6rem 0;
  text-align: center;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .hero-title {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    line-height: 1.2;
    
    @media (max-width: 768px) {
      font-size: 2.5rem;
    }
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2.5rem;
    opacity: 0.9;
    line-height: 1.6;
    
    @media (max-width: 768px) {
      font-size: 1.125rem;
    }
  }
  
  .hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    
    .btn {
      min-width: 160px;
    }
  }
}

// Articles Section
.articles-section {
  padding: 5rem 0;
  background-color: $bg-color;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .section-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .section-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: $heading-color;
    margin-bottom: 1rem;
  }
  
  .section-subtitle {
    font-size: 1.125rem;
    color: $text-muted;
    max-width: 600px;
    margin: 0 auto;
  }
}

// Loading States
.articles-loading {
  text-align: center;
  padding: 3rem 0;
  
  .spinner-border {
    width: 3rem;
    height: 3rem;
  }
}

.articles-error {
  text-align: center;
  padding: 3rem 0;
}

.articles-empty {
  text-align: center;
  padding: 4rem 0;
  
  .empty-state {
    .empty-icon {
      font-size: 4rem;
      color: $text-muted;
      margin-bottom: 1.5rem;
    }
    
    h3 {
      font-size: 1.5rem;
      color: $heading-color;
      margin-bottom: 0.5rem;
    }
    
    p {
      color: $text-muted;
      margin-bottom: 2rem;
    }
  }
}

// Articles Grid
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.article-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  .article-image {
    width: 100%;
    height: 200px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
  }
  
  &:hover .article-image img {
    transform: scale(1.05);
  }
  
  .article-content {
    padding: 1.5rem;
  }
  
  .article-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .article-date {
    color: $text-muted;
  }
  
  .article-status {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    
    &.status-published {
      background-color: rgba($success-color, 0.1);
      color: $success-color;
    }
    
    &.status-draft {
      background-color: rgba($warning-color, 0.1);
      color: $warning-color;
    }
  }
  
  .article-title {
    margin-bottom: 1rem;
    
    a {
      color: $heading-color;
      text-decoration: none;
      font-size: 1.25rem;
      font-weight: 600;
      line-height: 1.4;
      transition: color 0.2s ease;
      
      &:hover {
        color: $primary-color;
      }
    }
  }
  
  .article-excerpt {
    color: $text-muted;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .article-footer {
    .article-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: $primary-color;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
      
      &:hover {
        color: color.adjust($primary-color, $lightness: -10%);
      }
    }
  }
}

// Load More
.load-more {
  text-align: center;
  margin-top: 3rem;
}

// Features Section
.features-section {
  padding: 5rem 0;
  background: white;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .section-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .section-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: $heading-color;
    margin-bottom: 1rem;
  }
  
  .section-subtitle {
    font-size: 1.125rem;
    color: $text-muted;
    max-width: 600px;
    margin: 0 auto;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  text-align: center;
  padding: 2rem 1.5rem;
  
  .feature-icon {
    width: 4rem;
    height: 4rem;
    background: linear-gradient(135deg, $primary-color, color.adjust($primary-color, $lightness: -10%));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    
    i {
      font-size: 1.5rem;
      color: white;
    }
  }
  
  .feature-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: $heading-color;
    margin-bottom: 1rem;
  }
  
  .feature-description {
    color: $text-muted;
    line-height: 1.6;
  }
}

// Utility Classes
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  line-height: 1.5;
  color: white;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  background-color: $primary-color;
  border: 1px solid $primary-color;
  border-radius: 0.5rem;
  transition: all 0.15s ease-in-out;
  
  &:hover {
    background-color: color.adjust($primary-color, $lightness: -10%);
    border-color: color.adjust($primary-color, $lightness: -10%);
    color: white;
    text-decoration: none;
  }
  
  &-outline-primary {
    background-color: transparent;
    color: $primary-color;
    
    &:hover {
      background-color: rgba($primary-color, 0.1);
      color: $primary-color;
    }
  }
  
  &-lg {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }
  
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}

.alert {
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  
  &-danger {
    color: #842029;
    background-color: #f8d7da;
    border-color: #f5c2c7;
  }
}

.spinner-border {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  vertical-align: -0.125em;
  border: 0.25em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
  
  &-sm {
    width: 1rem;
    height: 1rem;
    border-width: 0.2em;
  }
}

@keyframes spinner-border {
  to { transform: rotate(360deg); }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.me-2 {
  margin-right: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}
</style>
