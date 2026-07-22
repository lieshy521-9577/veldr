<template>
  <div class="private-articles">
    <div class="container">
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">Private Articles</h1>
            <p class="page-subtitle">Exclusive content for members only</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="articles-loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading private articles...</p>
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
          <i class="fas fa-lock empty-icon"></i>
          <h3>No private articles yet</h3>
          <p>Private articles will appear here when they are created.</p>
          <router-link to="/admin/articles/create" class="btn btn-primary">
            <i class="fas fa-plus"></i>
            Create Private Article
          </router-link>
        </div>
      </div>

      <!-- Articles Grid -->
      <div v-else class="articles-grid">
        <article 
          v-for="article in articles" 
          :key="article.id" 
          class="article-card private-card"
        >
          <div class="article-image" v-if="article.featuredImage">
            <LazyImage 
              :src="`/uploads/${article.featuredImage}`" 
              :alt="article.title"
              :lazy="true"
            />
            <div class="private-overlay">
              <i class="fas fa-lock"></i>
            </div>
          </div>
          <div class="article-content">
            <div class="article-meta">
              <time :datetime="article.createdAt" class="article-date">
                {{ formatDate(article.createdAt) }}
              </time>
              <span class="article-status status-private">
                <i class="fas fa-lock"></i>
                Private
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import LazyImage from '@/components/ui/LazyImage.vue';

const router = useRouter();

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

// Fetch private articles
const fetchArticles = async (page = 1, append = false) => {
  try {
    if (page === 1) {
      loading.value = true;
      error.value = null;
    } else {
      loadingMore.value = true;
    }

    const response = await fetch(`/api/articles?page=${page}&limit=${pageSize}&status=private`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch private articles');
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
      throw new Error(data.message || 'Failed to load private articles');
    }
  } catch (err) {
    console.error('Error fetching private articles:', err);
    error.value = 'Failed to load private articles. Please try again later.';
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

.private-articles {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem 0;
}

.container {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (min-width: 640px) {
    padding: 0 1.5rem;
  }
  
  @media (min-width: 1024px) {
    padding: 0 2rem;
  }
}

.page-header {
  margin-bottom: 3rem;
  
  .header-content {
    text-align: center;
    
    @media (min-width: 768px) {
      text-align: left;
    }
  }
  
  .page-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: $heading-color;
    margin-bottom: 0.5rem;
  }
  
  .page-subtitle {
    font-size: 1.125rem;
    color: $text-muted;
    margin: 0;
  }
}

.articles-loading {
  text-align: center;
  padding: 3rem 0;
  
  .spinner-border {
    width: 3rem;
    height: 3rem;
    border-width: 0.3em;
  }
  
  p {
    color: $text-muted;
    margin-top: 1rem;
  }
}

.articles-error {
  .alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    color: #dc2626;
    
    i {
      font-size: 1.125rem;
    }
  }
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
      font-weight: 600;
      color: $heading-color;
      margin-bottom: 0.5rem;
    }
    
    p {
      color: $text-muted;
      margin-bottom: 2rem;
    }
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.article-card {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
  
  &.private-card {
    border-left: 4px solid $warning-color;
  }
}

.article-image {
  position: relative;
  height: 200px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .private-overlay {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background-color: rgba($warning-color, 0.9);
    color: white;
    padding: 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    
    i {
      margin-right: 0.25rem;
    }
  }
  
  &:hover img {
    transform: scale(1.05);
  }
}

.article-content {
  padding: 1.5rem;
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  
  .article-date {
    font-size: 0.875rem;
    color: $text-muted;
  }
  
  .article-status {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    
    &.status-private {
      background-color: rgba($warning-color, 0.1);
      color: $warning-color;
    }
  }
}

.article-title {
  margin-bottom: 0.75rem;
  
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
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: color.adjust($primary-color, $lightness: -10%);
    }
    
    i {
      font-size: 0.875rem;
      transition: transform 0.2s ease;
    }
    
    &:hover i {
      transform: translateX(2px);
    }
  }
}

.load-more {
  text-align: center;
  margin-top: 2rem;
  
  .btn {
    padding: 0.75rem 2rem;
    font-weight: 500;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  vertical-align: -0.125em;
  border: 0.2em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
  
  &-sm {
    width: 0.875rem;
    height: 0.875rem;
    border-width: 0.15em;
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
