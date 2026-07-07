/**
 * Article API service
 * Centralized API calls for article-related operations
 */

import { buildApiUrl } from '@/utils/urlHelper';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// Helper function to build query string
const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

export const articleApi = {
  /**
   * Get articles with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Articles response
   */
  async getArticles(params = {}) {
    const queryString = buildQueryString(params);
    const url = buildApiUrl(`/articles${queryString ? `?${queryString}` : ''}`);
    
    const response = await fetch(url);
    return handleResponse(response);
  },

  /**
   * Get single article by ID
   * @param {string} id - Article ID
   * @param {boolean} admin - Whether this is an admin request (allows access to drafts)
   * @returns {Promise<Object>} Article data
   */
  async getArticle(id, admin = false) {
    const url = admin ? buildApiUrl(`/articles/${id}?admin=true`) : buildApiUrl(`/articles/${id}`);
    const response = await fetch(url);
    return handleResponse(response);
  },

  /**
   * Get single article by slug
   * @param {string} slug - Article slug
   * @returns {Promise<Object>} Article data
   */
  async getArticleBySlug(slug) {
    const response = await fetch(buildApiUrl(`/articles/slug/${slug}`));
    return handleResponse(response);
  },

  /**
   * Create new article
   * @param {FormData|Object} data - Article data
   * @returns {Promise<Object>} Created article
   */
  async createArticle(data) {
    const isFormData = data instanceof FormData;
    const body = isFormData ? data : JSON.stringify(data);
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };

    const response = await fetch(buildApiUrl('/articles'), {
      method: 'POST',
      headers,
      body
    });
    return handleResponse(response);
  },

  /**
   * Update existing article
   * @param {string} id - Article ID
   * @param {FormData|Object} data - Article data
   * @returns {Promise<Object>} Updated article
   */
  async updateArticle(id, data) {
    const isFormData = data instanceof FormData;
    const body = isFormData ? data : JSON.stringify(data);
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };

    const response = await fetch(buildApiUrl(`/articles/${id}`), {
      method: 'PUT',
      headers,
      body
    });
    return handleResponse(response);
  },

  /**
   * Update article status only
   * @param {string} id - Article ID
   * @param {string} status - New status ('draft' or 'published')
   * @returns {Promise<Object>} Updated article
   */
  async updateArticleStatus(id, status) {
    const response = await fetch(buildApiUrl(`/articles/${id}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  },

  /**
   * Delete article
   * @param {string} id - Article ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteArticle(id) {
    const response = await fetch(buildApiUrl(`/articles/${id}`), {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  /**
   * Search articles
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchArticles(query, options = {}) {
    const params = {
      search: query,
      status: 'published',
      ...options
    };
    return this.getArticles(params);
  },

  /**
   * Upload image file
   * @param {File} file - Image file
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(buildApiUrl('/upload'), {
      method: 'POST',
      body: formData
    });
    return handleResponse(response);
  },

  /**
   * Upload cropped image file
   * @param {File} file - Cropped image file
   * @returns {Promise<Object>} Upload result
   */
  async uploadCroppedImage(file) {
    const formData = new FormData();
    formData.append('croppedImage', file);

    const response = await fetch(buildApiUrl('/upload/cropped'), {
      method: 'POST',
      body: formData
    });
    return handleResponse(response);
  }
};

export default articleApi;
