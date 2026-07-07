<template>
  <div class="article-view">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-skeleton">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-subtitle"></div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-5-6"></div>
          <div class="skeleton-line skeleton-line-2-3"></div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <div class="error-alert">
        <div class="error-content">
          <div class="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="error-message">
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
      <div class="error-actions">
        <router-link to="/" class="back-link">
          ← Back to articles
        </router-link>
      </div>
    </div>

    <!-- Article content -->
    <article v-else class="article-container">
      <header class="article-header">
        <div class="article-meta">
          <time :datetime="article.createdAt">{{ formatDate(article.createdAt) }}</time>
          <span class="meta-separator">•</span>
          <span>{{ readingTime }} min read</span>
        </div>
        <h1 class="article-title">{{ article.title }}</h1>
        
        <div v-if="article.excerpt" class="article-excerpt">
          {{ article.excerpt }}
        </div>
        
        <div v-if="article.featuredImage" class="featured-image-container">
          <img :src="article.featuredImage" :alt="article.title" class="featured-image" style="max-height: 30vh;min-height: 17vh; width: fit-content; aspect-ratio: 16/9;">
        </div>
      </header>

      <div class="article-content" v-html="article.content"></div>

      <footer class="article-footer">
        <div class="footer-content">
          <div class="footer-info">
            <div>
              <p class="publish-date">
                Published on {{ formatFullDate(article.publishedAt || article.createdAt) }}
              </p>
              <p v-if="article.updatedAt !== article.createdAt" class="update-date">
                Updated on {{ formatFullDate(article.updatedAt) }}
              </p>
            </div>
          </div>
          <router-link to="/" class="back-link">
            ← Back to articles
          </router-link>
        </div>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const article = ref({});
const loading = ref(true);
const error = ref(null);

// Format date to a readable format (e.g., "January 1, 2023")
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Format full date with time
const formatFullDate = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Calculate reading time
const readingTime = computed(() => {
  if (!article.value.content) return 0;
  
  // Remove HTML tags and count words
  const text = article.value.content.replace(/<[^>]*>/g, ' ');
  const wordCount = text.trim().split(/\s+/).length;
  
  // Average reading speed is about 200-250 words per minute
  return Math.ceil(wordCount / 200);
});

// Fetch article by ID or slug
const fetchArticle = async () => {
  const { id, slug } = route.params;
  const key = id ?? slug;
  if (!key) return;

  try {
    loading.value = true;
    error.value = null;
    
    let url = `/api/articles/${key}`;
    
    // If not UUID, treat as slug
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(key))) {
      url = `/api/articles/slug/${key}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Article not found');
      }
      throw new Error('Failed to fetch article');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Check if article is accessible (published or private)
      if (data.data.status === 'draft') {
        throw new Error('Article not found');
      }
      
      // Prepend the base URL to featured images
      article.value = {
        ...data.data,
        featuredImage: data.data.featuredImage ? `/uploads/${data.data.featuredImage}` : null
      };
      
      // Update the document title
      document.title = `${article.value.title} | Specms`;
      
      // Update meta description if excerpt is available
      if (article.value.excerpt) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', article.value.excerpt);
        }
      }
    } else {
      throw new Error(data.message || 'Failed to load article');
    }
  } catch (err) {
    console.error('Error fetching article:', err);
    error.value = 'Failed to load article. It may have been moved or deleted.';
  } finally {
    loading.value = false;
  }
};

// Watch for route changes to load new articles when navigating between them
watch(
  () => route.params.id,
  () => {
    fetchArticle();
  }
);

// Fetch article when the component is mounted
onMounted(() => {
  fetchArticle();
});
</script>

<style lang="scss">
// 文章视图样式
.article-view {
  background-color: #f9fafb;
  min-height: 100vh;
}

// 加载状态
.loading-container {
  max-width: 56rem;
  margin: 0 auto;
  padding: 3rem 1rem;
}

.loading-skeleton {
  .skeleton-line {
    background-color: #e5e7eb;
    border-radius: 0.375rem;
    height: 1rem;
    margin-bottom: 1.5rem;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    
    &.skeleton-title {
      height: 2rem;
      width: 75%;
    }
    
    &.skeleton-subtitle {
      height: 1rem;
      width: 50%;
      margin-bottom: 2rem;
    }
    
    &.skeleton-line-5-6 {
      width: 83.333333%;
    }
    
    &.skeleton-line-2-3 {
      width: 66.666667%;
    }
  }
  
  .skeleton-content {
    .skeleton-line:not(:last-child) {
      margin-bottom: 1rem;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 错误状态
.error-container {
  max-width: 56rem;
  margin: 0 auto;
  padding: 3rem 1rem;
}

.error-alert {
  background-color: #fef2f2;
  border-left: 4px solid #f87171;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.error-content {
  display: flex;
  
  .error-icon {
    flex-shrink: 0;
    
    svg {
      height: 1.25rem;
      width: 1.25rem;
      color: #f87171;
    }
  }
  
  .error-message {
    margin-left: 0.75rem;
    
    p {
      font-size: 0.875rem;
      color: #b91c1c;
    }
  }
}

.error-actions {
  text-align: center;
}

// 文章容器
.article-container {
  max-width: 56rem;
  margin: 0 auto;
  padding: 3rem 1rem;
}

.article-header {
  margin-bottom: 2.5rem;
}

.article-meta {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
  
  .meta-separator {
    margin: 0 0.5rem;
  }
}

.article-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.article-excerpt {
  margin-top: 1rem;
  font-size: 1.25rem;
  color: #6b7280;
  line-height: 1.6;
}

.featured-image-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.featured-image {
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  height: auto;
  object-fit: cover;
}

.article-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-info {
  display: flex;
  align-items: center;
  
  .publish-date {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
  }
  
  .update-date {
    font-size: 0.875rem;
    color: #6b7280;
  }
}

.back-link {
  color: #4f46e5;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: #3730a3;
    text-decoration: underline;
  }
}

// 文章内容样式
.article-content {
  max-width: 88vw !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

.article-content :deep(h1) {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  margin-top: 2rem;
  color: #111827;
}

.article-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  margin-top: 2rem;
  color: #1f2937;
}

.article-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  margin-top: 1.5rem;
  color: #1f2937;
}

.article-content :deep(h4) {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
  color: #1f2937;
}

.article-content :deep(p) {
  margin-bottom: 1.5rem;
  line-height: 1.625;
  color: #374151;
  font-size: 1rem;
}

.article-content :deep(a) {
  color: #4f46e5;
  text-decoration: underline;
}

.article-content :deep(a:hover) {
  color: #3730a3;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

.article-content :deep(ul) {
  list-style-type: disc;
}

.article-content :deep(ol) {
  list-style-type: decimal;
}

.article-content :deep(li) {
  margin-bottom: 0.5rem;
}

.article-content :deep(blockquote) {
  border-left: 4px solid #d1d5db;
  padding-left: 1rem;
  font-style: italic;
  margin: 1.5rem 0;
  color: #6b7280;
  quotes: '\201C''\201D''\2018''\2019';
}

.article-content :deep(blockquote p) {
  margin-bottom: 0;
}

.article-content :deep(img) {
  margin: 2rem 0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  width: 100%;
  height: auto;
  max-height: 50vh;
  object-fit: cover;
}

.article-content :deep(figure) {
  margin: 2rem 0;
}

.article-content :deep(figcaption) {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.article-content :deep(table) {
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 2rem 0;
}

.article-content :deep(th) {
  padding: 0.75rem 1.5rem;
  background-color: #f9fafb;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.article-content :deep(td) {
  padding: 1rem 1.5rem;
  white-space: normal;
  font-size: 0.875rem;
  color: #111827;
  border-top: 1px solid #e5e7eb;
}

.article-content :deep(tr:nth-child(even)) {
  background-color: #f9fafb;
}

.article-content :deep(tr:hover) {
  background-color: #f3f4f6;
}

.article-content :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  color: #dc2626;
}

.article-content :deep(pre) {
  background-color: #111827;
  color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1.5rem 0;
  overflow-x: auto;
  font-size: 0.875rem;
}

.article-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #f3f4f6;
}

.article-content :deep(hr) {
  margin: 2rem 0;
  border-top: 1px solid #e5e7eb;
}

.article-content :deep(.table-container) {
  overflow-x: auto;
  margin-left: -1rem;
  margin-right: -1rem;
}

@media (min-width: 640px) {
  .article-content :deep(.table-container) {
    margin-left: 0;
    margin-right: 0;
  }
}

.article-content :deep(.responsive-table) {
  min-width: 100%;
}

/* Responsive images */
.article-content :deep(p img) {
  max-width: 100%;
  height: auto;
}

/* Lists */
.article-content :deep(ul > li > ul) {
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.article-content :deep(ol > li > ol) {
  margin-top: 0.5rem;
  margin-bottom: 0;
}

/* Nested lists */
.article-content :deep(ul ul, ol ul) {
  padding-left: 1.5rem;
  margin-top: 0.5rem;
}

.article-content :deep(ol ol, ul ol) {
  padding-left: 1.5rem;
  margin-top: 0.5rem;
}
</style>

