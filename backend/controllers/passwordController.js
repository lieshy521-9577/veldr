import bcrypt from 'bcryptjs';
import Password from '../models/Password.js';
import { setAuthCookie, clearAuthCookie } from '../middleware/auth.js';

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || '123456';
const BCRYPT_ROUNDS = 12;

const isSixDigitPassword = (password) => /^\d{6}$/.test(String(password || ''));
const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(String(value || ''));

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

const findPasswordRecord = () => Password.findOne({
  where: { type: 'default' },
});

const createPasswordRecord = async (password = DEFAULT_PASSWORD) => Password.create({
  type: 'default',
  password: await hashPassword(password),
  isDefault: password === DEFAULT_PASSWORD,
  lastModified: new Date(),
});

const getOrCreatePasswordRecord = async () => {
  const passwordRecord = await findPasswordRecord();
  if (passwordRecord) return passwordRecord;
  return createPasswordRecord();
};

const updatePasswordInDB = async (newPassword) => {
  const hashedPassword = await hashPassword(newPassword);
  const [passwordRecord] = await Password.upsert({
    type: 'default',
    password: hashedPassword,
    isDefault: newPassword === DEFAULT_PASSWORD,
    lastModified: new Date(),
  });

  return passwordRecord;
};

const verifyAgainstStoredPassword = async (password, passwordRecord) => {
  const storedPassword = String(passwordRecord.password || '');

  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(password, storedPassword);
  }

  const isLegacyMatch = password === storedPassword;
  if (isLegacyMatch) {
    await updatePasswordInDB(password);
  }
  return isLegacyMatch;
};

const passwordInfoFromRecord = (passwordRecord) => ({
  isSet: Boolean(passwordRecord),
  length: 6,
  isDefault: Boolean(passwordRecord?.isDefault),
  lastModified: passwordRecord?.lastModified || null,
});

const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    if (!isSixDigitPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 6 digits',
      });
    }

    const passwordRecord = await getOrCreatePasswordRecord();
    const isValid = await verifyAgainstStoredPassword(password, passwordRecord);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    setAuthCookie(res);
    return res.json({
      success: true,
      message: 'Password verified successfully',
    });
  } catch (error) {
    console.error('Password verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const logout = async (req, res) => {
  clearAuthCookie(res);
  return res.json({
    success: true,
    message: 'Logged out',
  });
};

const getPasswordInfo = async (req, res) => {
  try {
    const passwordRecord = await getOrCreatePasswordRecord();

    return res.json({
      success: true,
      data: passwordInfoFromRecord(passwordRecord),
    });
  } catch (error) {
    console.error('Get password info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    if (!isSixDigitPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 6 digits',
      });
    }

    await updatePasswordInDB(password);
    clearAuthCookie(res);

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    await updatePasswordInDB(DEFAULT_PASSWORD);
    clearAuthCookie(res);

    return res.json({
      success: true,
      message: 'Password reset to default',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const clearAllPasswords = async (req, res) => {
  try {
    await updatePasswordInDB(DEFAULT_PASSWORD);
    clearAuthCookie(res);

    return res.json({
      success: true,
      message: 'Password reset to default value',
    });
  } catch (error) {
    console.error('Clear password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const initializePasswords = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    if (!isSixDigitPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 6 digits',
      });
    }

    await updatePasswordInDB(password);
    clearAuthCookie(res);

    return res.json({
      success: true,
      message: 'Password initialized successfully',
    });
  } catch (error) {
    console.error('Initialize password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export {
  getOrCreatePasswordRecord,
  verifyAgainstStoredPassword,
};

export default {
  verifyPassword,
  logout,
  getPasswordInfo,
  updatePassword,
  resetPassword,
  clearAllPasswords,
  initializePasswords,
};
