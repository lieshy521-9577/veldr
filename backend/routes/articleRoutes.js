import express from 'express';
import { upload, handleUploadErrors } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  getArticles, 
  getArticleById, 
  getArticleBySlug,
  createArticle, 
  updateArticle, 
  updateArticleStatus,
  deleteArticle 
} from '../controllers/articleController.js';

const router = express.Router();

// Get all articles
router.get(
  '/',
  asyncHandler(getArticles)
);

// Get single article by slug (put before id to avoid conflicts)
router.get('/slug/:slug', asyncHandler(getArticleBySlug));

// Get single article by ID
router.get('/:id', asyncHandler(getArticleById));

// Create a new article
router.post(
  '/',
  upload.single('featuredImage'),
  handleUploadErrors,
  asyncHandler(createArticle)
);

// Update an article
router.put(
  '/:id',
  upload.single('featuredImage'),
  handleUploadErrors,
  asyncHandler(updateArticle)
);

// Update article status only
router.patch(
  '/:id/status',
  asyncHandler(updateArticleStatus)
);

// Delete an article
router.delete(
  '/:id',
  asyncHandler(deleteArticle)
);

export default router;
