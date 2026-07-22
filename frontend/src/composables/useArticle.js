import { ref, computed } from 'vue';
import { useArticleStore } from '@/stores/articleStore.js';
import { useErrorHandler } from '@/composables/useErrorHandler.js';

/**
 * Article management composable
 * Provides article-related functionality with error handling
 */
export function useArticle() {
  const articleStore = useArticleStore();
  const { handleError, withErrorHandling } = useErrorHandler();

  // Local state for form management
  const formData = ref({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'private',
    featuredImage: null,
    featuredImageUrl: ''
  });

  const isSubmitting = ref(false);
  const isEditing = ref(false);

  // Computed properties
  const hasContent = computed(() => {
    const content = String(formData.value.content || '').trim();
    return content.length > 0;
  });

  const wordCount = computed(() => {
    const content = String(formData.value.content || '');
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  });

  const charCount = computed(() => {
    const content = String(formData.value.content || '');
    return content.replace(/<[^>]*>/g, '').length;
  });

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.value.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.value.slug.trim()) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.value.slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    // Content is now optional - removed validation

    return errors;
  };

  // Generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Auto-generate slug when title changes
  const updateSlug = () => {
    if (!isEditing.value || !formData.value.slug) {
      formData.value.slug = generateSlug(formData.value.title);
    }
  };

  // Ensure content is always a string when formData changes
  const ensureStringContent = () => {
    if (formData.value.content !== null && formData.value.content !== undefined) {
      formData.value.content = String(formData.value.content);
    }
  };

  // Reset form
  const resetForm = (article = null) => {
    if (article) {
      formData.value = {
        title: String(article.title || ''),
        slug: String(article.slug || ''),
        content: String(article.content || ''),
        excerpt: String(article.excerpt || ''),
        status: String(article.status || 'private'),
        featuredImage: null,
        featuredImageUrl: article.featuredImage ? `/uploads/${article.featuredImage}` : ''
      };
      isEditing.value = true;
    } else {
      formData.value = {
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        status: 'private',
        featuredImage: null,
        featuredImageUrl: ''
      };
      isEditing.value = false;
    }
    // Ensure content is always a string
    ensureStringContent();
  };

  // Handle file upload
  const handleFileUpload = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      handleError('Please upload an image file', { context: 'File Upload' });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      handleError('File size must be less than 5MB', { context: 'File Upload' });
      return;
    }

    formData.value.featuredImage = file;

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.featuredImageUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Prepare form data for submission
  const prepareFormData = () => {
    const data = new FormData();
    
            // Append text fields
        Object.keys(formData.value).forEach(key => {
          if (key !== 'featuredImage' && key !== 'featuredImageUrl') {
            const value = formData.value[key];
            data.append(key, value);
          }
        });
      
        // Append file if exists
        if (formData.value.featuredImage) {
          data.append('featuredImage', formData.value.featuredImage);
        }

    return data;
  };

  // Create article
  const createArticle = withErrorHandling(async () => {
    isSubmitting.value = true;

    try {
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        throw new Error('Validation failed');
      }

      const data = prepareFormData();
      const article = await articleStore.createArticle(data);
      
      return article;
    } finally {
      isSubmitting.value = false;
    }
  }, { context: 'Create Article' });

  // Update article
  const updateArticle = withErrorHandling(async (id) => {
    isSubmitting.value = true;

    try {
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        throw new Error('Validation failed');
      }

      const data = prepareFormData();
      const article = await articleStore.updateArticleData(id, data);
      
      return article;
    } finally {
      isSubmitting.value = false;
    }
  }, { context: 'Update Article' });

  // Delete article
  const deleteArticle = withErrorHandling(async (id) => {
    await articleStore.deleteArticleData(id);
    return true;
  }, { context: 'Delete Note' });

  // Fetch article
  const fetchArticle = withErrorHandling(async (id) => {
    return await articleStore.fetchArticle(id);
  }, { context: 'Fetch Article' });

  // Fetch article by slug
  const fetchArticleBySlug = withErrorHandling(async (slug) => {
    return await articleStore.fetchArticleBySlug(slug);
  }, { context: 'Fetch Article by Slug' });

  // Fetch articles
  const fetchArticles = withErrorHandling(async (params = {}) => {
    return await articleStore.fetchArticles(params);
  }, { context: 'Fetch Articles' });

  // Search articles
  const searchArticles = withErrorHandling(async (query, options = {}) => {
    return await articleStore.searchArticles(query, options);
  }, { context: 'Search Articles' });

  return {
    // State
    formData,
    isSubmitting,
    isEditing,

    // Computed
    hasContent,
    wordCount,
    charCount,

    // Store state
    articles: articleStore.articles,
    currentArticle: articleStore.currentArticle,
    loading: articleStore.loading,
    error: articleStore.error,
    pagination: articleStore.pagination,

    // Methods
    validateForm,
    generateSlug,
    updateSlug,
    resetForm,
    handleFileUpload,
    prepareFormData,
    createArticle,
    updateArticle,
    deleteArticle,
    fetchArticle,
    fetchArticleBySlug,
    fetchArticles,
    searchArticles,

    // Store actions
    setCurrentArticle: articleStore.setCurrentArticle,
    clearError: articleStore.clearError
  };
}
