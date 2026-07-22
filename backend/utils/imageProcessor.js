import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 图片处理工具类
 * 提供图片压缩、调整尺寸等功能
 */
export class ImageProcessor {
  constructor() {
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    this.maxFileSize = 16 * 1024 * 1024; // 16MB
  }

  /**
   * 验证图片文件
   * @param {Object} file - 文件对象
   * @returns {Object} 验证结果
   */
  validateImage(file) {
    const result = {
      valid: true,
      errors: []
    };

    // 检查文件是否存在
    if (!file || !file.path) {
      result.valid = false;
      result.errors.push('文件不存在');
      return result;
    }

    // 检查文件大小
    if (file.size > this.maxFileSize) {
      result.valid = false;
      result.errors.push(`文件大小超过限制: ${this.formatFileSize(file.size)} > ${this.formatFileSize(this.maxFileSize)}`);
    }

    // 检查文件类型
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!this.supportedFormats.includes(ext)) {
      result.valid = false;
      result.errors.push(`不支持的文件格式: ${ext}`);
    }

    // 检查 MIME 类型
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      result.valid = false;
      result.errors.push(`不支持的 MIME 类型: ${file.mimetype}`);
    }

    return result;
  }

  /**
   * 获取图片信息
   * @param {string} filePath - 文件路径
   * @returns {Object} 图片信息
   */
  getImageInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase().slice(1);
      
      return {
        size: stats.size,
        format: ext,
        exists: true,
        lastModified: stats.mtime
      };
    } catch (error) {
      return {
        size: 0,
        format: 'unknown',
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * 智能压缩图片
   * 根据文件大小自动选择压缩参数
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @returns {Promise<Object>} 压缩结果
   */
  async smartCompress(inputPath, outputPath) {
    try {
      const imageInfo = this.getImageInfo(inputPath);
      
      if (!imageInfo.exists) {
        throw new Error('输入文件不存在');
      }

      // 根据文件大小选择压缩策略
      const compressionOptions = this.getCompressionOptions(imageInfo.size);
      
      // 由于没有 Sharp，我们使用简单的文件复制
      // 在实际项目中，这里应该使用 Sharp 进行真正的图片压缩
      await this.copyFile(inputPath, outputPath);
      
      const outputInfo = this.getImageInfo(outputPath);
      
      return {
        success: true,
        originalSize: imageInfo.size,
        compressedSize: outputInfo.size,
        compressionRatio: ((imageInfo.size - outputInfo.size) / imageInfo.size * 100).toFixed(2),
        outputPath: outputPath
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 根据文件大小获取压缩选项
   * @param {number} fileSize - 文件大小（字节）
   * @returns {Object} 压缩选项
   */
  getCompressionOptions(fileSize) {
    const MB = 1024 * 1024;
    
    if (fileSize > 5 * MB) {
      // 大文件：高压缩
      return {
        quality: 60,
        maxWidth: 1600,
        maxHeight: 900
      };
    } else if (fileSize > 2 * MB) {
      // 中等文件：中等压缩
      return {
        quality: 70,
        maxWidth: 1800,
        maxHeight: 1000
      };
    } else if (fileSize < 500 * 1024) {
      // 小文件：轻微压缩
      return {
        quality: 90,
        maxWidth: 2048,
        maxHeight: 1152
      };
    } else {
      // 默认压缩
      return {
        quality: 80,
        maxWidth: 1920,
        maxHeight: 1080
      };
    }
  }

  /**
   * 复制文件
   * @param {string} src - 源文件路径
   * @param {string} dest - 目标文件路径
   * @returns {Promise<void>}
   */
  async copyFile(src, dest) {
    return new Promise((resolve, reject) => {
      fs.copyFile(src, dest, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 生成缩略图
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {number} width - 缩略图宽度
   * @param {number} height - 缩略图高度
   * @returns {Promise<Object>} 生成结果
   */
  async generateThumbnail(inputPath, outputPath, width = 300, height = 200) {
    try {
      // 在实际项目中，这里应该使用 Sharp 生成缩略图
      // 现在只是复制原文件
      await this.copyFile(inputPath, outputPath);
      
      return {
        success: true,
        thumbnailPath: outputPath
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 清理临时文件
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否成功删除
   */
  cleanupTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('清理临时文件失败:', error);
      return false;
    }
  }

  /**
   * 批量处理图片
   * @param {Array} files - 文件数组
   * @param {string} outputDir - 输出目录
   * @returns {Promise<Array>} 处理结果
   */
  async batchProcess(files, outputDir) {
    const results = [];
    
    for (const file of files) {
      try {
        const outputPath = path.join(outputDir, file.filename);
        const result = await this.smartCompress(file.path, outputPath);
        results.push({
          originalName: file.originalname,
          filename: file.filename,
          ...result
        });
      } catch (error) {
        results.push({
          originalName: file.originalname,
          filename: file.filename,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

// 创建单例实例
export const imageProcessor = new ImageProcessor();
