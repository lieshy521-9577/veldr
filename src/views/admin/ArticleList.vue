<template>
  <div class="article-list">
    <div class="page-header">
      <div class="header-content">
        <h1>文章管理</h1>
        <div class="header-actions">
          <div class="stats">
            <span class="stat-item">
              <i class="fas fa-file-alt text-primary"></i>
              <span>{{ articles.length }} 篇文章</span>
            </span>
            <span class="stat-item">
              <i class="fas fa-eye text-success"></i>
              <span>{{ publishedCount }} 已发布</span>
            </span>
          </div>
          <router-link to="/admin/articles/create" class="btn btn-primary">
            <i class="fas fa-plus"></i> 新建文章
          </router-link>
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :article-title="articleToDelete?.title || ''"
      :is-deleting="isDeleting !== null"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="articles.length === 0" class="text-center py-4">
          <p class="text-muted">No articles found.</p>
          <router-link to="/admin/articles/create" class="btn btn-primary mt-2">
            Create your first article
          </router-link>
        </div>

        <div v-else>
          <!-- Search and Filter Bar -->
          <div class="search-filter-bar">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="搜索文章标题或别名..."
                class="search-input"
              />
            </div>
            <div class="filter-controls">
              <select v-model="statusFilter" class="status-filter">
                <option value="">所有状态</option>
                <option value="draft">草稿</option>
                <option value="private">私有</option>
                <option value="published">已发布</option>
              </select>
              <button @click="refreshArticles" class="btn btn-outline-secondary btn-sm">
                <i class="fas fa-sync-alt"></i> 刷新
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>文章信息</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
              <tr v-for="article in filteredArticles" :key="article.id" :data-article-id="article.id">
                <td>
                  <div class="article-info">
                    <div class="article-title">
                      <span class="fw-semibold">{{ article.title }}</span>
                    </div>
                    <div class="article-meta">
                      <span class="text-muted small">/{{ article.slug }}</span>
                      <span v-if="article.excerpt" class="excerpt">{{ article.excerpt }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span 
                    :class="['badge', 'status-toggle', getStatusClass(article.status)]"
                    @click="toggleStatus(article)"
                    :disabled="isTogglingStatus === article.id"
                    :title="`点击切换状态: ${getStatusLabel(article.status)} → ${getNextStatusLabel(article.status)}`"
                  >
                    <i v-if="isTogglingStatus === article.id" class="fas fa-spinner fa-spin me-1"></i>
                    <i v-else :class="getStatusIcon(article.status)" class="me-1"></i>
                    {{ getStatusLabel(article.status) }}
                  </span>
                </td>
                <td>
                  <div class="date-info">
                    <div class="created-date">{{ formatDate(article.createdAt) }}</div>
                    <div class="text-muted small">
                      <i class="fas fa-clock me-1"></i>
                      更新于 {{ formatTimeAgo(article.updatedAt) }}
                    </div>
                  </div>
                </td>
                <td class="text-nowrap">
                  <div class="action-buttons">
                    <router-link 
                      v-if="article && article.id"
                      :to="{ name: 'ArticleEdit', params: { id: article.id } }" 
                      class="btn btn-sm btn-outline-primary me-1"
                      title="编辑文章"
                    >
                      <i class="fas fa-edit"></i>
                    </router-link>
                    <button 
                      v-else 
                      class="btn btn-sm btn-outline-primary me-1" 
                      disabled
                      title="无法编辑"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button 
                      @click="deleteArticle(article.id)" 
                      class="btn btn-sm btn-outline-danger"
                      :disabled="isDeleting === article.id"
                      title="删除文章"
                    >
                      <i v-if="isDeleting === article.id" class="fas fa-spinner fa-spin"></i>
                      <i v-else class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { useToast } from 'vue-toastification';
import { useArticleStore } from '@/stores/articleStore.js';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal.vue';

const router = useRouter();
const toast = useToast();
const articleStore = useArticleStore();

// Use store state - 确保获取响应式引用
const articles = computed(() => articleStore.articles);
const loading = computed(() => articleStore.loading);
const error = computed(() => articleStore.error);

// 计算属性
const publishedCount = computed(() => {
  return articles.value.filter(article => article.status === 'published').length;
});

// 过滤后的文章列表
const filteredArticles = computed(() => {
  let filtered = articles.value || [];
  
  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(article => 
      article.title?.toLowerCase().includes(query) ||
      article.slug?.toLowerCase().includes(query) ||
      article.excerpt?.toLowerCase().includes(query)
    );
  }
  
  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(article => article.status === statusFilter.value);
  }
  
  return filtered;
});

// Local state for delete operation
const isDeleting = ref(null);
const showDeleteModal = ref(false);
const articleToDelete = ref(null);

// Local state for status toggle operation
const isTogglingStatus = ref(null);

// Search and filter state
const searchQuery = ref('');
const statusFilter = ref('');

// Fetch articles
const fetchArticles = async () => {
  try {
    await articleStore.fetchArticles();
  } catch (err) {
    toast.error('Failed to load articles');
  }
};

// Refresh articles
const refreshArticles = async () => {
  try {
    await fetchArticles();
    toast.success('文章列表已刷新');
  } catch (err) {
    toast.error('刷新失败');
  }
};

// Delete article - show confirmation modal
const deleteArticle = (id) => {
  // 确保 articles.value 存在且是数组
  if (!articles.value || !Array.isArray(articles.value)) {
    console.error('Articles data is not available:', articles.value);
    toast.error('Unable to delete article: data not loaded');
    return;
  }
  
  const article = articles.value.find(a => a && a.id === id);
  if (!article) {
    console.error('Article not found:', id, 'Available articles:', articles.value.map(a => a?.id));
    toast.error('Article not found');
    return;
  }
  
  articleToDelete.value = article;
  showDeleteModal.value = true;
};

// Confirm delete
const confirmDelete = async () => {
  if (!articleToDelete.value) return;
  
  const { id, title } = articleToDelete.value;
  
  try {
    // 设置删除状态
    isDeleting.value = id;
    
    await articleStore.deleteArticleData(id);
    
    // 删除成功后重新获取文章列表，确保分页正确
    await fetchArticles();
    
    toast.success(`Article "${title}" deleted successfully`);
    
    // 关闭模态框
    showDeleteModal.value = false;
    articleToDelete.value = null;
  } catch (err) {
    console.error('Delete error:', err);
    toast.error(`Failed to delete article: ${err.message || 'Unknown error'}`);
  } finally {
    // 清除删除状态
    isDeleting.value = null;
  }
};

// Cancel delete
const cancelDelete = () => {
  showDeleteModal.value = false;
  articleToDelete.value = null;
};

// Toggle article status
const toggleStatus = async (article) => {
  if (isTogglingStatus.value === article.id) return;
  
  try {
    isTogglingStatus.value = article.id;
    
    // 定义状态循环顺序
    const statusCycle = {
      'draft': 'private',
      'private': 'published', 
      'published': 'draft'
    };
    
    const newStatus = statusCycle[article.status];
    if (!newStatus) {
      toast.error('Invalid article status');
      return;
    }
    
    // 更新文章状态
    await articleStore.updateArticleData(article.id, { status: newStatus });
    
    // 重新获取文章列表以更新显示
    await fetchArticles();
    
    toast.success(`Article status changed to ${getStatusLabel(newStatus)}`);
    
  } catch (err) {
    console.error('Status toggle error:', err);
    toast.error(`Failed to update status: ${err.message || 'Unknown error'}`);
  } finally {
    isTogglingStatus.value = null;
  }
};

// Status helper functions
const getStatusClass = (status) => {
  const classes = {
    'draft': 'bg-secondary',
    'private': 'bg-warning',
    'published': 'bg-success'
  };
  return classes[status] || 'bg-secondary';
};

const getStatusIcon = (status) => {
  const icons = {
    'draft': 'fas fa-edit',
    'private': 'fas fa-lock',
    'published': 'fas fa-eye'
  };
  return icons[status] || 'fas fa-question';
};

const getStatusLabel = (status) => {
  const labels = {
    'draft': '草稿',
    'private': '私有',
    'published': '已发布'
  };
  return labels[status] || status;
};

const getNextStatusLabel = (status) => {
  const statusCycle = {
    'draft': '私有',
    'private': '已发布', 
    'published': '草稿'
  };
  return statusCycle[status] || status;
};

// Helpers to safely format dates
const toValidDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (dateString) => {
  const d = toValidDate(dateString);
  return d ? format(d, 'MMM d, yyyy') : '-';
};

// Format time ago
const formatTimeAgo = (dateString) => {
  const date = toValidDate(dateString);
  if (!date) return '';
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays <= 0) return 'today';
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return format(date, 'MMM d, yyyy');
};

// Fetch articles on component mount
onMounted(() => {
  fetchArticles();
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use 'sass:string';
@use '@/assets/styles/variables' as *;

.page-header {
  margin-bottom: 1.5rem;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 600;
    color: $heading-color;
    display: flex;
    align-items: center;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .stats {
    display: flex;
    gap: 1rem;
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: $text-muted;
      
      i {
        font-size: 1rem;
      }
    }
  }
}

.card {
  background: $white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 2rem;
  
  &-body {
    padding: 1.5rem;
  }
}

// Search and Filter Bar
.search-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  gap: 1rem;
  flex-wrap: wrap;
  
  .search-box {
    position: relative;
    flex: 1;
    min-width: 250px;
    
    i {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: $text-muted;
    }
    
    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.5rem;
      border: 1px solid $border-color;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.2s ease;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
      }
    }
  }
  
  .filter-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    .status-filter {
      padding: 0.5rem 0.75rem;
      border: 1px solid $border-color;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background: white;
      cursor: pointer;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
      }
    }
  }
}

table {
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: 0.75rem 1rem;
    font-weight: 600;
    color: $text-muted;
    border-bottom: 1px solid $border-color;
  }
  
  td {
    padding: 1rem;
    border-bottom: 1px solid $border-color;
    vertical-align: middle;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:hover {
    background-color: $table-hover-bg;
  }
}

// Article info styles
.article-info {
  .article-title {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
    
    .fw-semibold {
      font-weight: 600;
      color: $heading-color;
    }
  }
  
  .article-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    .excerpt {
      color: $text-muted;
      font-size: 0.8rem;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.date-info {
  .created-date {
    font-weight: 500;
    color: $heading-color;
    margin-bottom: 0.25rem;
  }
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.badge {
  display: inline-block;
  padding: 0.35em 0.65em;
  font-size: 0.75em;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  border-radius: 0.25rem;
  
  &.bg-success {
    background-color: $success-color;
  }
  
  &.bg-warning {
    background-color: $warning-color;
  }
  
  &.bg-secondary {
    background-color: $secondary-color;
  }
  
  // Status toggle button styles
  &.status-toggle {
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    user-select: none;
    
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }
    
    &.bg-success:hover:not(:disabled) {
      background-color: color.adjust($success-color, $lightness: -10%);
    }
    
    &.bg-warning:hover:not(:disabled) {
      background-color: color.adjust($warning-color, $lightness: -10%);
    }
    
    &.bg-secondary:hover:not(:disabled) {
      background-color: color.adjust($secondary-color, $lightness: -10%);
    }
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  cursor: pointer;
  
  &-primary {
    background-color: $primary-color;
    color: $white;
    
    &:hover {
      background-color: color.adjust($primary-color, $lightness: -10%);
    }
  }
  
  &-outline-primary {
    border-color: $primary-color;
    color: $primary-color;
    background: transparent;
    
    &:hover {
      background-color: rgba($primary-color, 0.1);
    }
  }
  
  &-outline-danger {
    border-color: $danger-color;
    color: $danger-color;
    background: transparent;
    
    &:hover {
      background-color: rgba($danger-color, 0.1);
    }
  }
  
  &-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
}

// Utility classes
@mixin utility-class($property, $value, $prefix: '') {
  .#{$prefix}#{string.slice("#{$property}", 1, 1)}-#{$value} {
    #{$property}: #{$value * 0.25}rem !important;
  }
}

@each $name, $color in $theme-colors {
  .text-#{$name} {
    color: $color;
  }
  
  .bg-#{$name} {
    background-color: $color;
  }
}

@each $size in (1, 2, 3, 4, 5, 6) {
  @include utility-class('margin', $size, 'm');
  @include utility-class('margin-top', $size, 'mt-');
  @include utility-class('margin-right', $size, 'me-');
  @include utility-class('margin-bottom', $size, 'mb-');
  @include utility-class('margin-left', $size, 'ms-');
  @include utility-class('padding', $size, 'p');
  @include utility-class('padding-top', $size, 'pt-');
  @include utility-class('padding-right', $size, 'pe-');
  @include utility-class('padding-bottom', $size, 'pb-');
  @include utility-class('padding-left', $size, 'ps-');
}

.text-muted {
  color: $text-muted;
}

.small {
  font-size: 0.875rem;
}

.fw-semibold {
  font-weight: 600;
}

.text-nowrap {
  white-space: nowrap;
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
</style>
