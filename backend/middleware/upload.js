import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 使用配置的临时目录，不在public下
    const tempDir = path.join(__dirname, '..', config.tempDir);
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

// Configure multer with the storage and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
    files: 1, // Allow only one file per request
    fieldSize: 16 * 1024 * 1024, // 16MB field size limit
    fieldNameSize: 100, // Field name size limit
    fields: 10 // Number of non-file fields
  }
});

// Middleware for handling file upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 16MB.'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Only one file is allowed per request.'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(500).json({
      success: false,
      message: 'Server error during file upload',
      error: err.message
    });
  }
  
  // No errors, proceed to the next middleware
  next();
};

// Middleware to clean up temp files after successful processing
// Note: Temp files are now cleaned up in the controller after successful copy
const cleanupTempFiles = (req, res, next) => {
  // Store original res.end to intercept it
  const originalEnd = res.end;
  
  res.end = function(...args) {
    // Clean up temp files after response is sent (fallback for error cases)
    if (req.file && req.file.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log('Temp file cleaned up (fallback):', req.file.path);
        }
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }
    
    // Call original end method
    originalEnd.apply(this, args);
  };
  
  next();
};

export { upload, handleUploadErrors, cleanupTempFiles };
