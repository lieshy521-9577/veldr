import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.nodeEnv === 'production',
  maxAge: config.auth.cookieMaxAgeMs,
  path: '/',
};

const signAuthToken = () => jwt.sign(
  { sub: 'admin' },
  config.auth.jwtSecret,
  { expiresIn: config.auth.jwtExpiresIn }
);

const setAuthCookie = (res) => {
  const token = signAuthToken();
  res.cookie(config.auth.cookieName, token, authCookieOptions);
  return token;
};

const clearAuthCookie = (res) => {
  res.clearCookie(config.auth.cookieName, {
    ...authCookieOptions,
    maxAge: undefined,
  });
};

const readAuthToken = (req) => {
  const cookieToken = req.cookies?.[config.auth.cookieName];
  if (cookieToken) return cookieToken;

  const header = req.get('authorization') || '';
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }

  return null;
};

const authenticateRequest = (req) => {
  const token = readAuthToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    return payload?.sub === 'admin' ? payload : null;
  } catch {
    return null;
  }
};

const attachAuthState = (req, res, next) => {
  const payload = authenticateRequest(req);
  req.auth = payload ? { isAuthenticated: true, payload } : { isAuthenticated: false };
  next();
};

const requireAuth = (req, res, next) => {
  const payload = authenticateRequest(req);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  req.auth = { isAuthenticated: true, payload };
  next();
};

export {
  authCookieOptions,
  setAuthCookie,
  clearAuthCookie,
  attachAuthState,
  requireAuth,
};
