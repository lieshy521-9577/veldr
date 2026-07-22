<template>
  <div class="article-edit">
    <div v-if="loading" class="text-center py-8">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <template v-else>
      <div class="page-header">
        <h1>Edit Article</h1>
        <div class="actions">
          <button 
            @click="handleDelete" 
            class="btn btn-outline-danger"
            :disabled="isSubmitting"
          >
            <i class="fas fa-trash"></i> Delete Article
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-body">
          <ArticleForm
            ref="articleForm"
            :article="article"
            :is-editing="true"
            @submit="updateArticle"
          />
        </div>
      </div>
      
      <div class="card mt-4">
        <div class="card-header">
          <h3 class="card-title">Danger Zone</h3>
        </div>
        <div class="card-body">
                  <div class="danger-zone-content">
          <div class="danger-zone-info">
            <h4 class="danger-zone-title">Delete this article</h4>
            <p class="danger-zone-description">Once you delete an article, there is no going back. Please be certain.</p>
          </div>
            <button 
              @click="handleDelete" 
              class="btn btn-outline-danger"
              :disabled="isSubmitting"
            >
              <i class="fas fa-trash"></i> Delete Article
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useArticleStore } from '@/stores/articleStore.js';
import ArticleForm from './forms/ArticleForm.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const articleStore = useArticleStore();

const article = ref({
  id: '',
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  status: 'draft',
  featuredImage: null,
  featuredImageUrl: ''
});

const loading = ref(true);
const isSubmitting = ref(false);
const articleForm = ref(null);

// Fetch article data
const fetchArticle = async () => {
  try {
    loading.value = true;
    const articleData = await articleStore.fetchArticle(route.params.id, true); // admin = true
    
    if (articleData) {
      article.value = {
        id: String(articleData.id || ''),
        title: String(articleData.title || ''),
        slug: String(articleData.slug || ''),
        content: String(articleData.content || ''),
        excerpt: String(articleData.excerpt || ''),
        status: String(articleData.status || 'draft'),
        featuredImage: articleData.featuredImage || null,
        featuredImageUrl: articleData.featuredImage ? `/uploads/${articleData.featuredImage}` : ''
      };
    } else {
      throw new Error('Article not found');
    }
  } catch (error) {
    console.error('Error fetching article:', error);
    toast.error('Failed to load article');
    router.push({ name: 'ArticleList' });
  } finally {
    loading.value = false;
  }
};

// Update article
const updateArticle = async (formData) => {
  isSubmitting.value = true;
  
  try {
    // For FormData, we need to extract values for comparison
    let formDataObj = {};
    if (formData instanceof FormData) {
      for (let [key, value] of formData.entries()) {
        formDataObj[key] = value;
      }
    } else {
      formDataObj = formData;
    }
    
    // Check for changes
    let hasChanges = false;
    const fieldsToCheck = ['title', 'slug', 'content', 'excerpt', 'status'];
    
    fieldsToCheck.forEach(key => {
      const formValue = formDataObj[key];
      const articleValue = article.value[key];
      const isDifferent = formValue !== articleValue;
      
      if (isDifferent) {
        hasChanges = true;
      }
    });
    
    if (formDataObj.featuredImage) {
      hasChanges = true;
    }
    
    if (!hasChanges && !formDataObj.featuredImage) {
      toast.info('No changes detected');
      isSubmitting.value = false;
      return;
    }
    
    // Use store to update article
    const updatedArticle = await articleStore.updateArticleData(route.params.id, formData);
    
    if (updatedArticle) {
      // Update local article data
      article.value = {
        ...article.value,
        id: String(updatedArticle.id || article.value.id),
        title: String(updatedArticle.title || article.value.title),
        slug: String(updatedArticle.slug || article.value.slug),
        content: String(updatedArticle.content || article.value.content),
        excerpt: String(updatedArticle.excerpt || article.value.excerpt),
        status: String(updatedArticle.status || article.value.status),
        featuredImage: updatedArticle.featuredImage || article.value.featuredImage,
        featuredImageUrl: updatedArticle.featuredImage 
          ? `/uploads/${updatedArticle.featuredImage}` 
          : article.value.featuredImageUrl
      };
      
      toast.success('Article updated successfully!');
    }
  } catch (error) {
    console.error('Error updating article:', error);
    
    // 显示具体的验证错误信息
    if (error.message && error.message.includes('Validation error')) {
      // 解析验证错误信息
      const errorMessages = error.message.split(',').map(msg => msg.trim());
      const titleError = errorMessages.find(msg => msg.includes('Title must be between 3 and 255'));
      const slugError = errorMessages.find(msg => msg.includes('Slug'));
      
      if (titleError) {
        alert('请输入长度三位以上的文章名');
      } else if (slugError) {
        alert('文章别名不能为空，且只能包含小写字母、数字和连字符');
      } else {
        alert('请检查表单填写是否正确');
      }
    } else {
      toast.error(error.message || 'Failed to update article');
    }
  } finally {
    isSubmitting.value = false;
    // Reset ArticleForm's isSubmitting state
    if (articleForm.value && articleForm.value.resetSubmittingState) {
      articleForm.value.resetSubmittingState();
    }
  }
};

// Delete article
const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    await articleStore.deleteArticleData(route.params.id);
    toast.success('Article deleted successfully!');
    router.push({ name: 'ArticleList' });
  } catch (error) {
    console.error('Error deleting article:', error);
    toast.error(error.message || 'Failed to delete article');
  } finally {
    isSubmitting.value = false;
  }
};

// Fetch article data when component mounts
onMounted(() => {
  fetchArticle();
});
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 600;
    color: #2c3e50;
  }
}

.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  &-header {
    padding: 1rem 1.5rem;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    
    .card-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
    }
  }
  
  &-body {
    padding: 1.5rem;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-weight: 500;
  line-height: 1.5;
  color: #374151;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, 
              border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  
  &-outline-danger {
    color: #ef4444;
    border-color: #ef4444;
    background: transparent;
    
    &:hover {
      background-color: #fef2f2;
    }
    
    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  }
  
  i {
    margin-right: 0.5rem;
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

.mt-4 {
  margin-top: 1rem;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.font-medium {
  font-weight: 500;
}

.text-muted {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.text-center {
  text-align: center;
}

.text-primary {
  color: #3b82f6;
}

// Danger Zone styles
.danger-zone-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.danger-zone-info {
  flex: 1;
}

.danger-zone-title {
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  color: #1f2937;
}

.danger-zone-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}
</style>
