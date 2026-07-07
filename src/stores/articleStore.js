import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import articleApi from '@/api/articleApi.js';

export const useArticleStore = defineStore('article', () => {
  // State
  const articles = ref([]);
  const currentArticle = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  // Getters
  const publishedArticles = computed(() => 
    articles.value.filter(article => article.status === 'published')
  );

  const privateArticles = computed(() => 
    articles.value.filter(article => article.status === 'private')
  );

  const draftArticles = computed(() => 
    articles.value.filter(article => article.status === 'draft')
  );

  const hasArticles = computed(() => articles.value.length > 0);

  const isLoading = computed(() => loading.value);

  const currentError = computed(() => error.value);

  // Actions
  const setLoading = (value) => {
    loading.value = value;
  };

  const setError = (err) => {
    error.value = err;
  };

  const clearError = () => {
    error.value = null;
  };

  const setArticles = (data) => {
    articles.value = data;
  };

  const setCurrentArticle = (article) => {
    currentArticle.value = article;
  };

  const setPagination = (data) => {
    pagination.value = {
      page: data.page || 1,
      pageSize: data.pageSize || 10,
      total: data.total || 0,
      totalPages: data.totalPages || 0
    };
  };

  const addArticle = (article) => {
    articles.value.unshift(article);
  };

  const updateArticle = (id, updatedArticle) => {
    const index = articles.value.findIndex(article => article.id === id);
    if (index !== -1) {
      articles.value[index] = { ...articles.value[index], ...updatedArticle };
    }
    
    if (currentArticle.value && currentArticle.value.id === id) {
      currentArticle.value = { ...currentArticle.value, ...updatedArticle };
    }
  };

  const removeArticle = (id) => {
    articles.value = articles.value.filter(article => article.id !== id);
    if (currentArticle.value && currentArticle.value.id === id) {
      currentArticle.value = null;
    }
    // 更新分页信息
    pagination.value.total = Math.max(0, pagination.value.total - 1);
    pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.pageSize);
  };

  // API Actions
  const fetchArticles = async (params = {}) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await articleApi.getArticles(params);
      
      if (response.success) {
        setArticles(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch articles');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchArticle = async (id, admin = false) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await articleApi.getArticle(id, admin);
      
      if (response.success) {
        setCurrentArticle(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch article');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleBySlug = async (slug) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await articleApi.getArticleBySlug(slug);
      
      if (response.success) {
        setCurrentArticle(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch article');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createArticle = async (articleData) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await articleApi.createArticle(articleData);
      
      if (response.success) {
        addArticle(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create article');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateArticleData = async (id, articleData) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await articleApi.updateArticle(id, articleData);
      
      if (response.success) {
        updateArticle(id, response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update article');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteArticleData = async (id) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await articleApi.deleteArticle(id);
      
      if (response.success) {
        removeArticle(id);
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete article');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateArticleStatus = async (id, status) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await articleApi.updateArticleStatus(id, status);
      
      if (response.success) {
        // Update the article in the list
        updateArticle(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update article status');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchArticles = async (query, options = {}) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await articleApi.searchArticles(query, options);
      
      if (response.success) {
        setArticles(response.data);
        setPagination(response.pagination);
        return response.data;
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset store
  const resetStore = () => {
    articles.value = [];
    currentArticle.value = null;
    loading.value = false;
    error.value = null;
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    };
  };

  return {
    // State
    articles,
    currentArticle,
    loading,
    error,
    pagination,
    
    // Getters
    publishedArticles,
    privateArticles,
    draftArticles,
    hasArticles,
    isLoading,
    currentError,
    
    // Actions
    setLoading,
    setError,
    clearError,
    setArticles,
    setCurrentArticle,
    setPagination,
    addArticle,
    updateArticle,
    removeArticle,
    
    // API Actions
    fetchArticles,
    fetchArticle,
    fetchArticleBySlug,
    createArticle,
    updateArticleData,
    updateArticleStatus,
    deleteArticleData,
    searchArticles,
    resetStore
  };
});
