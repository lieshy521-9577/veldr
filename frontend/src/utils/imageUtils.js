/**
 * 图片处理工具函数
 */

/**
 * 压缩图片
 * @param {File} file - 原始图片文件
 * @param {Object} options - 压缩选项
 * @param {number} options.maxWidth - 最大宽度
 * @param {number} options.maxHeight - 最大高度
 * @param {number} options.quality - 压缩质量 (0-1)
 * @param {string} options.type - 输出类型 (image/jpeg, image/png, image/webp)
 * @returns {Promise<File>} 压缩后的文件
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    type = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      
      if (ratio < 1) {
        width *= ratio;
        height *= ratio;
      }

      // 设置画布尺寸
      canvas.width = width;
      canvas.height = height;

      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('图片压缩失败'));
          }
        },
        type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 调整图片尺寸
 * @param {File} file - 原始图片文件
 * @param {number} width - 目标宽度
 * @param {number} height - 目标高度
 * @param {number} quality - 压缩质量
 * @returns {Promise<File>} 调整后的文件
 */
export const resizeImage = async (file, width, height, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      // 使用高质量缩放
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('图片调整失败'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 获取图片信息
 * @param {File} file - 图片文件
 * @returns {Promise<Object>} 图片信息
 */
export const getImageInfo = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type,
        name: file.name
      });
    };

    img.onerror = () => {
      reject(new Error('无法读取图片信息'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 验证图片文件
 * @param {File} file - 文件
 * @param {Object} options - 验证选项
 * @returns {Object} 验证结果
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxWidth = 4000,
    maxHeight = 4000
  } = options;

  const result = {
    valid: true,
    errors: []
  };

  // 检查文件类型
  if (!allowedTypes.includes(file.type)) {
    result.valid = false;
    result.errors.push(`不支持的文件类型: ${file.type}`);
  }

  // 检查文件大小
  if (file.size > maxSize) {
    result.valid = false;
    result.errors.push(`文件大小超过限制: ${formatFileSize(file.size)} > ${formatFileSize(maxSize)}`);
  }

  return result;
};

/**
 * 创建图片预览 URL
 * @param {File} file - 文件
 * @returns {string} 预览 URL
 */
export const createPreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * 释放预览 URL
 * @param {string} url - 预览 URL
 */
export const revokePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * 批量压缩图片
 * @param {File[]} files - 文件数组
 * @param {Object} options - 压缩选项
 * @returns {Promise<File[]>} 压缩后的文件数组
 */
export const compressImages = async (files, options = {}) => {
  const compressedFiles = [];
  
  for (const file of files) {
    try {
      const compressedFile = await compressImage(file, options);
      compressedFiles.push(compressedFile);
    } catch (error) {
      console.error(`压缩文件 ${file.name} 失败:`, error);
      // 如果压缩失败，使用原文件
      compressedFiles.push(file);
    }
  }
  
  return compressedFiles;
};

/**
 * 智能压缩 - 根据文件大小自动选择压缩参数
 * @param {File} file - 文件
 * @returns {Promise<File>} 压缩后的文件
 */
export const smartCompress = async (file) => {
  const fileSize = file.size;
  const MB = 1024 * 1024;
  
  let options = {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    type: 'image/jpeg'
  };
  
  // 根据文件大小调整压缩参数
  if (fileSize > 5 * MB) {
    // 大文件：高压缩
    options.quality = 0.6;
    options.maxWidth = 1600;
    options.maxHeight = 900;
  } else if (fileSize > 2 * MB) {
    // 中等文件：中等压缩
    options.quality = 0.7;
    options.maxWidth = 1800;
    options.maxHeight = 1000;
  } else if (fileSize < 500 * 1024) {
    // 小文件：轻微压缩
    options.quality = 0.9;
    options.maxWidth = 2048;
    options.maxHeight = 1152;
  }
  
  return compressImage(file, options);
};
