import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../..');

const resolveFromBackend = (targetPath) => path.resolve(backendRoot, targetPath);

const dataDir = resolveFromBackend(config.cms.dataDir);
const uploadDir = resolveFromBackend(config.cms.uploadDir);
const dbFile = path.join(dataDir, config.cms.dbFile);
const secretFile = path.join(dataDir, config.cms.secretFile);

let db = null;
let writeChain = Promise.resolve();

const defaultDB = () => ({
  notes: [],
  menus: [
    { id: 'docs', label: 'Docs', type: 'docs' },
  ],
});

const ensureRuntimeDirs = async () => {
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.mkdir(uploadDir, { recursive: true });
};

const loadDB = async () => {
  if (db) return db;

  await ensureRuntimeDirs();

  try {
    const raw = await fsp.readFile(dbFile, 'utf8');
    db = JSON.parse(raw);
  } catch {
    db = defaultDB();
    await persistDB();
  }

  if (!Array.isArray(db.notes)) db.notes = [];
  if (!Array.isArray(db.menus)) db.menus = [];
  return db;
};

const persistDB = async () => {
  await ensureRuntimeDirs();
  const tmp = `${dbFile}.tmp`;
  const json = JSON.stringify(db || defaultDB(), null, 2);

  writeChain = writeChain
    .then(() => fsp.writeFile(tmp, json))
    .then(() => fsp.rename(tmp, dbFile));

  return writeChain;
};

const resetDBForTests = (nextDB = null) => {
  db = nextDB;
  writeChain = Promise.resolve();
};

const nextId = (items) => items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map(tag => String(tag).trim()).filter(Boolean);
  if (typeof tags === 'string') return tags.split(',').map(tag => tag.trim()).filter(Boolean);
  return [];
};

const readSecret = () => {
  try {
    return JSON.parse(fs.readFileSync(secretFile, 'utf8'));
  } catch {
    return null;
  }
};

const writeSecret = async (secret) => {
  await ensureRuntimeDirs();
  await fsp.writeFile(secretFile, JSON.stringify(secret, null, 2));
};

export {
  dataDir,
  uploadDir,
  dbFile,
  secretFile,
  loadDB,
  persistDB,
  resetDBForTests,
  nextId,
  normalizeTags,
  readSecret,
  writeSecret,
};
