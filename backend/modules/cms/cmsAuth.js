import crypto from 'crypto';
import { config } from '../../config/index.js';
import { readSecret, writeSecret } from './cmsStore.js';

let editorPassword = config.cms.editorPassword;

const getEditorPassword = async () => {
  if (editorPassword) return editorPassword;

  const secret = readSecret();
  if (secret?.editorPassword) {
    editorPassword = String(secret.editorPassword);
    return editorPassword;
  }

  editorPassword = String(crypto.randomInt(100000, 1000000));
  await writeSecret({ editorPassword });
  return editorPassword;
};

const accessKeyOf = (req) => req.get('X-Access-Key') || req.query?.token || req.query?.k || '';

const roleOf = async (key) => {
  if (!key) return null;
  if (key === await getEditorPassword()) return 'editor';
  return null;
};

const requireViewer = async (req, res, next) => {
  if (req.auth?.isAuthenticated) {
    req.cmsRole = 'editor';
    return next();
  }

  const role = await roleOf(accessKeyOf(req));
  req.cmsRole = role || 'viewer';
  return next();
};

const requireEditor = async (req, res, next) => {
  if (req.auth?.isAuthenticated) {
    req.cmsRole = 'editor';
    return next();
  }

  const role = await roleOf(accessKeyOf(req));
  if (role !== 'editor') {
    return res.status(403).json({ error: 'Editor access required' });
  }

  req.cmsRole = role;
  return next();
};

const authenticateCms = async (req, res) => {
  const key = req.body?.key || '';
  const role = await roleOf(key);
  if (role !== 'editor') {
    return res.status(401).json({ error: 'Invalid editor key' });
  }
  return res.status(200).json({ role });
};

const resetCmsAuthForTests = () => {
  editorPassword = config.cms.editorPassword;
};

export {
  accessKeyOf,
  getEditorPassword,
  roleOf,
  requireViewer,
  requireEditor,
  authenticateCms,
  resetCmsAuthForTests,
};
