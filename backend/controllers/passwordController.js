import crypto from 'crypto';
import Password from '../models/Password.js';
import { securitySequelize } from '../config/databases.js';
import { config } from '../config/index.js';

// 默认口令（从环境变量读取）
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || '123456';

// 获取当前口令（从数据库）
const getCurrentPassword = async () => {
  try {
    const passwordRecord = await Password.findOne({
      where: { type: 'default' }
    });
    
    if (passwordRecord) {
      return passwordRecord.password;
    } else {
      // 如果数据库中没有记录，创建默认口令
      await Password.create({
        type: 'default',
        password: DEFAULT_PASSWORD,
        isDefault: true
      });
      return DEFAULT_PASSWORD;
    }
  } catch (error) {
    console.error('Error getting current password:', error);
    return DEFAULT_PASSWORD;
  }
};

// 更新口令到数据库
const updatePasswordInDB = async (newPassword) => {
  try {
    const [passwordRecord, created] = await Password.upsert({
      type: 'default',
      password: newPassword,
      isDefault: newPassword === DEFAULT_PASSWORD,
      lastModified: new Date()
    });
    
    return passwordRecord;
  } catch (error) {
    console.error('Error updating password in database:', error);
    throw error;
  }
};

/**
 * 验证口令
 */
const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    // 验证参数
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    // 验证口令格式
    if (!/^\d{6}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 6 digits'
      });
    }
    
    // 从数据库获取当前口令
    const currentPassword = await getCurrentPassword();
    
    // 验证口令
    const isValid = password === currentPassword;
    
    if (isValid) {
      // 生成认证令牌（可选，用于额外的安全验证）
      const token = crypto.randomBytes(32).toString('hex');
      
      res.json({
        success: true,
        message: 'Password verified successfully',
        token: token
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * 获取当前口令信息（不返回实际口令）
 */
const getPasswordInfo = async (req, res) => {
  try {
    const passwordRecord = await Password.findOne({
      where: { type: 'default' }
    });
    
    if (passwordRecord) {
      res.json({
        success: true,
        data: {
          isSet: true,
          length: passwordRecord.password.length,
          isDefault: passwordRecord.isDefault,
          lastModified: passwordRecord.lastModified,
          password: passwordRecord.password // 返回实际口令值
        }
      });
    } else {
      // 如果数据库中没有记录，返回默认值
      res.json({
        success: true,
        data: {
          isSet: false,
          length: 0,
          isDefault: true,
          lastModified: null,
          password: DEFAULT_PASSWORD
        }
      });
    }
  } catch (error) {
    console.error('Get password info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * 更新口令
 */
const updatePassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    // 验证参数
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    // 验证口令格式
    if (!/^\d{6}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 6 digits'
      });
    }
    
    // 更新口令到数据库
    await updatePasswordInDB(password);
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * 重置口令为默认值
 */
const resetPassword = async (req, res) => {
  try {
    // 重置口令到数据库
    await updatePasswordInDB(DEFAULT_PASSWORD);
    
    res.json({
      success: true,
      message: 'Password reset to default'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * 清除所有口令（重置为默认值）
 */
const clearAllPasswords = async (req, res) => {
  try {
    // 重置口令为默认值
    await updatePasswordInDB(DEFAULT_PASSWORD);
    
    res.json({
      success: true,
      message: 'Password reset to default value'
    });
  } catch (error) {
    console.error('Clear password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * 初始化口令（首次设置）
 */
const initializePasswords = async (req, res) => {
  try {
    const { password } = req.body;
    
    // 验证参数
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    // 验证口令格式
    if (!/^\d{6}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 6 digits'
      });
    }
    
    // 设置口令到数据库
    await updatePasswordInDB(password);
    
    res.json({
      success: true,
      message: 'Password initialized successfully'
    });
  } catch (error) {
    console.error('Initialize password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export default {
  verifyPassword,
  getPasswordInfo,
  updatePassword,
  resetPassword,
  clearAllPasswords,
  initializePasswords
};
