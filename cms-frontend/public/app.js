'use strict';

const CMS_CONFIG = window.CMS_CONFIG || {};
const API_BASE = CMS_CONFIG.apiBase || '/api/cms';
const UPLOAD_BASE = CMS_CONFIG.uploadBase || '/uploads/cms';
const LEGACY_UPLOAD_BASE = '/uploads/';
const ACCESS_KEY_STORAGE = 'veldr_cms_access_key';
const apiPath = (path) => API_BASE + path;

// ============================================================
// NoteFlow — 前端控制器（对接后端 REST API）
// UI / 交互保持不变：新建/编辑/删除笔记、可编辑顶部菜单、搜索、Markdown 渲染
// ============================================================

// ===== 内置页面内容（API / 指南，后端按 contentKey 引用）=====
const PAGE_CONTENT = {
  api: `
<div class="page-view__title">API 参考文档</div>
<p>NoteFlow 提供 RESTful API 接口，方便开发者将笔记系统集成到自己的工作流中。</p>

<h2>基础信息</h2>
<p><strong>Base URL</strong>：<code>/api/cms</code></p>
<p><strong>数据持久化</strong>：服务端 JSON 文件（data/db.json），部署后所有数据统一保存在服务器。</p>

<h2>接口列表</h2>

<h3>获取笔记列表</h3>
<pre><code>GET /api/cms/notes?category=work&tag=frontend</code></pre>
<p><strong>参数说明</strong>：</p><ul><li><code>category</code> — 按分类筛选（work / learn）</li><li><code>tag</code> — 按标签筛选</li><li><code>star</code> — 1 仅收藏</li><li><code>search</code> — 关键词搜索</li></ul>

<h3>获取单篇笔记</h3>
<pre><code>GET /api/cms/notes/:id</code></pre>
<p>返回笔记的完整内容，包括 Markdown 正文。</p>

<h3>创建笔记</h3>
<pre><code>POST /api/cms/notes
Content-Type: application/json

{
  "title": "新笔记标题",
  "category": "work",
  "tags": ["frontend", "react"],
  "content": "# Markdown 内容..."
}</code></pre>

<h3>更新笔记</h3>
<pre><code>PUT /api/cms/notes/:id
Content-Type: application/json

{
  "title": "更新后的标题",
  "starred": true
}</code></pre>

<h3>删除笔记</h3>
<pre><code>DELETE /api/cms/notes/:id</code></pre>

<h3>菜单接口</h3>
<pre><code>GET    /api/cms/menus        # 获取菜单列表
POST   /api/cms/menus        # 新增菜单  { "label": "新页面" }
PUT    /api/cms/menus/:id     # 重命名    { "label": "新名称" }
DELETE /api/cms/menus/:id     # 删除菜单</code></pre>

<h3>上传图片</h3>
<pre><code>POST /api/cms/upload
Content-Type: multipart/form-data

# 表单字段 image：图片文件（png/jpg/gif/webp/svg/avif/bmp，≤ 5MB）
# 返回 { "url": "/uploads/cms/xxx.png", "name": "原文件名" }</code></pre>
<p>上传成功后，在笔记正文中使用 <code>![图片说明](/uploads/cms/xxx.png)</code> 引用即可（编辑框的「插入图片」按钮会自动完成这一步）。</p>

<h2>错误码</h2>
<table style="width:100%;border-collapse:collapse;font-size:.9375rem;color:var(--c600);margin:var(--s4) 0">
<tr style="background:var(--c100);text-align:left"><th style="padding:10px 12px;font-weight:600">状态码</th><th style="padding:10px 12px;font-weight:600">说明</th></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--c200)"><code>200</code></td><td style="padding:10px 12px;border-bottom:1px solid var(--c200)">成功</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--c200)"><code>201</code></td><td style="padding:10px 12px;border-bottom:1px solid var(--c200)">创建成功</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--c200)"><code>400</code></td><td style="padding:10px 12px;border-bottom:1px solid var(--c200)">请求参数错误</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--c200)"><code>404</code></td><td style="padding:10px 12px;border-bottom:1px solid var(--c200)">资源不存在</td></tr>
<tr><td style="padding:10px 12px"><code>500</code></td><td style="padding:10px 12px">服务器错误</td></tr>
</table>
`,
  guide: `
<div class="page-view__title">使用指南</div>
<p>快速上手 NoteFlow，了解如何高效管理你的个人知识库。所有数据保存在服务器端，刷新或更换设备都不会丢失。</p>

<h2>创建第一篇笔记</h2>
<p>点击顶部导航栏的<strong>"新建笔记"</strong>按钮（或使用快捷键），填写标题、选择分类和标签，然后使用 Markdown 格式编写内容。</p>

<div class="callout callout--info">
  <div class="callout__title">💡 Markdown 快捷参考</div>
  <div class="callout__content">
    <strong>#</strong> 一级标题 | <strong>##</strong> 二级标题 | <strong>**粗体**</strong> | <strong>*斜体*</strong><br>
    <strong>- 列表</strong> | <strong>1. 有序列表</strong> | <strong>\`代码\`</strong> | <strong>\`\`\`代码块</strong><br>
    <strong>📷 插入图片</strong>：点击编辑框上方的「插入图片」按钮上传，自动以 <code>![名称](/uploads/cms/xxx.png)</code> 插入当前光标处
  </div>
</div>

<h2>组织笔记</h2>

<h3>分类管理</h3>
<p>每篇笔记属于一个分类（工作 / 学习），点击左侧边栏的分类可以快速筛选。</p>

<h3>标签系统</h3>
<p>使用标签进一步细化笔记主题。标签会显示在左侧边栏，点击即可筛选。一篇笔记可以添加多个标签（用逗号分隔）。</p>

<h3>收藏夹</h3>
<p>重要笔记可以加入收藏夹，方便快速查找。在笔记详情页或卡片上点击星标按钮即可。</p>

<h2>搜索笔记</h2>
<p>使用顶部搜索框（快捷键 <code>Ctrl+K</code>）可以搜索标题、标签和正文内容。搜索结果实时更新。</p>

<h2>自定义顶部菜单</h2>
<ul>
  <li><strong>编辑菜单名称</strong>：双击菜单项，输入新名称后按回车确认</li>
  <li><strong>添加新菜单</strong>：点击菜单栏末尾的 <strong>"+ 添加"</strong> 按钮</li>
  <li><strong>删除菜单</strong>：将鼠标悬停在菜单项上，点击右上角的 ✕ 按钮</li>
</ul>

<h2>部署与数据</h2>
<p>本应用是前后端一体服务。所有笔记与菜单配置保存在服务器 <code>data/db.json</code> 文件中。部署到服务器后，可通过反向代理（Nginx / Caddy）对外提供服务。</p>

<h2>快捷键</h2>
<table style="width:100%;border-collapse:collapse;font-size:.9375rem;color:var(--c600);margin:var(--s4) 0">
<tr style="background:var(--c100);text-align:left"><th style="padding:10px 12px;font-weight:600">快捷键</th><th style="padding:10px 12px;font-weight:600">功能</th></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--c200)"><code>Ctrl+K</code></td><td style="padding:10px 12px;border-bottom:1px solid var(--c200)">聚焦搜索框</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--c200)"><code>Esc</code></td><td style="padding:10px 12px;border-bottom:1px solid var(--c200)">返回笔记列表 / 关闭弹窗</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid var(--c200)"><code>Ctrl+N</code></td><td style="padding:10px 12px;border-bottom:1px solid var(--c200)">新建笔记</td></tr>
<tr><td style="padding:10px 12px"><code>双击菜单</code></td><td style="padding:10px 12px">编辑菜单名称</td></tr>
</table>
`
};

// ============================================================
// App Controller
// ============================================================
const App = {
  _notes: [],
  _menus: [],
  currentFilter: 'all',
  currentNote: null,
  searchQuery: '',
  editingNoteId: null,
  editingMenuId: null,
  currentNav: 'docs',
  accessKey: null,
  role: null,            // 'viewer' | 'editor' | null

  // ===== API 客户端 =====
  async api(method, url, body) {
    const opts = { method, headers: {} };
    if (this.accessKey) opts.headers['X-Access-Key'] = this.accessKey;
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, { credentials: 'include', ...opts });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || ('HTTP ' + res.status));
    return data;
  },

  async reloadNotes() {
    try { this._notes = (await this.api('GET', apiPath('/notes'))) || []; } catch (e) { this.toast('加载笔记失败'); }
  },
  async reloadMenus() {
    try { this._menus = (await this.api('GET', apiPath('/menus'))) || []; } catch (e) { this.toast('加载菜单失败'); }
  },

  // ===== 认证 =====
  async init() {
    const saved = (typeof localStorage !== 'undefined') ? localStorage.getItem(ACCESS_KEY_STORAGE) : null;
    if (saved) {
      this.accessKey = saved;
      try {
        const data = await this.auth(saved);
        this.role = data.role;
        this.applyRoleUI();
        return this.enterApp();
      } catch (e) {
        localStorage.removeItem(ACCESS_KEY_STORAGE);
        this.accessKey = null;
      }
    }
    this.role = 'viewer';
    this.applyRoleUI();
    this.hideLogin();
    this.enterApp();
  },

  async auth(key) {
    const res = await fetch(apiPath('/auth'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || '编辑密码错误');
    return data; // { role }
  },

  async submitLogin() {
    const input = document.getElementById('loginKey');
    const key = (input.value || '').trim();
    if (!key) return;
    this.showLoading(true);
    try {
      const data = await this.auth(key);
      this.accessKey = key;
      this.role = data.role;
      if (typeof localStorage !== 'undefined') localStorage.setItem(ACCESS_KEY_STORAGE, key);
      this.hideLogin();
      this.applyRoleUI();
      this.enterApp();
      this.toast('已以编辑模式进入');
    } catch (e) {
      this.toast(e.message);
      input.value = '';
      input.focus();
    } finally {
      this.showLoading(false);
    }
  },

  logout() {
    if (this.role !== 'editor') {
      this.showLogin();
      return;
    }

    if (typeof localStorage !== 'undefined') localStorage.removeItem(ACCESS_KEY_STORAGE);
    this.accessKey = null;
    this.role = 'viewer';
    this.applyRoleUI();
    this.renderMenus();
    this.renderNotes();
    this.toast('已退出编辑模式');
  },

  enterApp() {
    this.showLoading(true);
    Promise.all([this.reloadNotes(), this.reloadMenus()])
      .then(() => {
        this.showLoading(false);
        this.renderMenus();
        this.renderTags();
        this.updateCounts();
        this.navTo('docs');
      })
      .catch(() => this.showLoading(false));
  },

  showLogin() {
    const el = document.getElementById('loginOverlay');
    if (el) el.classList.add('login-overlay--active');
    const input = document.getElementById('loginKey');
    if (input) setTimeout(() => input.focus(), 100);
  },

  hideLogin() {
    const el = document.getElementById('loginOverlay');
    if (el) el.classList.remove('login-overlay--active');
  },

  applyRoleUI() {
    const isEditor = this.role === 'editor';
    const newBtn = document.getElementById('newNoteBtn');
    if (newBtn) newBtn.style.display = isEditor ? '' : 'none';
    const badge = document.getElementById('roleBadge');
    if (badge) {
      badge.textContent = isEditor ? '✏️ 编辑模式' : '👁 查看模式';
      badge.className = 'topnav__role ' + (isEditor ? 'topnav__role--editor' : 'topnav__role--viewer');
      badge.style.display = '';
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.textContent = isEditor ? '退出编辑' : '编辑登录';
      logoutBtn.title = isEditor ? '退出编辑模式' : '输入编辑密码';
      logoutBtn.style.display = '';
    }
  },

  // ===== 导航 =====
  navTo(target) {
    this.currentNav = target;
    this.currentNote = null;

    document.getElementById('browseView').style.display = 'none';
    document.getElementById('detailView').classList.remove('detail-view--active');
    document.getElementById('pageView').classList.remove('page-view--active');

    document.querySelectorAll('.topnav__link').forEach(l => l.classList.remove('topnav__link--active'));
    const menuEl = document.querySelector(`.topnav__link[data-nav="${target}"]`);
    if (menuEl) menuEl.classList.add('topnav__link--active');

    const toc = document.getElementById('tocNav');
    toc.style.display = (window.innerWidth >= 1200 && target === 'docs') ? '' : 'none';

    if (target === 'docs') {
      document.getElementById('browseView').style.display = 'block';
      this.renderBrowseToc();
      this.renderNotes();
    } else {
      const menu = this._menus.find(m => m.id === target);
      if (menu && menu.type === 'page') {
        const pageEl = document.getElementById('pageView');
        pageEl.classList.add('page-view--active');
        let html;
        if (menu.contentKey && PAGE_CONTENT[menu.contentKey]) {
          html = PAGE_CONTENT[menu.contentKey];
        } else {
          html = menu.content || `<div class="page-view__title">${this.escapeHTML(menu.label)}</div><p>此页面暂无内容，你可以通过编辑菜单来添加自定义内容。</p>`;
        }
        pageEl.innerHTML = html;
      } else {
        document.getElementById('browseView').style.display = 'block';
        this.renderNotes();
      }
    }
  },

  // ===== 顶部菜单（可编辑）=====
  renderMenus() {
    const container = document.getElementById('topMenu');
    const isEditor = this.role === 'editor';
    container.innerHTML = this._menus.map(m => `
      <div class="topnav__link ${this.currentNav === m.id ? 'topnav__link--active' : ''}"
           data-nav="${m.id}"
           onclick="App.navTo('${m.id}')"
           ${isEditor ? `ondblclick="App.startEditMenu('${m.id}', this)" oncontextmenu="event.preventDefault(); App.deleteMenu('${m.id}')"` : ''}
           title="${isEditor ? '双击编辑名称 | 右键删除' : '查看模式'}">
        <span class="topnav__link-text">${this.escapeHTML(m.label)}</span>
        ${isEditor && m.id !== 'docs' ? `<span class="topnav__link-delete" onclick="event.stopPropagation(); App.deleteMenu('${m.id}')">✕</span>` : ''}
      </div>
    `).join('') + (isEditor ? `
      <button class="topnav__add-menu" onclick="App.addMenu()" title="添加新菜单">+ 添加</button>
    ` : '');
  },

  async startEditMenu(id, el) {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    if (this.editingMenuId) return;
    this.editingMenuId = id;

    const menu = this._menus.find(m => m.id === id);
    const textSpan = el.querySelector('.topnav__link-text');
    const currentLabel = menu ? menu.label : textSpan.textContent;

    el.classList.add('topnav__link--editing');
    textSpan.innerHTML = `<input class="topnav__link-input" id="menuEditInput" value="${this.escapeHTML(currentLabel)}">`;

    const input = document.getElementById('menuEditInput');
    input.focus();
    input.select();

    const finish = async () => {
      const newLabel = input.value.trim();
      this.editingMenuId = null;
      if (newLabel && newLabel !== currentLabel) {
        try {
          await this.api('PUT', apiPath('/menus/' + id), { label: newLabel });
          await this.reloadMenus();
          this.renderMenus();
          if (this.currentNav === id) this.navTo(id);
          this.toast('菜单已更新');
        } catch (e) { this.toast(e.message); this.renderMenus(); }
      } else {
        this.renderMenus();
      }
    };

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { this.editingMenuId = null; this.renderMenus(); }
    });
  },

  async addMenu() {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const label = prompt('请输入新菜单名称：', '新页面');
    if (!label || !label.trim()) return;
    try {
      const menu = await this.api('POST', apiPath('/menus'), { label: label.trim() });
      await this.reloadMenus();
      this.renderMenus();
      this.navTo(menu.id);
      this.toast('已添加菜单');
    } catch (e) { this.toast(e.message); }
  },

  async deleteMenu(id) {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const menu = this._menus.find(m => m.id === id);
    if (!menu || id === 'docs') return;
    if (!confirm(`确定要删除菜单"${menu.label}"吗？`)) return;
    try {
      await this.api('DELETE', apiPath('/menus/' + id));
      await this.reloadMenus();
      if (this.currentNav === id) this.navTo('docs');
      this.renderMenus();
      this.toast('菜单已删除');
    } catch (e) { this.toast(e.message); }
  },

  // ===== 笔记 CRUD =====
  getFilteredNotes() {
    let notes = [...this._notes];
    if (this.currentFilter === 'star') notes = notes.filter(n => n.starred);
    else if (this.currentFilter === 'work') notes = notes.filter(n => n.category === 'work');
    else if (this.currentFilter === 'learn') notes = notes.filter(n => n.category === 'learn');
    else if (this.currentFilter.startsWith('tag:')) {
      const tag = this.currentFilter.slice(4);
      notes = notes.filter(n => Array.isArray(n.tags) && n.tags.includes(tag));
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      notes = notes.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.excerpt || '').toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (n.content || '').toLowerCase().includes(q)
      );
    }
    return notes;
  },

  updateCounts() {
    const notes = this._notes;
    document.getElementById('countAll').textContent = notes.length;
    document.getElementById('countWork').textContent = notes.filter(n => n.category === 'work').length;
    document.getElementById('countLearn').textContent = notes.filter(n => n.category === 'learn').length;
    document.getElementById('countStar').textContent = notes.filter(n => n.starred).length;
  },

  setFilter(filter, el) {
    this.currentFilter = filter;
    this.searchQuery = '';
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('.sidebar__item--active').forEach(i => i.classList.remove('sidebar__item--active'));
    el.classList.add('sidebar__item--active');
    this.showBrowse();
    this.renderNotes();
  },

  showBrowse() {
    this.currentNote = null;
    this.currentNav = 'docs';
    document.getElementById('browseView').style.display = 'block';
    document.getElementById('detailView').classList.remove('detail-view--active');
    document.getElementById('pageView').classList.remove('page-view--active');
    document.getElementById('tocNav').style.display = (window.innerWidth >= 1200) ? '' : 'none';
    this.renderBrowseToc();
    this.renderNotes();
  },

  showDetail(id) {
    const note = this._notes.find(n => n.id === id);
    if (!note) return;
    this.currentNote = note;
    const isEditor = this.role === 'editor';

    document.getElementById('browseView').style.display = 'none';
    document.getElementById('pageView').classList.remove('page-view--active');
    document.getElementById('tocNav').style.display = 'none';

    const detailEl = document.getElementById('detailView');
    detailEl.classList.add('detail-view--active');

    const metaHTML = [
      `<span class="detail__meta-tag">${note.category === 'work' ? '工作' : '学习'}</span>`,
      ...(note.tags || []).map(t => `<span>#${this.escapeHTML(t)}</span>`),
      `<span>📅 ${note.date}</span>`,
      `<span>⏱ ${note.readTime}阅读</span>`,
      note.starred ? '<span>⭐ 已收藏</span>' : ''
    ].join('');

    const editBtn = isEditor ? `<button class="btn btn--secondary" style="margin-left:auto" onclick="App.openNoteModal(${note.id})">✏️ 编辑</button>` : '';
    const contentHTML = this.renderMarkdown(note.content);

    detailEl.innerHTML = `
      <button class="detail__back" onclick="App.showBrowse()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        返回列表
      </button>
      <div class="detail__meta">${metaHTML}${editBtn}</div>
      <div class="detail__content">${contentHTML}</div>
    `;
    this.renderDetailToc(detailEl);
    document.getElementById('mainContent').scrollTop = 0;
  },

  renderBrowseToc() {
    const toc = document.getElementById('tocNav');
    if (!toc) return;
    toc.innerHTML = `
      <div class="toc__title">知识库导航</div>
      <div style="padding:0 var(--s3);font-size:.875rem;color:var(--c500);line-height:2.2">
        <div style="margin-bottom:8px;padding:8px 12px;background:var(--c100);border-radius:6px">
          <strong>Ctrl+K</strong> — 搜索知识条目<br>
          <strong>Esc</strong> — 返回目录 / 关闭弹窗<br>
          <strong>Ctrl+N</strong> — 新建条目
        </div>
        通过左侧分类、标签和顶部搜索快速定位资料。
      </div>`;
  },

  renderDetailToc(detailEl) {
    const toc = document.getElementById('tocNav');
    if (!toc || window.innerWidth < 1200) return;
    const headings = Array.from(detailEl.querySelectorAll('.detail__content h1, .detail__content h2, .detail__content h3'));
    if (!headings.length) {
      toc.style.display = 'none';
      return;
    }
    headings.forEach((heading, index) => { heading.id = `note-heading-${index}`; });
    toc.innerHTML = `<div class="toc__title">本文目录</div>${headings.map((heading, index) => `
      <div class="toc__item" style="padding-left:${(Number(heading.tagName.slice(1)) - 1) * 10}px">
        <a class="toc__link" onclick="document.getElementById('note-heading-${index}').scrollIntoView({ behavior: 'smooth', block: 'start' })">${this.escapeHTML(heading.textContent)}</a>
      </div>`).join('')}`;
    toc.style.display = '';
  },

  openNoteModal(editId) {
    if (this.role !== 'editor') { this.toast('查看模式下无法编辑，请输入编辑密码'); return; }
    this.editingNoteId = editId || null;
    const modal = document.getElementById('noteModal');
    const titleEl = document.getElementById('noteTitle');
    const categoryEl = document.getElementById('noteCategory');
    const tagsEl = document.getElementById('noteTags');
    const contentEl = document.getElementById('noteContent');
    const deleteBtn = document.getElementById('modalDeleteBtn');

    if (editId) {
      const note = this._notes.find(n => n.id === editId);
      if (!note) return;
      document.getElementById('modalTitle').textContent = '编辑笔记';
      document.getElementById('modalSaveBtn').textContent = '更新笔记';
      titleEl.value = note.title;
      categoryEl.value = note.category;
      tagsEl.value = (note.tags || []).join(', ');
      contentEl.value = note.content;
      deleteBtn.style.display = '';
    } else {
      document.getElementById('modalTitle').textContent = '新建笔记';
      document.getElementById('modalSaveBtn').textContent = '保存笔记';
      titleEl.value = '';
      categoryEl.value = 'work';
      tagsEl.value = '';
      contentEl.value = '';
      deleteBtn.style.display = 'none';
    }
    modal.classList.add('modal-overlay--active');
    this.updateMarkdownPreview();
    setTimeout(() => titleEl.focus(), 100);
  },

  async saveNote() {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const title = document.getElementById('noteTitle').value.trim();
    const category = document.getElementById('noteCategory').value;
    const tagsRaw = document.getElementById('noteTags').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    if (!title) { alert('请输入笔记标题'); return; }
    if (!content) { alert('请输入笔记内容'); return; }

    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const payload = { title, category, tags, content };

    this.showLoading(true);
    try {
      if (this.editingNoteId) {
        await this.api('PUT', apiPath('/notes/' + this.editingNoteId), payload);
        this.toast('笔记已更新');
      } else {
        await this.api('POST', apiPath('/notes'), payload);
        this.toast('笔记已创建');
      }
      await this.reloadNotes();
      this.updateCounts();
      this.renderTags();
      this.closeModal();
      this.showBrowse();
      this.renderNotes();
    } catch (e) {
      this.toast(e.message);
    } finally {
      this.showLoading(false);
    }
  },

  async deleteNote() {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    if (!this.editingNoteId) return;
    if (!confirm('确定要删除这篇笔记吗？此操作不可撤销。')) return;
    this.showLoading(true);
    try {
      await this.api('DELETE', apiPath('/notes/' + this.editingNoteId));
      await this.reloadNotes();
      this.updateCounts();
      this.renderTags();
      this.closeModal();
      this.showBrowse();
      this.renderNotes();
      this.toast('笔记已删除');
    } catch (e) {
      this.toast(e.message);
    } finally {
      this.showLoading(false);
    }
  },

  async deleteNoteDirect(id) {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    if (!confirm('确定要删除这篇笔记吗？')) return;
    this.showLoading(true);
    try {
      await this.api('DELETE', apiPath('/notes/' + id));
      await this.reloadNotes();
      this.updateCounts();
      this.renderTags();
      if (this.currentNote && this.currentNote.id === id) { this.currentNote = null; this.showBrowse(); }
      this.renderNotes();
      this.toast('笔记已删除');
    } catch (e) {
      this.toast(e.message);
    } finally {
      this.showLoading(false);
    }
  },

  async toggleStar(id) {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const note = this._notes.find(n => n.id === id);
    if (!note) return;
    const newStar = !note.starred;
    // 乐观更新
    note.starred = newStar;
    this.updateCounts();
    if (this.currentNote && this.currentNote.id === id) this.currentNote.starred = newStar;
    this.renderNotes();
    try {
      await this.api('PUT', apiPath('/notes/' + id), { starred: newStar });
    } catch (e) {
      note.starred = !newStar;
      this.updateCounts();
      this.renderNotes();
      this.toast(e.message);
    }
  },

  closeModal() {
    document.getElementById('noteModal').classList.remove('modal-overlay--active');
    this.editingNoteId = null;
  },

  updateMarkdownPreview() {
    const content = document.getElementById('noteContent');
    const preview = document.getElementById('markdownPreview');
    if (!content || !preview) return;
    preview.innerHTML = this.renderMarkdown(content.value);
  },

  // ===== 图片上传 =====
  uploadImage() {
    document.getElementById('imageInput').click();
  },

  async handleImageSelected(e) {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); e.target.value = ''; return; }
    const file = e.target.files && e.target.files[0];
    e.target.value = '';                       // 允许重复选择同一文件
    if (!file) return;

    const fd = new FormData();
    fd.append('image', file);
    this.showLoading(true);
    try {
      const res = await fetch(apiPath('/upload'), { method: 'POST', credentials: 'include', headers: this.accessKey ? { 'X-Access-Key': this.accessKey } : {}, body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || '上传失败');

      // 在光标处插入 Markdown 图片语法
      const ta = document.getElementById('noteContent');
      const snippet = `![${file.name}](${data.url})`;
      const start = ta.selectionStart || 0;
      const end = ta.selectionEnd || 0;
      ta.value = ta.value.slice(0, start) + snippet + ta.value.slice(end);
      this.updateMarkdownPreview();
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + snippet.length;
      this.toast('图片已插入');
    } catch (err) {
      this.toast(err.message);
    } finally {
      this.showLoading(false);
    }
  },

  // ===== 笔记列表渲染 =====
  renderNotes() {
    const notes = this.getFilteredNotes();
    const isEditor = this.role === 'editor';
    const grid = document.getElementById('browseView');

    const filterLabels = { 'all': '笔记管理文档', 'work': '工作笔记', 'learn': '学习笔记', 'star': '收藏夹' };
    const filterDescs = {
      'all': '探索你的笔记目录结构，了解如何组织和管理个人知识库。点击卡片查看完整内容。',
      'work': '与工作相关的所有笔记，包括项目文档、会议纪要和方案设计。',
      'learn': '学习过程中记录的知识点、技术总结和实践笔记。',
      'star': '你收藏的重要笔记，方便快速查找和回顾。'
    };
    const title = filterLabels[this.currentFilter] || this.currentFilter.replace('tag:', '#');
    const desc = filterDescs[this.currentFilter] || '';

    let html = `
      <div class="content-header">
        <div class="content-header__breadcrumb">
          <a onclick="App.navTo('docs')">首页</a><span>/</span>
          <a id="breadcrumbCurrent">${this.escapeHTML(title)}</a>
        </div>
        <h1 class="content-header__title">${this.escapeHTML(title)}</h1>
        <p class="content-header__desc">${desc}</p>
      </div>
      <div class="stats-bar">
        <div class="stat-pill">📄 共 <strong id="totalNotes">${notes.length}</strong> 篇笔记</div>
        <div class="stat-pill">🕐 最近更新：<strong id="lastUpdated">${notes.length ? notes[0].date : '—'}</strong></div>
      </div>
      <div class="notes-grid">`;

    if (notes.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div class="empty-state__title">没有找到匹配的笔记</div>
          <div class="empty-state__desc">尝试更换搜索关键词或选择其他分类</div>
          ${isEditor ? `<button class="btn btn--primary" onclick="App.openNoteModal()">+ 新建笔记</button>` : ''}
        </div>`;
    } else {
      html += notes.map(n => `
        <div class="note-card" onclick="App.showDetail(${n.id})" role="button" tabindex="0">
          <div class="note-card__header">
            <div class="note-card__icon">${this.getIconSVG()}</div>
            ${isEditor ? `<div class="note-card__actions">
              <button class="note-card__action-btn" title="切换收藏" onclick="event.stopPropagation(); App.toggleStar(${n.id})">${n.starred ? '⭐' : '☆'}</button>
              <button class="note-card__action-btn note-card__action-btn--delete" title="删除" onclick="event.stopPropagation(); App.deleteNoteDirect(${n.id})">🗑</button>
            </div>` : ''}
          </div>
          <h3 class="note-card__title">${this.escapeHTML(n.title)}</h3>
          <p class="note-card__excerpt">${this.escapeHTML(n.excerpt || '')}</p>
          <div class="note-card__footer">
            <span class="note-card__date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${n.date}
            </span>
            <div style="display:flex;gap:6px">${(n.tags || []).map(t => `<span class="note-card__tag">#${t}</span>`).join('')}</div>
            <span>${n.readTime} 阅读</span>
          </div>
        </div>`).join('');
    }

    html += '</div>';
    grid.innerHTML = html;
  },

  // ===== 标签 =====
  renderTags() {
    const notes = this._notes;
    const allTags = new Set();
    notes.forEach(n => (n.tags || []).forEach(t => allTags.add(t)));
    const container = document.getElementById('tagsList');
    if (allTags.size === 0) {
      container.innerHTML = '<div style="padding:var(--s2) var(--s6);font-size:.8125rem;color:var(--c400)">暂无标签</div>';
      return;
    }
    container.innerHTML = Array.from(allTags).sort().map(tag => `
      <a class="sidebar__item" data-filter="tag:${tag}" onclick="App.setFilter('tag:${tag}',this)">
        <svg class="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        ${tag}
        <span class="sidebar__count">${notes.filter(n => (n.tags || []).includes(tag)).length}</span>
      </a>
    `).join('');
  },

  // ===== 搜索 =====
  filter() {
    this.searchQuery = document.getElementById('searchInput').value;
    this.renderNotes();
  },

  // ===== Markdown 渲染 =====
  renderMarkdown(md) {
    const codeBlocks = [];
    let processed = (md || '').replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(`<pre><code>${this.escapeHTML(code.trim())}</code></pre>`);
      return `%%CODEBLOCK_${idx}%%`;
    });
    // 图片：![alt](url) → <img>（给 /uploads 图片追加访问 token）
    processed = processed.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => {
      let src = url;
      if (this.accessKey && (String(src).startsWith(LEGACY_UPLOAD_BASE) || String(src).startsWith(UPLOAD_BASE))) {
        src += (String(src).includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(this.accessKey);
      }
      return `<img class="md-img" src="${src}" alt="${this.escapeHTML(alt)}" loading="lazy">`;
    });
    processed = processed
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>');
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    processed = processed.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--c200);margin:var(--s8) 0">');
    processed = processed.replace(/^- (.*$)/gm, '<li>$1</li>');
    processed = processed.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    processed = processed.replace(/^(?!<[a-z]|<\/)/gm, (line) => {
      if (!line.trim()) return '';
      return `<p>${line.trim()}</p>`;
    });
    processed = processed.replace(/%%CODEBLOCK_(\d+)%%/g, (_, idx) => codeBlocks[parseInt(idx)]);
    processed = processed.replace(/<p>\s*<\/p>/g, '');
    return processed;
  },

  // ===== 工具 =====
  escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
  getIconSVG() {
    const icons = [
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
    ];
    return icons[Math.floor(Math.random() * icons.length)];
  },
  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('sidebar--open');
    document.getElementById('sidebarOverlay').classList.toggle('overlay--active');
  },
  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('toast--show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('toast--show'), 2200);
  },
  showLoading(on) {
    const bar = document.getElementById('loadingBar');
    if (!bar) return;
    bar.style.width = on ? '70%' : '0';
    if (on) setTimeout(() => { if (bar.style.width === '70%') bar.style.width = '85%'; }, 150);
    else setTimeout(() => { bar.style.width = '100%'; setTimeout(() => bar.style.width = '0', 200); }, 100);
  }
};

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', () => App.init());

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('noteModal');
    if (modal.classList.contains('modal-overlay--active')) {
      if (App.editingMenuId) return;
      App.closeModal();
      return;
    }
    if (App.currentNote) { App.showBrowse(); return; }
    if (App.currentNav !== 'docs') { App.navTo('docs'); return; }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('searchInput').focus(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); if (App.role === 'editor') App.openNoteModal(); }
});

// 点击遮罩关闭弹窗
document.getElementById('noteModal').addEventListener('click', function (e) {
  if (e.target === this) App.closeModal();
});
