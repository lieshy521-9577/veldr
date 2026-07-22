<template>
  <div class="article-create">
    <div class="page-header">
      <div>
        <h1>New Note</h1>
        <p>Start a draft, add a main image, and choose how private it should be.</p>
      </div>
    </div>

    <div class="panel">
      <ArticleForm
        ref="articleForm"
        @submit="createArticle"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useArticleStore } from '@/stores/articleStore.js';
import ArticleForm from './forms/ArticleForm.vue';

const router = useRouter();
const toast = useToast();
const articleStore = useArticleStore();
const articleForm = ref(null);

const createArticle = async (formData) => {
  try {
    const article = await articleStore.createArticle(formData);

    toast.success('Note created');
    if (article?.id) {
      router.push({ name: 'ArticleEdit', params: { id: article.id } });
    } else {
      router.push({ name: 'ArticleList' });
    }
  } catch (error) {
    console.error('Error creating note:', error);

    articleForm.value?.resetSubmittingState?.();

    if (error.message && error.message.includes('Validation error')) {
      if (error.message.includes('Title')) {
        alert('Please enter a note title between 1 and 255 characters.');
      } else if (error.message.includes('Slug')) {
        alert('Slug can contain only lowercase letters, numbers, and hyphens.');
      } else {
        alert('Please check the form and try again.');
      }
    } else {
      toast.error(error.message || 'Failed to create note');
    }
  }
};
</script>

<style lang="scss" scoped>
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

.panel {
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
}
</style>
