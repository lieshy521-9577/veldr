import express from 'express';
import { upload, handleUploadErrors } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadFile, uploadCroppedImage } from '../controllers/uploadController.js';

const router = express.Router();

// File upload endpoint for TinyMCE
router.post(
  '/',
  requireAuth,
  upload.single('file'),
  handleUploadErrors,
  asyncHandler(uploadFile)
);

// Cropped image upload endpoint
router.post(
  '/cropped',
  requireAuth,
  upload.single('croppedImage'),
  handleUploadErrors,
  asyncHandler(uploadCroppedImage)
);

export default router;
