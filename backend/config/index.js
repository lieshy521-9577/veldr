import dotenv from 'dotenv';

dotenv.config();

const env = (key, fallback) => process.env[key] ?? fallback;

export const config = {
  nodeEnv: env('NODE_ENV', 'development'),
  port: Number(env('PORT', 5000)),
  db: {
    dialect: env('DB_DIALECT', 'sqlite'),
    storage: env('DB_STORAGE', 'public/data/cms.sqlite'),
    logging: env('DB_LOGGING', 'false') === 'true',
  },
  uploadDir: env('UPLOAD_DIR', 'public/uploads'),
  tempDir: env('TEMP_DIR', 'temp'),
  cors: {
    origin: env('CORS_ORIGIN', '*'),
  },
};


