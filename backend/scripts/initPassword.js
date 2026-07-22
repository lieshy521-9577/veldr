import { testConnections, syncDatabases } from '../config/databases.js';
import Password from '../models/Password.js';
import Article from '../models/Article.js';

/**
 * 初始化密码表
 * 如果数据库中没有密码记录，创建默认密码
 */
// 只初始化密码，不重复连接数据库
const initPasswordOnly = async () => {
  try {
    console.log('正在初始化密码表...');
    
    // 检查是否已有密码记录
    const existingPassword = await Password.findOne({
      where: { type: 'default' }
    });
    
    if (!existingPassword) {
      // 创建默认密码记录
      const defaultPassword = process.env.DEFAULT_PASSWORD || '123456';
      
      await Password.create({
        type: 'default',
        password: defaultPassword,
        isDefault: true,
        lastModified: new Date()
      });
      
      console.log(`✅ 默认密码已创建: ${defaultPassword}`);
    } else {
      console.log('✅ 密码记录已存在，无需初始化');
      console.log(`当前密码: ${existingPassword.password}`);
    }
    
    console.log('密码表初始化完成');
  } catch (error) {
    console.error('❌ 密码表初始化失败:', error);
    throw error;
  }
};

// 完整的初始化函数（包含数据库连接和同步）
const initPassword = async () => {
  try {
    console.log('正在初始化密码表...');
    
    // 测试所有数据库连接
    const connected = await testConnections();
    if (!connected) {
      throw new Error('数据库连接失败');
    }
    
    // 同步所有数据库模型
    const synced = await syncDatabases();
    if (!synced) {
      throw new Error('数据库同步失败');
    }
    
    // 检查是否已有密码记录
    const existingPassword = await Password.findOne({
      where: { type: 'default' }
    });
    
    if (existingPassword) {
      console.log('✅ 密码记录已存在，无需初始化');
      console.log(`当前密码: ${existingPassword.password}`);
    } else {
      // 创建默认密码记录
      const defaultPassword = process.env.DEFAULT_PASSWORD || '123456';
      
      await Password.create({
        type: 'default',
        password: defaultPassword,
        isDefault: true,
        lastModified: new Date()
      });
      
      console.log(`✅ 默认密码已创建: ${defaultPassword}`);
    }
    
    console.log('密码表初始化完成');
  } catch (error) {
    console.error('❌ 密码表初始化失败:', error);
    throw error;
  }
};

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  initPassword()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

export { initPassword, initPasswordOnly };
export default initPassword;
