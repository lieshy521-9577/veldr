import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';

let app;
let databases;
let Article;
let Password;
let tempDir;

const password = '123456';

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'veldr-security-'));

  process.env.NODE_ENV = 'test';
  process.env.DB_STORAGE = path.join(tempDir, 'cms.sqlite');
  process.env.SECURITY_DB_STORAGE = path.join(tempDir, 'security.sqlite');
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '12h';
  process.env.DEFAULT_PASSWORD = password;
  process.env.CORS_ORIGIN = 'http://localhost:5173';

  ({ app } = await import('../app.js'));
  ({ databases } = await import('../config/databases.js'));
  ({ default: Article } = await import('../models/Article.js'));
  ({ default: Password } = await import('../models/Password.js'));

  await databases.main.sync({ force: true });
  await databases.security.sync({ force: true });
});

beforeEach(async () => {
  await Article.destroy({ where: {}, truncate: true });
  await Password.destroy({ where: {}, truncate: true });
  await Password.create({
    type: 'default',
    password: await bcrypt.hash(password, 12),
    isDefault: true,
    lastModified: new Date(),
  });
});

afterAll(async () => {
  await databases?.main?.close();
  await databases?.security?.close();
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

const createArticlePayload = {
  title: 'Security Test Note',
  slug: 'security-test-note',
  content: '<p>Test</p>',
  excerpt: 'Test excerpt',
  status: 'private',
};

const login = async () => {
  const agent = request.agent(app);
  const response = await agent
    .post('/api/password/verify')
    .send({ password });

  expect(response.status).toBe(200);
  expect(response.headers['set-cookie']?.[0]).toContain('veldr_auth=');
  expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
  return agent;
};

describe('security auth', () => {
  it('blocks unauthenticated protected write endpoints', async () => {
    await request(app).post('/api/articles').send(createArticlePayload).expect(401);
    await request(app).put('/api/articles/test-id').send(createArticlePayload).expect(401);
    await request(app).patch('/api/articles/test-id/status').send({ status: 'published' }).expect(401);
    await request(app).delete('/api/articles/test-id').expect(401);
    await request(app).post('/api/upload').expect(401);
    await request(app).post('/api/password/reset').expect(401);
    await request(app).post('/api/password/clear').expect(401);
    await request(app).put('/api/password/update').send({ password: '654321' }).expect(401);
    await request(app).get('/api/password/info').expect(401);
  });

  it('allows authenticated article creation and hides password info', async () => {
    const agent = await login();

    const createResponse = await agent
      .post('/api/articles')
      .send(createArticlePayload)
      .expect(201);

    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.status).toBe('private');

    const infoResponse = await agent.get('/api/password/info').expect(200);
    expect(infoResponse.body.data).toMatchObject({
      isSet: true,
      length: 6,
      isDefault: true,
    });
    expect(infoResponse.body.data.password).toBeUndefined();
  });

  it('upgrades legacy plaintext password after successful verification', async () => {
    await Password.update({
      password: '654321',
      isDefault: false,
    }, {
      where: { type: 'default' },
    });

    await request(app)
      .post('/api/password/verify')
      .send({ password: '654321' })
      .expect(200);

    const passwordRecord = await Password.findOne({ where: { type: 'default' } });
    expect(passwordRecord.password).not.toBe('654321');
    expect(passwordRecord.password.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare('654321', passwordRecord.password)).toBe(true);
  });

  it('only exposes published content to unauthenticated readers', async () => {
    const published = await Article.create({
      title: 'Published Note',
      slug: 'published-note',
      content: '<p>Published</p>',
      status: 'published',
    });
    const privateArticle = await Article.create({
      title: 'Private Note',
      slug: 'private-note',
      content: '<p>Private</p>',
      status: 'private',
    });
    const draft = await Article.create({
      title: 'Draft Note',
      slug: 'draft-note',
      content: '<p>Draft</p>',
      status: 'draft',
    });

    const listResponse = await request(app).get('/api/articles').expect(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(published.id);

    await request(app).get(`/api/articles/${published.id}`).expect(200);
    await request(app).get(`/api/articles/${privateArticle.id}`).expect(404);
    await request(app).get(`/api/articles/${draft.id}?admin=true`).expect(404);

    const agent = await login();
    await agent.get(`/api/articles/${privateArticle.id}`).expect(200);
    await agent.get(`/api/articles/${draft.id}?admin=true`).expect(200);
  });

  it('rate limits repeated invalid password attempts', async () => {
    let lastResponse;

    for (let index = 0; index < 11; index += 1) {
      lastResponse = await request(app)
        .post('/api/password/verify')
        .send({ password: '000000' });
    }

    expect(lastResponse.status).toBe(429);
  });
});
