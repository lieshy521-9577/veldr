<template>
  <div class="article-create">
    <div class="page-header">
      <h1>Create New Article</h1>
    </div>
    
    <div class="card">
      <div class="card-body">
        <ArticleForm
          ref="articleForm"
          @submit="createArticle"
        />
      </div>
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
    
    toast.success('Article created successfully!');
    if (article?.id) {
      router.push({ name: 'ArticleEdit', params: { id: article.id } });
    } else {
      router.push({ name: 'ArticleList' });
    }
  } catch (error) {
    console.error('Error creating article:', error);
    
    // 重置表单提交状态
    if (articleForm.value && articleForm.value.resetSubmittingState) {
      articleForm.value.resetSubmittingState();
    }
    
    // 显示具体的验证错误信息
    if (error.message && error.message.includes('Validation error')) {
      // 解析验证错误信息
      const errorMessages = error.message.split(',').map(msg => msg.trim());
      const titleError = errorMessages.find(msg => msg.includes('Title must be between 1 and 255'));
      const slugError = errorMessages.find(msg => msg.includes('Slug'));
      
      if (titleError) {
        alert('请输入长度1-255字符的文章名');
      } else if (slugError) {
        alert('文章别名不能为空，且只能包含小写字母、数字和连字符');
      } else {
        alert('请检查表单填写是否正确');
      }
    } else {
      toast.error(error.message || 'Failed to create article');
    }
  }
};
</script>

<style lang="scss" scoped>
.page-header {
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
  
  &-body {
    padding: 1.5rem;
  }
}
</style>
