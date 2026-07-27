import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';

let app;
let databases;
let Password;
let resetDBForTests;
let resetCmsAuthForTests;
let tempDir;

const editorKey = '123456';

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'veldr-cms-'));

  process.env.NODE_ENV = 'test';
  process.env.DB_STORAGE = path.join(tempDir, 'veldr.sqlite');
  process.env.SECURITY_DB_STORAGE = path.join(tempDir, 'security.sqlite');
  process.env.CMS_DATA_DIR = path.join(tempDir, 'cms-data');
  process.env.CMS_UPLOAD_DIR = path.join(tempDir, 'cms-uploads');
  process.env.JWT_SECRET = 'test-secret';
  process.env.DEFAULT_PASSWORD = '123456';

  ({ app } = await import('../app.js'));
  ({ databases } = await import('../config/databases.js'));
  ({ default: Password } = await import('../models/Password.js'));
  ({ resetDBForTests } = await import('../modules/cms/cmsStore.js'));
  ({ resetCmsAuthForTests } = await import('../modules/cms/cmsAuth.js'));

  await databases.main.sync({ force: true });
  await databases.security.sync({ force: true });
});

beforeEach(async () => {
  resetCmsAuthForTests();

  await Password.destroy({ where: {}, truncate: true });
  await Password.create({
    type: 'default',
    password: await bcrypt.hash('123456', 12),
    isDefault: true,
    lastModified: new Date(),
  });

  resetDBForTests({
    notes: [
      {
        id: 1,
        title: 'CMS Note',
        category: 'docs',
        notebookId: null,
        tags: ['cms'],
        content: 'CMS content',
        excerpt: 'CMS content',
        starred: false,
        date: '2026-07-23',
        readTime: '1 min',
        version: 1,
        createdAt: '2026-07-23T00:00:00.000Z',
        updatedAt: '2026-07-23T00:00:00.000Z',
      },
    ],
    menus: [
      { id: 'docs', label: 'Docs', type: 'docs' },
    ],
    categories: [
      { id: 'work', label: '工作' },
      { id: 'learn', label: '学习' },
    ],
  });
});

afterAll(async () => {
  await databases?.main?.close();
  await databases?.security?.close();
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

describe('unified CMS module', () => {
  it('authenticates editor access key only', async () => {
    await request(app)
      .post('/api/cms/auth')
      .send({ key: 'viewer-no-longer-needed' })
      .expect(401);

    await request(app)
      .post('/api/cms/auth')
      .send({ key: editorKey })
      .expect(200)
      .expect(({ body }) => expect(body.role).toBe('editor'));
  });

  it('allows anonymous reads but blocks anonymous writes', async () => {
    await request(app)
      .get('/api/cms/notes')
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));

    await request(app)
      .post('/api/cms/notes')
      .send({ title: 'Blocked', content: 'Nope' })
      .expect(403);
  });

  it('allows editor CRUD for notes and notebook menus', async () => {
    const category = await request(app)
      .post('/api/cms/categories')
      .set('X-Access-Key', editorKey)
      .send({ label: '强身健体' })
      .expect(201);

    expect(category.body.label).toBe('强身健体');

    await request(app)
      .put(`/api/cms/categories/${category.body.id}`)
      .set('X-Access-Key', editorKey)
      .send({ label: '健康' })
      .expect(200)
      .expect(({ body }) => expect(body.label).toBe('健康'));

    const menu = await request(app)
      .post('/api/cms/menus')
      .set('X-Access-Key', editorKey)
      .send({ label: 'Guide' })
      .expect(201);

    expect(menu.body.type).toBe('notebook');

    const note = await request(app)
      .post('/api/cms/notes')
      .set('X-Access-Key', editorKey)
      .send({ title: 'New CMS Note', content: 'Hello CMS', category: category.body.id, tags: 'one,two', notebookId: menu.body.id })
      .expect(201);

    expect(note.body.id).toBe(2);
    expect(note.body.tags).toEqual(['one', 'two']);
    expect(note.body.category).toBe(category.body.id);
    expect(note.body.notebookId).toBe(menu.body.id);
    expect(note.body.version).toBe(1);
    expect(note.body.updatedAt).toBeTruthy();

    await request(app)
      .get(`/api/cms/notes?notebookId=${menu.body.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].id).toBe(note.body.id);
      });

    await request(app)
      .put(`/api/cms/notes/${note.body.id}`)
      .set('X-Access-Key', editorKey)
      .send({ starred: true, version: note.body.version })
      .expect(200)
      .expect(({ body }) => {
        expect(body.starred).toBe(true);
        expect(body.version).toBe(2);
      });

    await request(app)
      .delete(`/api/cms/menus/${menu.body.id}`)
      .set('X-Access-Key', editorKey)
      .expect(200);

    await request(app)
      .get(`/api/cms/notes/${note.body.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.notebookId).toBeNull());

    await request(app)
      .delete(`/api/cms/categories/${category.body.id}`)
      .set('X-Access-Key', editorKey)
      .expect(200);

    await request(app)
      .get(`/api/cms/notes/${note.body.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.category).toBe('work'));
  });

  it('rejects stale note updates with a version conflict', async () => {
    await request(app)
      .put('/api/cms/notes/1')
      .set('X-Access-Key', editorKey)
      .send({ title: 'Fresh update', version: 1 })
      .expect(200)
      .expect(({ body }) => expect(body.version).toBe(2));

    await request(app)
      .put('/api/cms/notes/1')
      .set('X-Access-Key', editorKey)
      .send({ title: 'Stale update', version: 1 })
      .expect(409)
      .expect(({ body }) => {
        expect(body.code).toBe('VERSION_CONFLICT');
        expect(body.current.title).toBe('Fresh update');
        expect(body.current.version).toBe(2);
      });

    await request(app)
      .put('/api/cms/notes/1')
      .set('X-Access-Key', editorKey)
      .send({ title: 'Forced update', version: 1, force: true })
      .expect(200)
      .expect(({ body }) => {
        expect(body.title).toBe('Forced update');
        expect(body.version).toBe(3);
      });
  });

  it('allows editor password changes from the CMS API', async () => {
    await request(app)
      .put('/api/cms/password')
      .set('X-Access-Key', editorKey)
      .send({ currentKey: 'wrong1', newKey: '111222' })
      .expect(401);

    await request(app)
      .put('/api/cms/password')
      .set('X-Access-Key', editorKey)
      .send({ currentKey: editorKey, newKey: 'abcdef' })
      .expect(400);

    await request(app)
      .put('/api/cms/password')
      .set('X-Access-Key', editorKey)
      .send({ currentKey: editorKey, newKey: '111222' })
      .expect(200)
      .expect(({ body }) => expect(body.ok).toBe(true));

    await request(app)
      .post('/api/cms/auth')
      .send({ key: editorKey })
      .expect(401);

    await request(app)
      .post('/api/cms/auth')
      .send({ key: '111222' })
      .expect(200)
      .expect(({ body }) => expect(body.role).toBe('editor'));

    await request(app)
      .post('/api/password/verify')
      .send({ password: '111222' })
      .expect(200);
  });

  it('hides private-tagged notes from viewers but shows them to editors', async () => {
    resetDBForTests({
      notes: [
        {
          id: 1, title: 'Public note', category: 'work', notebookId: null,
          tags: ['cms'], content: 'public', excerpt: 'public', starred: false,
          date: '2026-07-23', readTime: '1 min', version: 1,
          createdAt: '2026-07-23T00:00:00.000Z', updatedAt: '2026-07-23T00:00:00.000Z',
        },
        {
          id: 2, title: 'Secret note', category: 'work', notebookId: null,
          tags: ['Private', 'cms'], content: 'secret', excerpt: 'secret', starred: false,
          date: '2026-07-23', readTime: '1 min', version: 1,
          createdAt: '2026-07-23T00:00:00.000Z', updatedAt: '2026-07-23T00:00:00.000Z',
        },
      ],
      menus: [{ id: 'docs', label: 'Docs', type: 'docs' }],
      categories: [{ id: 'work', label: '工作' }],
    });

    // 匿名 viewer：列表不含 private，单篇 404
    await request(app)
      .get('/api/cms/notes')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].id).toBe(1);
      });

    await request(app)
      .get('/api/cms/notes/2')
      .expect(404);

    // 编辑角色：全部可见
    await request(app)
      .get('/api/cms/notes')
      .set('X-Access-Key', editorKey)
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(2));

    await request(app)
      .get('/api/cms/notes/2')
      .set('X-Access-Key', editorKey)
      .expect(200)
      .expect(({ body }) => expect(body.title).toBe('Secret note'));
  });

  it('issues an HttpOnly cookie session on CMS auth and clears it on logout', async () => {
    const agent = request.agent(app);

    const auth = await agent
      .post('/api/cms/auth')
      .send({ key: editorKey })
      .expect(200);
    expect(auth.headers['set-cookie']?.join(';')).toContain('veldr_auth');

    await agent
      .get('/api/cms/me')
      .expect(200)
      .expect(({ body }) => expect(body.role).toBe('editor'));

    await agent
      .post('/api/cms/notes')
      .send({ title: 'Cookie Session Note', content: 'no access key header' })
      .expect(201);

    await agent.post('/api/cms/logout').expect(200);

    await agent
      .post('/api/cms/notes')
      .send({ title: 'Blocked after logout', content: 'nope' })
      .expect(403);
  });

  it('allows Veldr admin cookie as CMS editor', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/password/verify')
      .send({ password: '123456' })
      .expect(200);

    await agent
      .post('/api/cms/notes')
      .send({ title: 'Cookie CMS Note', content: 'Created by unified admin' })
      .expect(201);
  });
});
