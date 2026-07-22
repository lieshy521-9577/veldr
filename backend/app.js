import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import morgan from 'morgan';
import methodOverride from 'method-override';
import { sequelize } from './config/databases.js';
import apiRoutes from './routes/index.js';
import cors from 'cors';
import { config } from './config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize app
const app = express();
const PORT = config.port;

// Middleware
app.use(express.json({ limit: '20mb' })); // 增加JSON限制以支持更大的请求
app.use(express.urlencoded({ extended: true, limit: '20mb' })); // 增加URL编码限制
app.use(methodOverride('_method'));
app.use(morgan('dev'));
app.use(cors({ origin: config.cors.origin }));

// Static folders
// app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API Routes
app.use('/api', apiRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (should be last)
import { errorHandler, notFound } from './middleware/errorHandler.js';
app.use(notFound);
app.use(errorHandler);

export { app, PORT };

// This file is the main Express application setup and configuration.
