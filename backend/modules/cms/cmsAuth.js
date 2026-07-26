import {
  getOrCreatePasswordRecord,
  updatePasswordInDB,
  verifyAgainstStoredPassword,
  onPasswordChange,
} from '../../controllers/passwordController.js';
import { setAuthCookie } from '../../middleware/auth.js';

const isSixDigitPassword = (password) => /^\d{6}$/.test(String(password || ''));

const accessKeyOf = (req) => req.get('X-Access-Key') || req.query?.token || req.query?.k || '';

// bcrypt costs ~100ms per compare; without this cache every keyed request pays it
const VERIFIED_KEY_TTL_MS = 5 * 60 * 1000;
let verifiedKey = null;
let verifiedKeyAt = 0;

const invalidateVerifiedKey = () => {
  verifiedKey = null;
  verifiedKeyAt = 0;
};

// Covers password changes from both the CMS flow and the Veldr admin flow
onPasswordChange(invalidateVerifiedKey);

const verifyEditorPassword = async (key) => {
  if (!isSixDigitPassword(key)) return false;
  if (verifiedKey === key && Date.now() - verifiedKeyAt < VERIFIED_KEY_TTL_MS) {
    return true;
  }
  const passwordRecord = await getOrCreatePasswordRecord();
  const isValid = await verifyAgainstStoredPassword(key, passwordRecord);
  if (isValid) {
    verifiedKey = key;
    verifiedKeyAt = Date.now();
  }
  return isValid;
};

const setSharedEditorPassword = async (nextPassword) => {
  const password = String(nextPassword || '').trim();
  if (!isSixDigitPassword(password)) {
    const error = new Error('Editor password must be 6 digits');
    error.status = 400;
    throw error;
  }
  await updatePasswordInDB(password);
};

const roleOf = async (key) => {
  if (!key) return null;
  if (await verifyEditorPassword(key)) return 'editor';
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
  // 签发 HttpOnly Cookie 会话，前端无需再持久化明文密钥
  setAuthCookie(res);
  return res.status(200).json({ role });
};

const resetCmsAuthForTests = () => {
  invalidateVerifiedKey();
};

export {
  accessKeyOf,
  verifyEditorPassword,
  setSharedEditorPassword,
  roleOf,
  requireViewer,
  requireEditor,
  authenticateCms,
  resetCmsAuthForTests,
};
