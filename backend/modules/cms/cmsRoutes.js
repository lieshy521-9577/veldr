import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { attachAuthState } from '../../middleware/auth.js';
import { loadDB, persistDB, nextId, normalizeTags, uploadDir } from './cmsStore.js';
import { authenticateCms, requireEditor, requireViewer } from './cmsAuth.js';

const router = express.Router();

const send = (res, status, data) => res.status(status).json(data);

const allowedImages = /^image\/(png|jpe?g|gif|webp|svg\+xml|avif|bmp)$/i;

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
      const base = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      cb(null, base + (ext || '.img'));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedImages.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.use(attachAuthState);

router.post('/auth', authenticateCms);

router.get('/me', requireViewer, (req, res) => {
  send(res, 200, { role: req.cmsRole });
});

router.get('/notes', requireViewer, async (req, res) => {
  const db = await loadDB();
  let notes = [...db.notes];
  const { category, tag, search, star, notebookId } = req.query;

  if (notebookId) notes = notes.filter(note => note.notebookId === notebookId);
  if (category) notes = notes.filter(note => note.category === category);
  if (tag) notes = notes.filter(note => Array.isArray(note.tags) && note.tags.includes(tag));
  if (star === '1' || star === 'true') notes = notes.filter(note => note.starred);
  if (search) {
    const query = String(search).toLowerCase();
    notes = notes.filter(note =>
      (note.title || '').toLowerCase().includes(query) ||
      (note.excerpt || '').toLowerCase().includes(query) ||
      (note.content || '').toLowerCase().includes(query) ||
      (note.tags || []).some(tagValue => String(tagValue).toLowerCase().includes(query))
    );
  }

  send(res, 200, notes);
});

router.get('/notes/:id', requireViewer, async (req, res) => {
  const db = await loadDB();
  const note = db.notes.find(item => item.id === Number(req.params.id));
  if (!note) return send(res, 404, { error: 'Note not found' });
  return send(res, 200, note);
});

router.post('/notes', requireEditor, async (req, res) => {
  const db = await loadDB();
  const body = req.body || {};
  if (!body.title || !body.content) {
    return send(res, 400, { error: 'Title and content are required' });
  }

  const content = String(body.content);
  const note = {
    id: nextId(db.notes),
    title: String(body.title),
    category: body.category || 'work',
    notebookId: body.notebookId || null,
    tags: normalizeTags(body.tags),
    date: body.date || new Date().toISOString().split('T')[0],
    readTime: body.readTime || `${Math.max(1, Math.ceil(content.length / 500))} min`,
    excerpt: body.excerpt || content.replace(/[#*`\n]/g, '').substring(0, 120).trim(),
    starred: Boolean(body.starred),
    content,
  };

  db.notes.unshift(note);
  await persistDB();
  return send(res, 201, note);
});

router.put('/notes/:id', requireEditor, async (req, res) => {
  const db = await loadDB();
  const id = Number(req.params.id);
  const index = db.notes.findIndex(note => note.id === id);
  if (index === -1) return send(res, 404, { error: 'Note not found' });

  const body = req.body || {};
  const current = db.notes[index];
  const content = body.content !== undefined ? String(body.content) : current.content;
  const updated = {
    ...current,
    title: body.title !== undefined ? String(body.title) : current.title,
    category: body.category !== undefined ? body.category : current.category,
    notebookId: body.notebookId !== undefined ? body.notebookId || null : current.notebookId || null,
    tags: body.tags !== undefined ? normalizeTags(body.tags) : current.tags,
    content,
    excerpt: body.excerpt !== undefined ? body.excerpt : current.excerpt,
    starred: body.starred !== undefined ? Boolean(body.starred) : current.starred,
    date: body.date !== undefined ? body.date : current.date,
    readTime: body.readTime !== undefined ? body.readTime : current.readTime,
  };

  db.notes[index] = updated;
  await persistDB();
  return send(res, 200, updated);
});

router.delete('/notes/:id', requireEditor, async (req, res) => {
  const db = await loadDB();
  const id = Number(req.params.id);
  const before = db.notes.length;
  db.notes = db.notes.filter(note => note.id !== id);
  if (db.notes.length === before) return send(res, 404, { error: 'Note not found' });
  await persistDB();
  return send(res, 200, { ok: true });
});

router.get('/menus', requireViewer, async (req, res) => {
  const db = await loadDB();
  return send(res, 200, db.menus);
});

router.post('/menus', requireEditor, async (req, res) => {
  const db = await loadDB();
  const body = req.body || {};
  const label = String(body.label || '').trim();
  if (!label) return send(res, 400, { error: 'Menu label is required' });

  const menu = {
    id: `notebook_${Date.now()}`,
    label,
    type: body.type || 'notebook',
    contentKey: body.contentKey || null,
    content: body.content || null,
  };

  db.menus.push(menu);
  await persistDB();
  return send(res, 201, menu);
});

router.put('/menus/:id', requireEditor, async (req, res) => {
  const db = await loadDB();
  const index = db.menus.findIndex(menu => menu.id === req.params.id);
  if (index === -1) return send(res, 404, { error: 'Menu not found' });

  const body = req.body || {};
  db.menus[index] = {
    ...db.menus[index],
    label: body.label !== undefined ? body.label : db.menus[index].label,
    type: body.type !== undefined ? body.type : db.menus[index].type,
    contentKey: body.contentKey !== undefined ? body.contentKey : db.menus[index].contentKey,
    content: body.content !== undefined ? body.content : db.menus[index].content,
  };
  await persistDB();
  return send(res, 200, db.menus[index]);
});

router.delete('/menus/:id', requireEditor, async (req, res) => {
  const db = await loadDB();
  const { id } = req.params;
  if (id === 'docs') return send(res, 400, { error: 'The docs menu cannot be deleted' });

  const before = db.menus.length;
  db.menus = db.menus.filter(menu => menu.id !== id);
  if (db.menus.length === before) return send(res, 404, { error: 'Menu not found' });
  db.notes = db.notes.map(note => (
    note.notebookId === id ? { ...note, notebookId: null } : note
  ));
  await persistDB();
  return send(res, 200, { ok: true });
});

router.post('/upload', requireEditor, (req, res) => {
  upload.single('image')(req, res, (error) => {
    if (error) return send(res, 400, { error: error.message || 'Upload failed' });
    if (!req.file) return send(res, 400, { error: 'No file selected' });
    return send(res, 201, {
      url: `/uploads/cms/${req.file.filename}`,
      name: req.file.originalname,
    });
  });
});

export default router;
