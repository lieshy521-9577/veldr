import { Op } from 'sequelize';
import Article from '../models/Article.js';

export const findAndCount = async ({ where, order, limit, offset }) => {
  return Article.findAndCountAll({ where, order, limit, offset });
};

export const findById = (id) => Article.findByPk(id);

export const findBySlug = (slug) => Article.findOne({ where: { slug } });

export const create = (payload) => Article.create(payload);

export const update = async (article, payload) => article.update(payload);

export const destroy = async (article) => article.destroy();

export const buildWhere = ({ status, search }) => {
  const where = {};
  if (status && ['draft', 'private', 'published'].includes(status)) {
    where.status = status;
  }
  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { content: { [Op.like]: `%${search}%` } },
    ];
  }
  return where;
};


