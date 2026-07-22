/**
 * URL工具函数
 * 统一处理API和上传文件的URL
 */

// 获取上传文件的基础URL
export const getUploadBaseUrl = () => {
  // 在 Vercel 环境中使用相对路径，避免 Mixed Content 问题
  return '/uploads';
};

// 获取API基础URL
export const getApiBaseUrl = () => {
  // 在 Vercel 环境中使用相对路径，避免 Mixed Content 问题
  return '/api';
};

// 构建上传文件URL
export const buildUploadUrl = (filename) => {
  if (!filename) return null;
  const baseUrl = getUploadBaseUrl();
  return `${baseUrl}/${filename}`;
};

// 构建API URL
export const buildApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};
