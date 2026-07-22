import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { imageProcessor } from '../utils/imageProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Handle file upload
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadFile = async (req, res) => {
  try {
    console.log('📤 Upload request received:', {
      hasFile: !!req.file,
      fileSize: req.file?.size,
      fileName: req.file?.originalname,
      mimeType: req.file?.mimetype
    });

    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // 使用图片处理器验证文件
    const validation = imageProcessor.validateImage(req.file);
    if (!validation.valid) {
      console.log('❌ File validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors: validation.errors
      });
    }

    // Generate a unique filename
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const filename = `${uuidv4()}${fileExt}`;
    const filepath = path.join(uploadDir, filename);

    console.log('📁 File paths:', {
      tempPath: req.file.path,
      finalPath: filepath,
      filename: filename
    });

    // Check if temp file exists
    if (!fs.existsSync(req.file.path)) {
      console.log('❌ Temp file does not exist:', req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Temporary file not found'
      });
    }

    // 使用智能压缩处理图片
    console.log('🔄 Processing image with smart compression...');
    const compressionResult = await imageProcessor.smartCompress(req.file.path, filepath);
    
    if (!compressionResult.success) {
      console.log('❌ Image compression failed:', compressionResult.error);
      return res.status(500).json({
        success: false,
        message: 'Image processing failed',
        error: compressionResult.error
      });
    }
    
    console.log('✅ Image processed successfully:', {
      originalSize: imageProcessor.formatFileSize(compressionResult.originalSize),
      compressedSize: imageProcessor.formatFileSize(compressionResult.compressedSize),
      compressionRatio: compressionResult.compressionRatio + '%'
    });
    
    // Delete the temp file
    imageProcessor.cleanupTempFile(req.file.path);
    console.log('🗑️ Temp file cleaned up');

    // Return the file URL
    const fileUrl = `/uploads/${filename}`;

    console.log('✅ Upload successful:', fileUrl);

    res.status(200).json({
      success: true,
      url: fileUrl,
      message: 'File uploaded and processed successfully',
      compression: {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio + '%'
      }
    });
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    
    // Clean up the temp file if it exists
    if (req.file && req.file.path) {
      imageProcessor.cleanupTempFile(req.file.path);
      console.log('🗑️ Temp file cleaned up after error');
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

/**
 * 处理裁剪后的图片上传
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadCroppedImage = async (req, res) => {
  try {
    console.log('📤 Cropped image upload request received:', {
      hasFile: !!req.file,
      fileSize: req.file?.size,
      fileName: req.file?.originalname,
      mimeType: req.file?.mimetype
    });

    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // 验证文件
    const validation = imageProcessor.validateImage(req.file);
    if (!validation.valid) {
      console.log('❌ File validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors: validation.errors
      });
    }

    // 生成文件名
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const filename = `cropped_${uuidv4()}${fileExt}`;
    const filepath = path.join(uploadDir, filename);

    // 直接复制文件（因为前端已经压缩过了）
    fs.copyFileSync(req.file.path, filepath);
    console.log('✅ Cropped image saved successfully');
    
    // 清理临时文件
    imageProcessor.cleanupTempFile(req.file.path);
    console.log('🗑️ Temp file cleaned up');

    const fileUrl = `/uploads/${filename}`;

    console.log('✅ Cropped image upload successful:', fileUrl);

    res.status(200).json({
      success: true,
      url: fileUrl,
      message: 'Cropped image uploaded successfully',
      fileInfo: {
        filename: filename,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Error uploading cropped image:', error);
    
    // 清理临时文件
    if (req.file && req.file.path) {
      imageProcessor.cleanupTempFile(req.file.path);
      console.log('🗑️ Temp file cleaned up after error');
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload cropped image',
      error: error.message
    });
  }
};

export { uploadFile, uploadCroppedImage };
