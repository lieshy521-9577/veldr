import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== 数据库检查工具 ===\n');

// 检查文件是否存在
const cmsDbPath = path.join(__dirname, 'cms.sqlite');
const securityDbPath = path.join(__dirname, 'security.sqlite');

console.log('文件检查:');
console.log(`CMS数据库: ${cmsDbPath}`);
console.log(`存在: ${fs.existsSync(cmsDbPath)}`);
console.log(`大小: ${fs.existsSync(cmsDbPath) ? fs.statSync(cmsDbPath).size + ' bytes' : 'N/A'}`);

console.log(`\n安全数据库: ${securityDbPath}`);
console.log(`存在: ${fs.existsSync(securityDbPath)}`);
console.log(`大小: ${fs.existsSync(securityDbPath) ? fs.statSync(securityDbPath).size + ' bytes' : 'N/A'}`);

// 连接CMS数据库
console.log('\n=== CMS数据库 (文章数据) ===');
try {
  const cmsDb = new Sequelize({
    dialect: 'sqlite',
    storage: cmsDbPath,
    logging: false
  });

  await cmsDb.authenticate();
  console.log('✅ 连接成功');

  // 获取所有表
  const [tables] = await cmsDb.query("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('表列表:', tables.map(t => t.name));

  // 检查每个表的数据
  for (const table of tables) {
    const [count] = await cmsDb.query(`SELECT COUNT(*) as count FROM ${table.name}`);
    console.log(`${table.name}: ${count[0].count} 条记录`);
    
    // 如果是Articles表，显示一些示例数据
    if (table.name === 'Articles') {
      const [articles] = await cmsDb.query(`SELECT id, title, status, createdAt FROM ${table.name} LIMIT 5`);
      console.log('  示例文章:');
      articles.forEach(article => {
        console.log(`    - ${article.title} (${article.status}) - ${article.createdAt}`);
      });
    }
  }

  await cmsDb.close();
} catch (error) {
  console.log('❌ CMS数据库连接失败:', error.message);
}

// 连接安全数据库
console.log('\n=== 安全数据库 (密码数据) ===');
try {
  const securityDb = new Sequelize({
    dialect: 'sqlite',
    storage: securityDbPath,
    logging: false
  });

  await securityDb.authenticate();
  console.log('✅ 连接成功');

  // 获取所有表
  const [tables] = await securityDb.query("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('表列表:', tables.map(t => t.name));

  // 检查每个表的数据
  for (const table of tables) {
    const [count] = await securityDb.query(`SELECT COUNT(*) as count FROM ${table.name}`);
    console.log(`${table.name}: ${count[0].count} 条记录`);
    
    // 如果是Passwords表，显示密码信息（不显示实际密码）
    if (table.name === 'Passwords') {
      const [passwords] = await securityDb.query(`SELECT id, type, isDefault, lastModified FROM ${table.name}`);
      console.log('  密码记录:');
      passwords.forEach(pwd => {
        console.log(`    - ${pwd.type} (默认: ${pwd.isDefault}) - ${pwd.lastModified}`);
      });
    }
  }

  await securityDb.close();
} catch (error) {
  console.log('❌ 安全数据库连接失败:', error.message);
}

console.log('\n=== 检查完成 ===');
