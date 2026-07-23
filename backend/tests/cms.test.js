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
let tempDir;

const editorKey = '654321';

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'veldr-cms-'));

  process.env.NODE_ENV = 'test';
  process.env.DB_STORAGE = path.join(tempDir, 'veldr.sqlite');
  process.env.SECURITY_DB_STORAGE = path.join(tempDir, 'security.sqlite');
  process.env.CMS_DATA_DIR = path.join(tempDir, 'cms-data');
  process.env.CMS_UPLOAD_DIR = path.join(tempDir, 'cms-uploads');
  process.env.CMS_EDITOR_PASSWORD = editorKey;
  process.env.JWT_SECRET = 'test-secret';
  process.env.DEFAULT_PASSWORD = '123456';

  ({ app } = await import('../app.js'));
  ({ databases } = await import('../config/databases.js'));
  ({ default: Password } = await import('../models/Password.js'));
  ({ resetDBForTests } = await import('../modules/cms/cmsStore.js'));

  await databases.main.sync({ force: true });
  await databases.security.sync({ force: true });
});

beforeEach(async () => {
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
        tags: ['cms'],
        content: 'CMS content',
        excerpt: 'CMS content',
        starred: false,
        date: '2026-07-23',
        readTime: '1 min',
      },
    ],
    menus: [
      { id: 'docs', label: 'Docs', type: 'docs' },
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

  it('allows editor CRUD for notes and menus', async () => {
    const note = await request(app)
      .post('/api/cms/notes')
      .set('X-Access-Key', editorKey)
      .send({ title: 'New CMS Note', content: 'Hello CMS', tags: 'one,two' })
      .expect(201);

    expect(note.body.id).toBe(2);
    expect(note.body.tags).toEqual(['one', 'two']);

    await request(app)
      .put(`/api/cms/notes/${note.body.id}`)
      .set('X-Access-Key', editorKey)
      .send({ starred: true })
      .expect(200)
      .expect(({ body }) => expect(body.starred).toBe(true));

    const menu = await request(app)
      .post('/api/cms/menus')
      .set('X-Access-Key', editorKey)
      .send({ label: 'Guide' })
      .expect(201);

    await request(app)
      .delete(`/api/cms/menus/${menu.body.id}`)
      .set('X-Access-Key', editorKey)
      .expect(200);
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
