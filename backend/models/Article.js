import { DataTypes } from 'sequelize';
import { sequelize } from '../config/databases.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Title cannot be empty'
      },
      len: {
        args: [1, 255],
        msg: 'Title must be between 1 and 255 characters'
      }
    }
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Slug cannot be empty'
      },
      is: {
        args: /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
        msg: 'Slug can only contain lowercase letters, numbers, and hyphens'
      }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'private', 'published'),
    defaultValue: 'draft',
    validate: {
      isIn: {
        args: [['draft', 'private', 'published']],
        msg: 'Status must be draft, private, or published'
      }
    }
  },
  featuredImage: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: (article) => {
      console.log('🔍 beforeValidate hook triggered:', {
        title: article.title,
        slug: article.slug,
        hasTitle: !!article.title,
        hasSlug: !!article.slug,
        isNewRecord: article.isNewRecord,
        changed: article.changed()
      });
      
      // Generate slug from title if not provided
      if (article.title && !article.slug) {
        const generatedSlug = article.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        console.log('🔄 Generating slug from title:', {
          originalTitle: article.title,
          generatedSlug: generatedSlug
        });
        
        article.slug = generatedSlug;
      }
      
      console.log('✅ Final slug before validation:', article.slug);
    },
    beforeDestroy: async (article) => {
      // Delete associated featured image when article is deleted
      if (article.featuredImage) {
        const imagePath = path.join(__dirname, '../public/uploads', article.featuredImage);
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (error) {
          console.error('Error deleting featured image:', error);
        }
      }
    }
  }
});

export default Article;
