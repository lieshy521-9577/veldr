import dotenv from 'dotenv';

dotenv.config();

const env = (key, fallback) => process.env[key] ?? fallback;
const nodeEnv = env('NODE_ENV', 'development');
const jwtSecret = process.env.JWT_SECRET || (nodeEnv === 'production' ? null : 'veldr-dev-secret-change-me');
const listEnv = (key, fallback) => env(key, fallback)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  nodeEnv,
  port: Number(env('PORT', 5000)),
  db: {
    dialect: env('DB_DIALECT', 'sqlite'),
    storage: env('DB_STORAGE', 'public/data/cms.sqlite'),
    securityStorage: env('SECURITY_DB_STORAGE', 'public/data/security.sqlite'),
    logging: env('DB_LOGGING', 'false') === 'true',
  },
  uploadDir: env('UPLOAD_DIR', 'public/uploads'),
  tempDir: env('TEMP_DIR', 'temp'),
  cors: {
    origin: listEnv('CORS_ORIGIN', 'http://localhost:5173,http://localhost:5174'),
  },
  auth: {
    jwtSecret,
    jwtExpiresIn: env('JWT_EXPIRES_IN', '12h'),
    cookieName: env('AUTH_COOKIE_NAME', 'veldr_auth'),
    cookieMaxAgeMs: Number(env('AUTH_COOKIE_MAX_AGE_MS', String(12 * 60 * 60 * 1000))),
  },
  cms: {
    dataDir: env('CMS_DATA_DIR', 'public/data/cms'),
    dbFile: env('CMS_DB_FILE', 'db.json'),
    secretFile: env('CMS_SECRET_FILE', 'secret.json'),
    uploadDir: env('CMS_UPLOAD_DIR', 'public/uploads/cms'),
    viewerPassword: env('CMS_VIEWER_PASSWORD', '11'),
    editorPassword: process.env.CMS_EDITOR_PASSWORD || null,
  },
};
