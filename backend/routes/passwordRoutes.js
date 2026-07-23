import express from 'express';
import rateLimit from 'express-rate-limit';
import passwordController from '../controllers/passwordController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const verifyPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password attempts. Please try again later.',
  },
});

router.post('/verify', verifyPasswordLimiter, passwordController.verifyPassword);
router.post('/logout', passwordController.logout);

router.get('/info', requireAuth, passwordController.getPasswordInfo);
router.put('/update', requireAuth, passwordController.updatePassword);
router.post('/reset', requireAuth, passwordController.resetPassword);
router.post('/clear', requireAuth, passwordController.clearAllPasswords);
router.post('/initialize', requireAuth, passwordController.initializePasswords);

export default router;
