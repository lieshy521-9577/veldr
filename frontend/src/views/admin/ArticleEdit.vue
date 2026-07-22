<template>
  <div class="article-edit">
    <div v-if="loading" class="state-panel">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <template v-else>
      <div class="page-header">
        <div>
          <h1>Edit Note</h1>
          <p>Update the note content, status, and main image.</p>
        </div>
        <div class="header-actions">
          <router-link to="/" class="btn btn-outline-secondary">
            <i class="fas fa-home"></i>
            Back to Home
          </router-link>
          <button
            @click="handleDelete"
            class="btn btn-outline-danger"
            :disabled="isSubmitting"
          >
            <i class="fas fa-trash"></i>
            Delete
          </button>
        </div>
      </div>

      <div class="panel">
        <ArticleForm
          ref="articleForm"
          :article="article"
          :is-editing="true"
          @submit="updateArticle"
        />
      </div>

      <section class="danger-panel">
        <div>
          <h2>Delete this note</h2>
          <p>Once deleted, this note cannot be restored from the admin UI.</p>
        </div>
        <button
          @click="handleDelete"
          class="btn btn-outline-danger"
          :disabled="isSubmitting"
        >
          <i class="fas fa-trash"></i>
          Delete Note
        </button>
      </section>
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

const fetchArticle = async () => {
  try {
    loading.value = true;
    const articleData = await articleStore.fetchArticle(route.params.id, true);

    if (!articleData) {
      throw new Error('Note not found');
    }

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
  } catch (error) {
    console.error('Error fetching note:', error);
    toast.error('Failed to load note');
    router.push({ name: 'ArticleList' });
  } finally {
    loading.value = false;
  }
};

const updateArticle = async (formData) => {
  isSubmitting.value = true;

  try {
    let formDataObj = {};
    if (formData instanceof FormData) {
      for (const [key, value] of formData.entries()) {
        formDataObj[key] = value;
      }
    } else {
      formDataObj = formData;
    }

    const fieldsToCheck = ['title', 'slug', 'content', 'excerpt', 'status'];
    const hasFieldChanges = fieldsToCheck.some(key => formDataObj[key] !== article.value[key]);
    const hasImageChange = Boolean(formDataObj.featuredImage);

    if (!hasFieldChanges && !hasImageChange) {
      toast.info('No changes detected');
      isSubmitting.value = false;
      return;
    }

    const updatedArticle = await articleStore.updateArticleData(route.params.id, formData);

    if (updatedArticle) {
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

      toast.success('Note updated');
    }
  } catch (error) {
    console.error('Error updating note:', error);

    if (error.message && error.message.includes('Validation error')) {
      if (error.message.includes('Title')) {
        alert('Please enter a note title with at least 3 characters.');
      } else if (error.message.includes('Slug')) {
        alert('Slug can contain only lowercase letters, numbers, and hyphens.');
      } else {
        alert('Please check the form and try again.');
      }
    } else {
      toast.error(error.message || 'Failed to update note');
    }
  } finally {
    isSubmitting.value = false;
    articleForm.value?.resetSubmittingState?.();
  }
};

const handleDelete = async () => {
  if (!confirm('Delete this note? This action cannot be undone.')) return;

  isSubmitting.value = true;

  try {
    await articleStore.deleteArticleData(route.params.id);
    toast.success('Note deleted');
    router.push({ name: 'ArticleList' });
  } catch (error) {
    console.error('Error deleting note:', error);
    toast.error(error.message || 'Failed to delete note');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(fetchArticle);
</script>

<style lang="scss" scoped>
.page-header,
.danger-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.page-header {
  margin-bottom: 1.5rem;

  h1 {
    margin: 0;
    color: var(--color-heading);
    font-size: 2rem;
    line-height: 1.1;
  }

  p {
    margin: 0.45rem 0 0;
    color: var(--color-text-muted);
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.panel,
.danger-panel,
.state-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
}

.panel {
  padding: 1.5rem;
}

.danger-panel {
  margin-top: 1rem;
  padding: 1.25rem 1.5rem;
  border-color: rgba(239, 68, 68, 0.32);
  background: rgba(239, 68, 68, 0.06);

  h2 {
    margin: 0;
    color: var(--color-heading);
    font-size: 1.1rem;
  }

  p {
    margin: 0.35rem 0 0;
    color: var(--color-text-muted);
    font-size: 0.92rem;
  }
}

.state-panel {
  display: grid;
  min-height: 14rem;
  place-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.45rem;
  padding: 0.6rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 800;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
}

.btn-outline-danger {
  color: var(--color-danger);
  background: transparent;
  border-color: rgba(239, 68, 68, 0.35);

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.08);
  }
}

.btn-outline-secondary {
  color: var(--color-text);
  background: var(--color-surface-muted);
  border-color: var(--color-border);
  text-decoration: none;

  &:hover {
    border-color: var(--accent);
    color: var(--accent-strong);
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

.text-primary { color: var(--color-accent); }

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

@media (max-width: 720px) {
  .page-header,
  .danger-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions,
  .header-actions .btn {
    width: 100%;
  }
}
</style>
