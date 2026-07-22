import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== 清理安全数据库 ===\n');

const securityDbPath = path.join(__dirname, 'security.sqlite');

try {
  const securityDb = new Sequelize({
    dialect: 'sqlite',
    storage: securityDbPath,
    logging: false
  });

  await securityDb.authenticate();
  console.log('✅ 安全数据库连接成功');

  // 获取所有表
  const [tables] = await securityDb.query("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('当前表列表:', tables.map(t => t.name));

  // 删除不应该在安全数据库中的表
  const tablesToRemove = ['Articles'];
  
  for (const tableName of tablesToRemove) {
    if (tables.some(t => t.name === tableName)) {
      console.log(`正在删除表: ${tableName}`);
      await securityDb.query(`DROP TABLE IF EXISTS ${tableName}`);
      console.log(`✅ 已删除表: ${tableName}`);
    }
  }

  // 重新检查表列表
  const [remainingTables] = await securityDb.query("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('\n清理后的表列表:', remainingTables.map(t => t.name));

  // 检查passwords表的数据
  if (remainingTables.some(t => t.name === 'passwords')) {
    const [passwords] = await securityDb.query(`SELECT id, type, isDefault, lastModified FROM passwords`);
    console.log('\n密码记录:');
    passwords.forEach(pwd => {
      console.log(`  - ${pwd.type} (默认: ${pwd.isDefault}) - ${pwd.lastModified}`);
    });
  }

  await securityDb.close();
  console.log('\n✅ 安全数据库清理完成');

} catch (error) {
  console.error('❌ 清理失败:', error);
}
