<template>
  <div class="search-bar">
    <div class="search-container">
      <div class="search-input-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          v-model="searchQuery"
          @input="handleSearch"
          @keydown.enter="performSearch"
          type="text"
          placeholder="Search articles..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="clear-button"
          type="button"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <button
        @click="performSearch"
        class="search-button"
        type="button"
        :disabled="!searchQuery.trim()"
      >
        Search
      </button>
    </div>
    
    <!-- Search Results Dropdown -->
    <div v-if="showResults && searchResults.length > 0" class="search-results">
      <div class="search-results-header">
        <span class="results-count">{{ searchResults.length }} result(s) found</span>
        <button @click="closeResults" class="close-results">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="search-results-list">
        <div
          v-for="article in searchResults"
          :key="article.id"
          @click="selectArticle(article)"
          class="search-result-item"
        >
          <div class="result-title">{{ article.title }}</div>
          <div class="result-excerpt" v-if="article.excerpt">
            {{ truncateText(article.excerpt, 100) }}
          </div>
          <div class="result-meta">
            <span class="result-date">{{ formatDate(article.createdAt) }}</span>
            <span class="result-status" :class="`status-${article.status}`">
              {{ article.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Results -->
    <div v-if="showResults && searchResults.length === 0 && hasSearched" class="no-results">
      <div class="no-results-content">
        <i class="fas fa-search no-results-icon"></i>
        <h3>No articles found</h3>
        <p>Try adjusting your search terms or browse all articles.</p>
        <button @click="viewAllArticles" class="btn btn-outline-primary">
          View All Articles
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';

const router = useRouter();

const searchQuery = ref('');
const searchResults = ref([]);
const showResults = ref(false);
const hasSearched = ref(false);
const searchTimeout = ref(null);

// Emit events to parent component
const emit = defineEmits(['search', 'clear']);

// Format date for display
const formatDate = (dateString) => {
  return format(new Date(dateString), 'MMM d, yyyy');
};

// Truncate text for display
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Handle search input
const handleSearch = () => {
  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  // Set new timeout for debounced search
  searchTimeout.value = setTimeout(() => {
    if (searchQuery.value.trim().length >= 2) {
      performSearch();
    } else {
      clearSearch();
    }
  }, 300);
};

// Perform search
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    clearSearch();
    return;
  }
  
  try {
    const response = await fetch(`/api/articles?search=${encodeURIComponent(searchQuery.value)}&status=published`);
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    const data = await response.json();
    
    if (data.success) {
      searchResults.value = data.data;
      showResults.value = true;
      hasSearched.value = true;
      emit('search', { query: searchQuery.value, results: data.data });
    } else {
      throw new Error(data.message || 'Search failed');
    }
  } catch (error) {
    console.error('Search error:', error);
    searchResults.value = [];
    showResults.value = true;
    hasSearched.value = true;
  }
};

// Clear search
const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  showResults.value = false;
  hasSearched.value = false;
  emit('clear');
};

// Close results dropdown
const closeResults = () => {
  showResults.value = false;
};

// Select article from search results
const selectArticle = (article) => {
  router.push(`/article/${article.slug}`);
  closeResults();
};

// View all articles
const viewAllArticles = () => {
  router.push('/#articles');
  closeResults();
};

// Handle clicks outside search bar
const handleClickOutside = (event) => {
  if (!event.target.closest('.search-bar')) {
    showResults.value = false;
  }
};

// Watch for route changes to close results
watch(() => router.currentRoute.value.path, () => {
  showResults.value = false;
});

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.search-bar {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.search-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: $text-muted;
  font-size: 0.875rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 1rem;
  line-height: 1.5;
  color: $text-color;
  background-color: white;
  border: 2px solid $border-color;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
  
  &::placeholder {
    color: $text-muted;
  }
}

.clear-button {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: $text-muted;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    color: $text-color;
    background-color: $light-bg;
  }
}

.search-button {
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  color: white;
  background-color: $primary-color;
  border: 2px solid $primary-color;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: color.adjust($primary-color, $lightness: -10%);
    border-color: color.adjust($primary-color, $lightness: -10%);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid $border-color;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: $light-bg;
  border-bottom: 1px solid $border-color;
}

.results-count {
  font-size: 0.875rem;
  color: $text-muted;
  font-weight: 500;
}

.close-results {
  background: none;
  border: none;
  color: $text-muted;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    color: $text-color;
    background-color: rgba($text-color, 0.1);
  }
}

.search-results-list {
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  padding: 1rem;
  border-bottom: 1px solid $border-color;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: $light-bg;
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.result-title {
  font-weight: 600;
  color: $heading-color;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.result-excerpt {
  color: $text-muted;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.result-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.result-date {
  color: $text-muted;
}

.result-status {
  padding: 0.125rem 0.5rem;
  border-radius: 0.75rem;
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

.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid $border-color;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.no-results-content {
  padding: 2rem;
  text-align: center;
  
  .no-results-icon {
    font-size: 2rem;
    color: $text-muted;
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1.125rem;
    color: $heading-color;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: $text-muted;
    margin-bottom: 1.5rem;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-weight: 500;
  line-height: 1.5;
  color: $primary-color;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  border: 1px solid $primary-color;
  border-radius: 0.375rem;
  transition: all 0.15s ease-in-out;
  
  &-outline-primary {
    &:hover {
      background-color: rgba($primary-color, 0.1);
      color: $primary-color;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .search-container {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .search-button {
    width: 100%;
  }
  
  .search-results {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 50vh;
    border-radius: 0.5rem 0.5rem 0 0;
  }
}
</style>
