import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageCleanupService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../public/uploads');
    this.cmsDbPath = path.join(__dirname, '../public/data/cms.sqlite');
    this.usedFiles = new Set();
    this.unusedFiles = [];
    this.deletedFiles = [];
    this.errors = [];
  }

  // 连接数据库
  async connectDatabase() {
    try {
      this.sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: this.cmsDbPath,
        logging: false
      });
      
      await this.sequelize.authenticate();
      console.log('✅ 数据库连接成功');
      return true;
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      return false;
    }
  }

  // 从文章内容中提取图片URL
  extractImageUrls(content) {
    const urls = [];
    
    if (!content) return urls;
    
    // 匹配 <img src="..."> 标签
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }
    
    // 匹配 markdown 格式的图片 ![alt](url)
    const markdownImgRegex = /!\[[^\]]*\]\(([^)]+)\)/gi;
    while ((match = markdownImgRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }
    
    // 匹配 base64 图片 (data:image/...)
    const base64Regex = /data:image\/[^;]+;base64,[^"'\s]+/gi;
    while ((match = base64Regex.exec(content)) !== null) {
      // base64 图片不占用文件，跳过
    }
    
    return urls;
  }

  // 从URL中提取文件名
  extractFilename(url) {
    // 处理相对路径和绝对路径
    let filename = path.basename(url);
    
    // 移除查询参数
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }
    
    // 移除锚点
    if (filename.includes('#')) {
      filename = filename.split('#')[0];
    }
    
    return filename;
  }

  // 扫描数据库中的已使用文件
  async scanUsedFiles() {
    try {
      console.log('🔍 扫描数据库中的已使用文件...');
      
      const [articles] = await this.sequelize.query(`
        SELECT content, featuredImage 
        FROM Articles 
        WHERE content IS NOT NULL OR featuredImage IS NOT NULL
      `);

      let totalImages = 0;
      
      articles.forEach(article => {
        // 检查特色图片
        if (article.featuredImage) {
          const filename = this.extractFilename(article.featuredImage);
          this.usedFiles.add(filename);
          totalImages++;
        }

        // 检查文章内容中的图片
        if (article.content) {
          const imageUrls = this.extractImageUrls(article.content);
          imageUrls.forEach(url => {
            const filename = this.extractFilename(url);
            this.usedFiles.add(filename);
            totalImages++;
          });
        }
      });

      console.log(`✅ 找到 ${this.usedFiles.size} 个已使用的图片文件`);
      console.log(`📊 总共检查了 ${totalImages} 个图片引用`);
      
      return true;
    } catch (error) {
      console.error('❌ 扫描数据库时出错:', error.message);
      this.errors.push(`数据库扫描错误: ${error.message}`);
      return false;
    }
  }

  // 扫描上传目录中的文件
  scanUploadedFiles() {
    try {
      console.log('📁 扫描上传目录...');
      
      if (!fs.existsSync(this.uploadsDir)) {
        console.log('❌ 上传目录不存在:', this.uploadsDir);
        this.errors.push(`上传目录不存在: ${this.uploadsDir}`);
        return false;
      }

      const files = fs.readdirSync(this.uploadsDir);
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'].includes(ext);
      });

      console.log(`📊 上传目录中共有 ${imageFiles.length} 个图片文件`);

      // 找出未使用的文件
      this.unusedFiles = imageFiles.filter(file => !this.usedFiles.has(file));
      
      console.log(`🗑️  发现 ${this.unusedFiles.length} 个未使用的文件`);
      
      return true;
    } catch (error) {
      console.error('❌ 扫描上传目录时出错:', error.message);
      this.errors.push(`目录扫描错误: ${error.message}`);
      return false;
    }
  }

  // 显示未使用文件的详细信息
  showUnusedFiles() {
    if (this.unusedFiles.length === 0) {
      console.log('🎉 没有发现未使用的文件！');
      return;
    }

    console.log('\n📋 未使用的文件列表:');
    console.log('=' .repeat(60));
    
    let totalSize = 0;
    
    this.unusedFiles.forEach((file, index) => {
      try {
        const filePath = path.join(this.uploadsDir, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024).toFixed(2);
        const modified = stats.mtime.toLocaleDateString();
        
        console.log(`${index + 1}. ${file}`);
        console.log(`   大小: ${size} KB`);
        console.log(`   修改时间: ${modified}`);
        console.log(`   路径: ${filePath}`);
        console.log('');
        
        totalSize += stats.size;
      } catch (error) {
        console.log(`${index + 1}. ${file} (无法获取文件信息)`);
        this.errors.push(`无法获取文件信息: ${file} - ${error.message}`);
      }
    });

    console.log(`💾 总大小: ${(totalSize / 1024).toFixed(2)} KB (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
  }

  // 创建备份
  async createBackup() {
    const backupDir = path.join(__dirname, '../public/backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `unused-images-backup-${timestamp}`);
    
    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }
      
      console.log(`📦 创建备份到: ${backupPath}`);
      
      for (const file of this.unusedFiles) {
        const sourcePath = path.join(this.uploadsDir, file);
        const backupFilePath = path.join(backupPath, file);
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, backupFilePath);
        }
      }
      
      console.log(`✅ 备份完成: ${this.unusedFiles.length} 个文件`);
      return backupPath;
    } catch (error) {
      console.error('❌ 创建备份失败:', error.message);
      this.errors.push(`备份创建失败: ${error.message}`);
      return null;
    }
  }

  // 删除未使用的文件
  async deleteUnusedFiles(createBackup = true) {
    if (this.unusedFiles.length === 0) {
      console.log('🎉 没有需要删除的文件！');
      return { success: true, deleted: 0, errors: 0 };
    }

    console.log('\n🗑️  开始删除未使用的文件...');
    
    let deletedCount = 0;
    let errorCount = 0;
    let backupPath = null;

    // 创建备份
    if (createBackup) {
      backupPath = await this.createBackup();
    }

    for (const file of this.unusedFiles) {
      try {
        const filePath = path.join(this.uploadsDir, file);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ 已删除: ${file}`);
          this.deletedFiles.push(file);
          deletedCount++;
        } else {
          console.log(`⚠️  文件不存在: ${file}`);
        }
      } catch (error) {
        console.error(`❌ 删除失败: ${file} - ${error.message}`);
        this.errors.push(`删除失败: ${file} - ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 删除完成:`);
    console.log(`   成功: ${deletedCount} 个`);
    console.log(`   失败: ${errorCount} 个`);
    if (backupPath) {
      console.log(`   备份: ${backupPath}`);
    }

    return { 
      success: errorCount === 0, 
      deleted: deletedCount, 
      errors: errorCount,
      backupPath 
    };
  }

  // 生成报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uploadsDir: this.uploadsDir,
      totalFiles: this.usedFiles.size + this.unusedFiles.length,
      usedFiles: this.usedFiles.size,
      unusedFiles: this.unusedFiles.length,
      deletedFiles: this.deletedFiles.length,
      errors: this.errors.length,
      errorDetails: this.errors
    };

    const reportPath = path.join(__dirname, '../public/data/cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 报告已保存到: ${reportPath}`);
    return report;
  }

  // 主执行方法
  async run(options = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🧹 开始清理未使用的图片文件...\n');
      console.log(`📅 开始时间: ${new Date().toLocaleString()}`);
      console.log(`📁 上传目录: ${this.uploadsDir}`);
      console.log(`🗄️  数据库: ${this.cmsDbPath}\n`);
      
      // 连接数据库
      const dbConnected = await this.connectDatabase();
      if (!dbConnected) {
        throw new Error('无法连接到数据库');
      }
      
      // 扫描已使用的文件
      const scanSuccess = await this.scanUsedFiles();
      if (!scanSuccess) {
        throw new Error('扫描数据库失败');
      }
      
      // 扫描上传目录
      const dirScanSuccess = this.scanUploadedFiles();
      if (!dirScanSuccess) {
        throw new Error('扫描上传目录失败');
      }
      
      // 显示未使用的文件
      this.showUnusedFiles();
      
      // 删除文件
      if (options.delete) {
        const result = await this.deleteUnusedFiles(options.backup !== false);
        
        if (!result.success) {
          console.log('⚠️  部分文件删除失败，请检查错误信息');
        }
      } else {
        console.log('\n⚠️  预览模式 - 要实际删除文件，请使用 --delete 参数');
      }
      
      // 生成报告
      const report = this.generateReport();
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`\n✨ 清理完成！耗时: ${duration}秒`);
      console.log(`📊 统计: 已使用 ${report.usedFiles} 个，未使用 ${report.unusedFiles} 个`);
      
      return report;
      
    } catch (error) {
      console.error('💥 清理过程中出错:', error.message);
      this.errors.push(`执行错误: ${error.message}`);
      this.generateReport();
      throw error;
    } finally {
      if (this.sequelize) {
        await this.sequelize.close();
      }
    }
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const options = {
  delete: args.includes('--delete') || args.includes('-d'),
  backup: !args.includes('--no-backup'),
  help: args.includes('--help') || args.includes('-h')
};

if (options.help) {
  console.log(`
🧹 图片清理工具

用法:
  node cleanup-unused-images.js [选项]

选项:
  --delete, -d     实际删除未使用的文件
  --no-backup      不创建备份
  --help, -h       显示帮助信息

示例:
  node cleanup-unused-images.js                    # 预览模式
  node cleanup-unused-images.js --delete           # 删除文件并创建备份
  node cleanup-unused-images.js --delete --no-backup  # 删除文件但不创建备份
`);
  process.exit(0);
}

// 执行清理
const cleanup = new ImageCleanupService();
cleanup.run(options).then((report) => {
  if (report.errors > 0) {
    console.log(`\n⚠️  发现 ${report.errors} 个错误，请检查日志`);
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch(error => {
  console.error('💥 清理失败:', error.message);
  process.exit(1);
});
