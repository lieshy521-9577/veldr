import express from 'express';
import passwordController from '../controllers/passwordController.js';

const router = express.Router();

// 验证口令
router.post('/verify', passwordController.verifyPassword);

// 获取口令信息
router.get('/info', passwordController.getPasswordInfo);

// 更新口令
router.put('/update', passwordController.updatePassword);

// 重置口令
router.post('/reset', passwordController.resetPassword);

// 清除所有口令
router.post('/clear', passwordController.clearAllPasswords);

// 初始化口令
router.post('/initialize', passwordController.initializePasswords);

export default router;
