// 运行时配置：config.js（部署时由 deploy-frontends.ps1 写入 dist/config.js）
// 必须以普通 <script> 先于模块加载，这里只读取。
const CMS_CONFIG = window.CMS_CONFIG || {};

export const API_BASE = CMS_CONFIG.apiBase || '/api/cms';
export const UPLOAD_BASE = CMS_CONFIG.uploadBase || '/uploads/cms';
export const LEGACY_UPLOAD_BASE = '/uploads/';
export const ACCESS_KEY_STORAGE = 'veldr_cms_access_key';

export const apiPath = (path) => API_BASE + path;

// markdown-runtime 渲染图片时调用；Cookie 会话下上传件直接凭 Cookie/公开访问，
// 仅当内存中仍有 accessKey（兼容旧流程）时才追加 token。
window.CMSNormalizeMarkdownUrl = (url) => {
  let src = String(url || '');
  if (window.App?.accessKey && (src.startsWith(LEGACY_UPLOAD_BASE) || src.startsWith(UPLOAD_BASE))) {
    src += (src.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(window.App.accessKey);
  }
  return src;
};
