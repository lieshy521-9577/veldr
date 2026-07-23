import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { listArticles, getArticle, getArticleBySlug as svcGetArticleBySlug, createArticle as svcCreate, updateArticle as svcUpdate, deleteArticle as svcDelete } from '../services/articleService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to handle file uploads (returns stored filename)
const handleFileUpload = (file) => {
  if (!file) return null;
  const uploadDir = path.join(__dirname, '../public/uploads');
  const fileExt = path.extname(file.originalname).toLowerCase();
  const filename = `${uuidv4()}${fileExt}`;
  const filepath = path.join(uploadDir, filename);
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Copy file instead of rename to avoid EXDEV error
  fs.copyFileSync(file.path, filepath);
  fs.unlinkSync(file.path); // Delete temp file
  
  return filename;
};

// Get all articles
const getArticles = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const requestedStatus = req.auth?.isAuthenticated ? status : 'published';
    const result = await listArticles({ status: requestedStatus, search, page, limit });
    res.json({ success: true, data: result.items, pagination: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: Math.ceil(result.total / result.pageSize) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch articles', error: error.message });
  }
};

// Get single article by ID
const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin } = req.query;
    const isAuthenticated = Boolean(req.auth?.isAuthenticated);
    const article = await getArticle(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    if (!isAuthenticated && article.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (article.status === 'draft' && admin === 'true' && !isAuthenticated) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: error.message
    });
  }
};

// Get single article by slug
const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const isAuthenticated = Boolean(req.auth?.isAuthenticated);
    const article = await svcGetArticleBySlug(slug);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    if (!isAuthenticated && article.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Error fetching article by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: error.message
    });
  }
};

// Create a new article
const createArticle = async (req, res) => {
  try {
    console.log('📥 createArticle controller received:', req.body);
    const { title, slug, content, excerpt, status } = req.body;
    const featuredImage = req.file ? handleFileUpload(req.file) : null;
    console.log('📤 Calling service with:', { title, slug, content, excerpt, status, featuredImage });
    const article = await svcCreate({ title, slug, content, excerpt, status, featuredImage });
    res.status(201).json({ success: true, message: 'Article created successfully', data: article });
  } catch (error) {
    console.error('❌ Error in createArticle controller:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update an article
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, content, excerpt, status } = req.body;
    const newFile = req.file ? handleFileUpload(req.file) : null;
    
    console.log('Update article request:', { id, title, slug, content, excerpt, status, hasFile: !!newFile });
    
    const article = await svcUpdate(id, { title, slug, content, excerpt, status, newFile });
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    
    console.log('Article updated successfully:', article);
    res.json({ success: true, message: 'Article updated successfully', data: article });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update article status only
const updateArticleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['draft', 'private', 'published'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be "draft", "private", or "published"' 
      });
    }
    
    const article = await svcUpdate(id, { status });
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        message: 'Article not found' 
      });
    }
    
    const statusMessages = {
      'draft': 'saved as draft',
      'private': 'saved as private',
      'published': 'published'
    };
    
    res.json({ 
      success: true, 
      message: `Article ${statusMessages[status]} successfully`,
      data: article 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update article status', 
      error: error.message 
    });
  }
};

// Delete an article
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await svcDelete(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Article not found' });
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete article', error: error.message });
  }
};

export {
  getArticles,
  getArticleById,
  getArticleBySlug,
  createArticle,
  updateArticle,
  updateArticleStatus,
  deleteArticle
};
