import { sequelize } from '../config/databases.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildWhere, findAndCount, findById, findBySlug, create as repoCreate, update as repoUpdate, destroy as repoDestroy } from '../repositories/articleRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureString = (val) => (typeof val === 'string' ? val : String(val ?? ''));

export const listArticles = async ({ status, search, page = 1, limit = 10 }) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const offset = (pageNum - 1) * pageSize;

  const where = buildWhere({ status, search });
  const { count, rows } = await findAndCount({ where, order: [['createdAt', 'DESC']], limit: pageSize, offset });
  return {
    items: rows,
    total: count,
    page: pageNum,
    pageSize,
  };
};

export const getArticle = async (id) => findById(id);
export const getArticleBySlug = async (slug) => findBySlug(slug);

export const createArticle = async ({ title, slug, content, excerpt, status, featuredImage }) => {
  console.log('📝 createArticle called with:', { title, slug, content, excerpt, status, featuredImage });
  
  const payload = {
    title: ensureString(title).trim(),
    slug: slug ? ensureString(slug).trim() : null,
    content: ensureString(content).trim(),
    excerpt: excerpt ? ensureString(excerpt) : null,
    status: ['draft', 'private', 'published'].includes(status) ? status : 'private',
    featuredImage: featuredImage || null,
  };
  
  console.log('🔧 Processed payload:', payload);
  
  if (!payload.title) throw new Error('Title is required');
  return repoCreate(payload);
};

export const updateArticle = async (id, { title, slug, content, excerpt, status, newFile }) => {
  return sequelize.transaction(async (t) => {
    const article = await findById(id);
    if (!article) return null;

    let featuredImage = article.featuredImage;
    if (newFile) {
      // delete old
      if (featuredImage) {
        const oldPath = path.join(__dirname, '../public/uploads', featuredImage);
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch {}
      }
      featuredImage = newFile;
    }

    const payload = {
      title: title !== undefined ? ensureString(title).trim() : article.title,
      slug: slug !== undefined ? ensureString(slug).trim() : article.slug,
      content: content !== undefined ? ensureString(content).trim() : article.content,
      excerpt: excerpt !== undefined ? ensureString(excerpt) : article.excerpt,
      status: status !== undefined ? (['draft', 'private', 'published'].includes(status) ? status : article.status) : article.status,
      featuredImage,
    };
    
    console.log('Updating article with payload:', payload);
    await repoUpdate(article, payload, { transaction: t });
    return article;
  });
};

export const deleteArticle = async (id) => {
  const article = await findById(id);
  if (!article) return false;
  await repoDestroy(article);
  return true;
};


