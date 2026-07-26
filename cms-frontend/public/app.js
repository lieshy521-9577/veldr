'use strict';

const CMS_CONFIG = window.CMS_CONFIG || {};
const API_BASE = CMS_CONFIG.apiBase || '/api/cms';
const UPLOAD_BASE = CMS_CONFIG.uploadBase || '/uploads/cms';
const LEGACY_UPLOAD_BASE = '/uploads/';
const ACCESS_KEY_STORAGE = 'veldr_cms_access_key';
const apiPath = (path) => API_BASE + path;

window.CMSNormalizeMarkdownUrl = (url) => {
  let src = String(url || '');
  if (window.App?.accessKey && (src.startsWith(LEGACY_UPLOAD_BASE) || src.startsWith(UPLOAD_BASE))) {
    src += (src.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(window.App.accessKey);
  }
  return src;
};

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
  _categories: [],
  currentFilter: 'all',
  currentNote: null,
  searchQuery: '',
  editingNoteId: null,
  editingMenuId: null,
  editingNoteVersion: null,
  autosaveTimer: null,
  autosaveInFlight: false,
  autosaveDirty: false,
  suppressAutosave: false,
  conflictPending: false,
  _previewCache: new Map(),
  _previewTimer: null,
  _searchTimer: null,
  _lastServerRefreshAt: 0,
  lastKnownNotesVersion: '',
  currentEditorMode: 'split',
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
    if (!res.ok) {
      const error = new Error((data && data.error) || ('HTTP ' + res.status));
      error.status = res.status;
      error.code = data && data.code;
      error.current = data && data.current;
      throw error;
    }
    return data;
  },

  async reloadNotes() {
    try {
      this._notes = (await this.api('GET', apiPath('/notes'))) || [];
      this.lastKnownNotesVersion = this.getNotesVersionFingerprint();
    } catch (e) { this.toast('加载笔记失败'); }
  },
  async reloadMenus() {
    try { this._menus = (await this.api('GET', apiPath('/menus'))) || []; } catch (e) { this.toast('加载菜单失败'); }
  },
  async reloadCategories() {
    try { this._categories = (await this.api('GET', apiPath('/categories'))) || []; } catch (e) { this.toast('加载分类失败'); }
  },

  // ===== 认证 =====
  async init() {
    document.querySelector('.modal__toolbar')?.addEventListener('mousedown', (event) => {
      if (event.target.closest('button')) event.preventDefault();
    });

    // 优先使用 HttpOnly Cookie 会话（由 /auth 签发，密钥不再落 localStorage）
    try {
      const me = await this.api('GET', apiPath('/me'));
      if (me?.role === 'editor') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(ACCESS_KEY_STORAGE);
        this.role = 'editor';
        this.applyRoleUI();
        this.hideLogin();
        return this.enterApp();
      }
    } catch (e) { /* 网络异常时按未登录处理 */ }

    // 兼容旧版：localStorage 里的明文密钥换取一次 Cookie 后即删除
    const saved = (typeof localStorage !== 'undefined') ? localStorage.getItem(ACCESS_KEY_STORAGE) : null;
    if (saved) {
      try {
        const data = await this.auth(saved);
        localStorage.removeItem(ACCESS_KEY_STORAGE);
        this.role = data.role;
        this.applyRoleUI();
        this.hideLogin();
        return this.enterApp();
      } catch (e) {
        localStorage.removeItem(ACCESS_KEY_STORAGE);
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
      const data = await this.auth(key); // 服务端签发 HttpOnly Cookie，本地不保存密钥
      this.role = data.role;
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

  enterViewerMode() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(ACCESS_KEY_STORAGE);
    this.accessKey = null;
    this.role = 'viewer';
    this.hideLogin();
    this.applyRoleUI();
    this.renderMenus();
    this.renderCategories();
    this.renderTags();
    this.updateCounts();
    this.renderNotes();
  },

  async logout() {
    if (this.role !== 'editor') {
      this.showLogin();
      return;
    }

    try { await this.api('POST', apiPath('/logout')); } catch (e) { /* Cookie 清除失败不阻塞本地退出 */ }
    this.enterViewerMode();
    this.toast('已退出编辑模式');
  },

  enterApp() {
    this.showLoading(true);
    Promise.all([this.reloadNotes(), this.reloadMenus(), this.reloadCategories()])
      .then(() => {
        this.showLoading(false);
        this.renderMenus();
        this.renderCategories();
        this.renderTags();
        this.updateCounts();
        this.navTo('docs');
      })
      .catch(() => this.showLoading(false));
  },

  getNotesVersionFingerprint() {
    return this._notes
      .map(note => `${note.id}:${note.version || 1}:${note.updatedAt || note.date || ''}`)
      .sort()
      .join('|');
  },

  async refreshFromServer(reason = 'manual') {
    if (this.role !== 'editor' && this.role !== 'viewer') return;
    // focus 和 visibilitychange 常常同时触发，5 秒内只刷新一次
    const now = Date.now();
    if (now - this._lastServerRefreshAt < 5000) return;
    this._lastServerRefreshAt = now;
    const modalOpen = document.getElementById('noteModal')?.classList.contains('modal-overlay--active');
    if (modalOpen) {
      await this.checkEditingRemoteVersion(reason);
      return;
    }

    const before = this.lastKnownNotesVersion;
    await this.reloadNotes();
    this.updateCounts();
    this.renderTags();
    this.renderNotes();
    if (this.currentNote) {
      const fresh = this._notes.find(note => note.id === this.currentNote.id);
      if (fresh) this.showDetail(fresh.id);
    }
    if (before && before !== this.lastKnownNotesVersion && reason !== 'autosave') {
      this.toast('已同步服务器最新笔记');
    }
  },

  async checkEditingRemoteVersion() {
    if (!this.editingNoteId || !this.editingNoteVersion) return;
    try {
      const remote = await this.api('GET', apiPath('/notes/' + this.editingNoteId));
      if (Number(remote.version || 1) > Number(this.editingNoteVersion || 1)) {
        this.setAutosaveStatus('其它设备有更新，保存前请处理');
      }
    } catch {}
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
    const input = document.getElementById('loginKey');
    if (input) input.value = '';
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
    const passwordBtn = document.getElementById('passwordBtn');
    if (passwordBtn) passwordBtn.style.display = isEditor ? '' : 'none';
    const mobilePasswordBtn = document.getElementById('mobilePasswordBtn');
    if (mobilePasswordBtn) mobilePasswordBtn.style.display = isEditor ? 'flex' : 'none';
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) addCategoryBtn.style.display = isEditor ? 'flex' : 'none';
    const mobileAddCategoryBtn = document.getElementById('mobileAddCategoryBtn');
    if (mobileAddCategoryBtn) mobileAddCategoryBtn.style.display = isEditor ? 'flex' : 'none';
  },

  openPasswordModal() {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    this.closeMobileSheets();
    const modal = document.getElementById('passwordModal');
    const current = document.getElementById('currentPasswordKey');
    const next = document.getElementById('newPasswordKey');
    const confirm = document.getElementById('confirmPasswordKey');
    if (!modal || !current || !next || !confirm) return;
    current.value = this.accessKey || '';
    next.value = '';
    confirm.value = '';
    modal.classList.add('modal-overlay--active');
    setTimeout(() => (current.value ? next : current).focus(), 100);
  },

  closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.classList.remove('modal-overlay--active');
    ['currentPasswordKey', 'newPasswordKey', 'confirmPasswordKey'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
  },

  openShortcutModal() {
    const modal = document.getElementById('shortcutModal');
    if (modal) modal.classList.add('modal-overlay--active');
  },

  closeShortcutModal() {
    const modal = document.getElementById('shortcutModal');
    if (modal) modal.classList.remove('modal-overlay--active');
  },

  async changePassword() {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const current = document.getElementById('currentPasswordKey')?.value.trim() || '';
    const next = document.getElementById('newPasswordKey')?.value.trim() || '';
    const confirm = document.getElementById('confirmPasswordKey')?.value.trim() || '';
    if (!/^\d{6}$/.test(current)) { this.toast('请输入当前 6 位密码'); return; }
    if (!/^\d{6}$/.test(next)) { this.toast('新密码必须是 6 位数字'); return; }
    if (next !== confirm) { this.toast('两次输入的新密码不一致'); return; }
    if (current === next) { this.toast('新密码不能和当前密码相同'); return; }

    this.showLoading(true);
    try {
      await this.api('PUT', apiPath('/password'), { currentKey: current, newKey: next });
      // 改密后服务端会清除旧 Cookie，用新密码重新换取会话
      await this.auth(next);
      this.closePasswordModal();
      this.toast('编辑密码已更新');
    } catch (e) {
      this.toast(e.message);
    } finally {
      this.showLoading(false);
    }
  },

  // ===== 导航 =====
  navTo(target) {
    this.currentNav = target;
    this.currentNote = null;
    this.currentFilter = 'all';
    this.searchQuery = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    this.setSidebarActive('all');

    document.getElementById('browseView').style.display = 'none';
    document.getElementById('detailView').classList.remove('detail-view--active');
    document.getElementById('pageView').classList.remove('page-view--active');

    document.querySelectorAll('.topnav__link').forEach(l => l.classList.remove('topnav__link--active'));
    const menuEl = document.querySelector(`.topnav__link[data-nav="${target}"]`);
    if (menuEl) menuEl.classList.add('topnav__link--active');
    this.updateMobileNotebookLabel();
    this.renderMobileFilters();
    this.closeMobileSheets();

    const toc = document.getElementById('tocNav');
    toc.style.display = (window.innerWidth >= 1200 && target === 'docs') ? '' : 'none';

    if (target === 'docs') {
      document.getElementById('browseView').style.display = 'block';
      this.renderBrowseToc();
      this.updateCounts();
      this.renderNotes();
    } else {
      const menu = this._menus.find(m => m.id === target);
      if (menu && menu.type === 'page') {
        const pageEl = document.getElementById('pageView');
        pageEl.classList.add('page-view--active');
        let html;
        if (menu.contentKey && PAGE_CONTENT[menu.contentKey]) {
          html = PAGE_CONTENT[menu.contentKey];
        } else if (menu.content) {
          // 服务端存储的自定义 HTML，必须净化后再注入
          html = window.CMSMarkdown?.sanitize
            ? window.CMSMarkdown.sanitize(menu.content)
            : `<pre style="white-space:pre-wrap">${this.escapeHTML(menu.content)}</pre>`;
        } else {
          html = `<div class="page-view__title">${this.escapeHTML(menu.label)}</div><p>此页面暂无内容，你可以通过编辑菜单来添加自定义内容。</p>`;
        }
        pageEl.innerHTML = html;
      } else {
        document.getElementById('browseView').style.display = 'block';
        this.renderBrowseToc();
        this.updateCounts();
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
      <button class="topnav__add-menu" onclick="App.addMenu()" title="添加笔记本">+ Notebook</button>
    ` : '');
    this.updateMobileNotebookLabel();
    this.renderMobileNotebooks();
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
    this.closeMobileSheets();
    const label = prompt('请输入新笔记本名称：', '新笔记本');
    if (!label || !label.trim()) return;
    try {
      const menu = await this.api('POST', apiPath('/menus'), { label: label.trim(), type: 'notebook' });
      await this.reloadMenus();
      this.renderMenus();
      this.navTo(menu.id);
      this.toast('已添加笔记本');
    } catch (e) { this.toast(e.message); }
  },

  async renameMenu(id) {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const menu = this._menus.find(m => m.id === id);
    if (!menu) return;
    this.closeMobileSheets();
    const label = prompt('请输入新的笔记本名称：', menu.label);
    if (!label || !label.trim() || label.trim() === menu.label) return;
    try {
      await this.api('PUT', apiPath('/menus/' + id), { label: label.trim() });
      await this.reloadMenus();
      this.renderMenus();
      if (this.currentNav === id) this.navTo(id);
      this.toast('笔记本已更新');
    } catch (e) { this.toast(e.message); }
  },

  async deleteMenu(id) {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const menu = this._menus.find(m => m.id === id);
    if (!menu || id === 'docs') return;
    this.closeMobileSheets();
    if (!confirm(`确定要删除笔记本"${menu.label}"吗？其中的笔记会移回 Docs。`)) return;
    try {
      await this.api('DELETE', apiPath('/menus/' + id));
      await this.reloadMenus();
      await this.reloadNotes();
      if (this.currentNav === id) this.navTo('docs');
      this.renderMenus();
      this.toast('笔记本已删除');
    } catch (e) { this.toast(e.message); }
  },

  ensureCategoryOptions(selectedId) {
    const select = document.getElementById('noteCategory');
    if (!select) return;
    const value = selectedId || select.value || this.getDefaultCategoryId();
    select.innerHTML = this._categories.map(category => (
      `<option value="${this.escapeHTML(category.id)}">${this.escapeHTML(category.label)}</option>`
    )).join('');
    select.value = this.getCategoryById(value) ? value : this.getDefaultCategoryId();
  },

  renderCategories() {
    const container = document.getElementById('categoryList');
    const addBtn = document.getElementById('addCategoryBtn');
    if (!container) return;
    const isEditor = this.role === 'editor';
    if (addBtn) addBtn.style.display = isEditor ? 'flex' : 'none';
    const scopedNotes = this.getScopedNotes();

    if (!this._categories.length) {
      container.innerHTML = '<div style="padding:var(--s2) var(--s6);font-size:.8125rem;color:var(--c400)">暂无分类</div>';
      this.ensureCategoryOptions();
      return;
    }

    container.innerHTML = this._categories.map(category => {
      const filter = this.getCategoryFilter(category.id);
      const active = this.currentFilter === filter;
      const count = scopedNotes.filter(note => note.category === category.id).length;
      return `
        <a class="sidebar__item sidebar__category ${active ? 'sidebar__item--active' : ''}" data-filter="${this.escapeHTML(filter)}" onclick="App.setFilterFromElement(this)">
          <svg class="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h5l2 3h11v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h4l2 4"/></svg>
          <span class="sidebar__item-text">${this.escapeHTML(category.label)}</span>
          <span class="sidebar__count">${count}</span>
          ${isEditor ? `<span class="sidebar__item-actions">
            <button class="sidebar__icon-btn" type="button" title="重命名分类" onclick="event.stopPropagation(); App.renameCategory('${this.escapeHTML(category.id)}')">✎</button>
            <button class="sidebar__icon-btn sidebar__icon-btn--danger" type="button" title="删除分类" onclick="event.stopPropagation(); App.deleteCategory('${this.escapeHTML(category.id)}')">×</button>
          </span>` : ''}
        </a>`;
    }).join('');
    this.ensureCategoryOptions();
  },

  async addCategory() {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const label = prompt('请输入新分类名称：', '新分类');
    if (!label || !label.trim()) return;
    try {
      const category = await this.api('POST', apiPath('/categories'), { label: label.trim() });
      await this.reloadCategories();
      this.renderCategories();
      this.renderMobileFilters();
      this.setFilter(this.getCategoryFilter(category.id));
      this.toast('分类已添加');
    } catch (e) { this.toast(e.message); }
  },

  async renameCategory(id) {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const category = this.getCategoryById(id);
    if (!category) return;
    const label = prompt('请输入新的分类名称：', category.label);
    if (!label || !label.trim() || label.trim() === category.label) return;
    try {
      await this.api('PUT', apiPath('/categories/' + encodeURIComponent(id)), { label: label.trim() });
      await this.reloadCategories();
      this.renderCategories();
      this.renderMobileFilters();
      this.renderNotes();
      this.toast('分类已更新');
    } catch (e) { this.toast(e.message); }
  },

  async deleteCategory(id) {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const category = this.getCategoryById(id);
    if (!category) return;
    if (!confirm(`确定要删除分类"${category.label}"吗？其中的笔记会移到剩余分类。`)) return;
    try {
      await this.api('DELETE', apiPath('/categories/' + encodeURIComponent(id)));
      await this.reloadCategories();
      await this.reloadNotes();
      if (this.currentFilter === this.getCategoryFilter(id)) this.currentFilter = 'all';
      this.renderCategories();
      this.renderTags();
      this.updateCounts();
      this.renderNotes();
      this.toast('分类已删除');
    } catch (e) { this.toast(e.message); }
  },

  renderMobileNotebooks() {
    const container = document.getElementById('mobileNotebookList');
    const addBtn = document.getElementById('mobileAddNotebookBtn');
    if (!container) return;
    const isEditor = this.role === 'editor';
    if (addBtn) addBtn.style.display = isEditor ? 'flex' : 'none';

    container.innerHTML = this._menus.map(menu => {
      const isActive = this.currentNav === menu.id;
      const canEdit = isEditor && menu.id !== 'docs';
      const noteCount = menu.type === 'notebook'
        ? this._notes.filter(note => note.notebookId === menu.id).length
        : this._notes.length;
      return `
        <button class="mobile-sheet__item ${isActive ? 'mobile-sheet__item--active' : ''}" type="button" onclick="App.navTo('${menu.id}')">
          <span>${this.escapeHTML(menu.label)}</span>
          <span class="mobile-sheet__item-count">${noteCount}</span>
          ${canEdit ? `<span class="mobile-sheet__item-actions">
            <span class="mobile-sheet__icon-btn" title="重命名" onclick="event.stopPropagation(); App.renameMenu('${menu.id}')">✎</span>
            <span class="mobile-sheet__icon-btn mobile-sheet__icon-btn--danger" title="删除" onclick="event.stopPropagation(); App.deleteMenu('${menu.id}')">×</span>
          </span>` : ''}
        </button>`;
    }).join('');
  },

  renderMobileFilters() {
    const list = document.getElementById('mobileFilterList');
    if (!list) return;
    const scopedNotes = this.getScopedNotes();
    const items = [
      { filter: 'all', label: '所有笔记', count: scopedNotes.length },
      ...this._categories.map(category => ({
        filter: this.getCategoryFilter(category.id),
        label: category.label,
        count: scopedNotes.filter(n => n.category === category.id).length,
      })),
      { filter: 'star', label: '收藏夹', count: scopedNotes.filter(n => n.starred).length },
    ];
    list.innerHTML = items.map(item => `
      <button class="mobile-sheet__item ${this.currentFilter === item.filter ? 'mobile-sheet__item--active' : ''}" data-filter="${this.escapeHTML(item.filter)}" type="button" onclick="App.setFilterFromElement(this)">
        <span>${this.escapeHTML(item.label)}</span>
        <span class="mobile-sheet__item-count">${item.count}</span>
      </button>
    `).join('');
    this.renderMobileTags();
  },

  renderMobileTags() {
    const container = document.getElementById('mobileTagsList');
    if (!container) return;
    const allTags = new Set();
    this._notes.forEach(n => (n.tags || []).forEach(t => allTags.add(t)));
    if (allTags.size === 0) {
      container.innerHTML = '<span style="font-size:.875rem;color:var(--c400)">暂无标签</span>';
      return;
    }
    container.innerHTML = Array.from(allTags).sort().map(tag => {
      const filter = 'tag:' + tag;
      const active = this.currentFilter === filter;
      const count = this._notes.filter(n => (n.tags || []).includes(tag)).length;
      return `<button class="mobile-sheet__tag ${active ? 'mobile-sheet__tag--active' : ''}" data-filter="${this.escapeHTML(filter)}" type="button" onclick="App.setFilterFromElement(this)">#${this.escapeHTML(tag)} <span>${count}</span></button>`;
    }).join('');
  },

  updateMobileNotebookLabel() {
    const label = document.getElementById('mobileNotebookLabel');
    if (!label) return;
    label.textContent = this.getCurrentNotebookLabel();
  },

  setFilterFromElement(el) {
    if (!el) return;
    this.setFilter(el.dataset.filter || 'all', el);
  },

  // ===== 笔记 CRUD =====
  getCurrentMenu() {
    return this._menus.find(menu => menu.id === this.currentNav) || null;
  },

  getCurrentNotebookId() {
    const menu = this.getCurrentMenu();
    return menu && menu.type === 'notebook' ? menu.id : null;
  },

  getCurrentNotebookLabel() {
    const menu = this.getCurrentMenu();
    return menu && menu.type === 'notebook' ? menu.label : 'Docs';
  },

  getDefaultCategoryId() {
    return this._categories[0]?.id || 'work';
  },

  getCategoryById(id) {
    return this._categories.find(category => category.id === id) || null;
  },

  getCategoryLabel(id) {
    return this.getCategoryById(id)?.label || id || '未分类';
  },

  getCategoryFilter(id) {
    return `category:${id}`;
  },

  isCategoryFilter(filter) {
    return String(filter || '').startsWith('category:');
  },

  getCategoryIdFromFilter(filter) {
    return String(filter || '').slice('category:'.length);
  },

  getScopedNotes() {
    const notebookId = this.getCurrentNotebookId();
    if (!notebookId) return [...this._notes];
    return this._notes.filter(note => note.notebookId === notebookId);
  },

  getFilteredNotes() {
    let notes = this.getScopedNotes();
    if (this.currentFilter === 'star') notes = notes.filter(n => n.starred);
    else if (this.isCategoryFilter(this.currentFilter)) {
      const categoryId = this.getCategoryIdFromFilter(this.currentFilter);
      notes = notes.filter(n => n.category === categoryId);
    }
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
    const notes = this.getScopedNotes();
    document.getElementById('countAll').textContent = notes.length;
    document.getElementById('countStar').textContent = notes.filter(n => n.starred).length;
    this.renderCategories();
    this.renderMobileFilters();
    this.renderMobileNotebooks();
  },

  setSidebarActive(filter, el) {
    document.querySelectorAll('.sidebar__item--active').forEach(i => i.classList.remove('sidebar__item--active'));
    const target = el || Array.from(document.querySelectorAll('.sidebar__item'))
      .find(item => item.dataset.filter === filter);
    if (target) target.classList.add('sidebar__item--active');
  },

  setFilter(filter, el) {
    this.currentFilter = filter;
    this.searchQuery = '';
    document.getElementById('searchInput').value = '';
    this.setSidebarActive(filter, el);
    this.showBrowse(); // showBrowse 内部会 renderNotes
    this.updateCounts();
    this.closeMobileSheets();
  },

  showBrowse() {
    this.currentNote = null;
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
      `<span class="detail__meta-tag">${this.escapeHTML(this.getCategoryLabel(note.category))}</span>`,
      ...(note.tags || []).map(t => `<span>#${this.escapeHTML(t)}</span>`),
      note.notebookId ? `<span>📚 ${this.escapeHTML(this._menus.find(m => m.id === note.notebookId)?.label || 'Notebook')}</span>` : '',
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
    this.editingNoteVersion = null;
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
      this.ensureCategoryOptions(note.category);
      categoryEl.value = note.category;
      tagsEl.value = (note.tags || []).join(', ');
      contentEl.value = note.content;
      this.editingNoteVersion = Number(note.version) || 1;
      deleteBtn.style.display = '';
    } else {
      document.getElementById('modalTitle').textContent = '新建笔记';
      document.getElementById('modalSaveBtn').textContent = '保存笔记';
      titleEl.value = '';
      this.ensureCategoryOptions(this.getDefaultCategoryId());
      categoryEl.value = this.getDefaultCategoryId();
      tagsEl.value = '';
      contentEl.value = '';
      this.editingNoteVersion = null;
      deleteBtn.style.display = 'none';
    }
    modal.classList.add('modal-overlay--active');
    this.autosaveDirty = false;
    this.conflictPending = false;
    this.setEditorMode(this.isMobile() ? 'write' : 'split');
    this.suppressAutosave = true;
    this.updateMarkdownPreview(true);
    this.suppressAutosave = false;
    this.setAutosaveStatus(this.editingNoteId ? `服务器版本 v${this.editingNoteVersion || 1}` : '新笔记尚未保存');
    setTimeout(() => titleEl.focus(), 100);
  },

  async saveNote(options = {}) {
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const keepOpen = Boolean(options.keepOpen);
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    if (!title) { alert('请输入笔记标题'); return; }
    if (!content) { alert('请输入笔记内容'); return; }

    const payload = this.getNoteFormPayload();
    if (this.editingNoteId && this.editingNoteVersion) payload.version = this.editingNoteVersion;

    this.showLoading(true);
    try {
      if (this.editingNoteId) {
        const updated = await this.api('PUT', apiPath('/notes/' + this.editingNoteId), payload);
        this.editingNoteVersion = Number(updated.version) || this.editingNoteVersion;
        this.autosaveDirty = false;
        this.setAutosaveStatus(`已保存 v${this.editingNoteVersion}`);
        this.toast('笔记已更新');
      } else {
        const created = await this.api('POST', apiPath('/notes'), payload);
        this.editingNoteId = created.id;
        this.editingNoteVersion = Number(created.version) || null;
        document.getElementById('modalTitle').textContent = '编辑笔记';
        document.getElementById('modalSaveBtn').textContent = '更新笔记';
        document.getElementById('modalDeleteBtn').style.display = '';
        this.autosaveDirty = false;
        this.setAutosaveStatus(`已保存 v${this.editingNoteVersion || 1}`);
        this.toast('笔记已创建');
      }
      await this.reloadNotes();
      this.updateCounts();
      this.renderTags();
      if (!keepOpen) {
        this.closeModal({ force: true });
        this.showBrowse(); // showBrowse 内部会 renderNotes
      } else {
        this.renderNotes();
      }
    } catch (e) {
      if (e.code === 'VERSION_CONFLICT' || e.status === 409) {
        this.handleVersionConflict(e.current);
        return;
      }
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
      this.closeModal({ force: true });
      this.showBrowse();
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

  hasUnsavedEditorInput() {
    if (this.autosaveDirty) return true;
    if (this.editingNoteId) return false;
    // 新笔记：只要写了内容就视为未保存
    const title = document.getElementById('noteTitle')?.value.trim() || '';
    const content = document.getElementById('noteContent')?.value.trim() || '';
    return Boolean(title || content);
  },

  closeModal(options = {}) {
    if (!options.force && this.role === 'editor' && this.hasUnsavedEditorInput()) {
      if (!confirm('有未保存的修改，确定要关闭吗？')) return;
    }
    document.getElementById('noteModal').classList.remove('modal-overlay--active');
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = null;
    this.autosaveDirty = false;
    this.conflictPending = false;
    this.editingNoteId = null;
    this.editingNoteVersion = null;
  },

  setEditorMode(mode) {
    const editor = document.getElementById('markdownEditor');
    if (!editor) return;
    const safeMode = ['split', 'write', 'preview'].includes(mode) ? mode : 'split';
    this.currentEditorMode = safeMode;
    editor.className = `markdown-editor markdown-editor--${safeMode}`;
    document.querySelectorAll('.modal__view-btn').forEach(btn => {
      btn.classList.toggle('modal__view-btn--active', btn.dataset.editorMode === safeMode);
    });
    if (safeMode !== 'write') {
      // 切换视图只重渲染，不标记未保存
      const previousSuppress = this.suppressAutosave;
      this.suppressAutosave = true;
      this.updateMarkdownPreview(true);
      this.suppressAutosave = previousSuppress;
    }
  },

  cycleEditorMode() {
    const order = this.isMobile() ? ['write', 'preview', 'split'] : ['split', 'write', 'preview'];
    const index = Math.max(0, order.indexOf(this.currentEditorMode));
    this.setEditorMode(order[(index + 1) % order.length]);
  },

  updateMarkdownPreview(immediate = false) {
    this.updateMarkdownStats();
    if (!this.suppressAutosave) this.scheduleAutosave();
    clearTimeout(this._previewTimer);
    if (immediate) {
      this.renderPreviewNow();
    } else {
      // 防抖：长文逐字全量 parse + sanitize 会卡输入
      this._previewTimer = setTimeout(() => this.renderPreviewNow(), 150);
    }
  },

  renderPreviewNow() {
    if (this.currentEditorMode === 'write') return; // 预览隐藏时跳过渲染
    const content = document.getElementById('noteContent');
    const preview = document.getElementById('markdownPreview');
    if (!content || !preview) return;
    preview.innerHTML = this.renderMarkdown(content.value);
  },

  updateMarkdownStats() {
    const content = document.getElementById('noteContent');
    if (!content) return;
    const text = content.value || '';
    const trimmed = text.trim();
    const wordCount = trimmed ? (trimmed.match(/[\u4e00-\u9fa5]|[A-Za-z0-9_]+/g) || []).length : 0;
    const lines = text ? text.split('\n').length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 350));
    const wordsEl = document.getElementById('markdownWords');
    const linesEl = document.getElementById('markdownLines');
    const readEl = document.getElementById('markdownReadTime');
    const notebookEl = document.getElementById('markdownNotebook');
    if (wordsEl) wordsEl.textContent = `${wordCount} 字`;
    if (linesEl) linesEl.textContent = `${lines} 行`;
    if (readEl) readEl.textContent = `${readTime} min 阅读`;
    if (notebookEl) notebookEl.textContent = this.getCurrentNotebookLabel();
  },

  setAutosaveStatus(text) {
    const el = document.getElementById('markdownAutosave');
    if (el) el.textContent = text;
  },

  scheduleAutosave() {
    if (this.role !== 'editor') return;
    this.autosaveDirty = true;
    if (!this.editingNoteId) return; // 新笔记未创建前只标记脏状态，供关闭确认使用
    if (this.conflictPending) return; // 冲突未处理时暂停自动保存，避免反复 409
    this.setAutosaveStatus('有未保存修改');
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => this.autosaveNote(), 2500);
  },

  async autosaveNote() {
    if (!this.editingNoteId || this.autosaveInFlight || !this.autosaveDirty) return;
    this.autosaveInFlight = true;
    this.setAutosaveStatus('正在自动保存...');
    try {
      const payload = this.getNoteFormPayload();
      if (!payload.title || !payload.content) {
        this.setAutosaveStatus('标题或内容为空，自动保存暂停');
        return;
      }
      payload.version = this.editingNoteVersion;
      const updated = await this.api('PUT', apiPath('/notes/' + this.editingNoteId), payload);
      this.editingNoteVersion = Number(updated.version) || this.editingNoteVersion;
      this.autosaveDirty = false;
      const local = this._notes.find(note => note.id === updated.id);
      if (local) Object.assign(local, updated);
      this.lastKnownNotesVersion = this.getNotesVersionFingerprint();
      this.setAutosaveStatus(`已自动保存 ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (e) {
      if (e.status === 409 || e.code === 'VERSION_CONFLICT') {
        this.setAutosaveStatus('其它设备有更新，自动保存已暂停');
        this.handleVersionConflict(e.current);
      } else {
        this.setAutosaveStatus('自动保存失败');
      }
    } finally {
      this.autosaveInFlight = false;
    }
  },

  getNoteFormPayload() {
    const title = document.getElementById('noteTitle').value.trim();
    const category = document.getElementById('noteCategory').value;
    const tagsRaw = document.getElementById('noteTags').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    return { title, category, tags, content, notebookId: this.getCurrentNotebookId() };
  },

  async handleVersionConflict(remote) {
    this.conflictPending = true;
    if (confirm('这篇笔记在其它设备上更新过。选择“确定”重新加载服务器版本（当前编辑内容会丢弃）。')) {
      if (remote) {
        this.applyRemoteNoteToEditor(remote);
      } else if (this.editingNoteId) {
        this.applyRemoteNoteToEditor(await this.api('GET', apiPath('/notes/' + this.editingNoteId)));
      }
      this.conflictPending = false;
      this.toast('已加载服务器版本');
      return;
    }

    // 覆盖服务器是破坏性操作，必须单独确认；取消则保留本地编辑、暂停自动保存
    if (!confirm('要用当前编辑内容覆盖服务器版本吗？服务器上的修改将丢失。')) {
      this.setAutosaveStatus('存在版本冲突，自动保存已暂停，请手动保存或重新打开');
      return;
    }

    if (!this.editingNoteId) return;
    try {
      this.showLoading(true);
      const payload = this.getNoteFormPayload();
      payload.version = this.editingNoteVersion;
      payload.force = true;
      const updated = await this.api('PUT', apiPath('/notes/' + this.editingNoteId), payload);
      this.editingNoteVersion = Number(updated.version) || this.editingNoteVersion;
      this.autosaveDirty = false;
      this.conflictPending = false;
      this.setAutosaveStatus('已覆盖保存');
      await this.reloadNotes();
      this.toast('已覆盖服务器版本');
    } catch (e) {
      this.toast(e.message);
    } finally {
      this.showLoading(false);
    }
  },

  applyRemoteNoteToEditor(note) {
    if (!note) return;
    const previousSuppress = this.suppressAutosave;
    this.suppressAutosave = true;
    try {
      document.getElementById('noteTitle').value = note.title || '';
      this.ensureCategoryOptions(note.category || this.getDefaultCategoryId());
      document.getElementById('noteCategory').value = note.category || this.getDefaultCategoryId();
      document.getElementById('noteTags').value = (note.tags || []).join(', ');
      document.getElementById('noteContent').value = note.content || '';
      this.editingNoteVersion = Number(note.version) || 1;
      this.autosaveDirty = false;
      this.conflictPending = false;
      this.updateMarkdownPreview(true);
    } finally {
      this.suppressAutosave = previousSuppress;
    }
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = null;
    this.autosaveDirty = false;
    this.setAutosaveStatus(`服务器版本 v${this.editingNoteVersion}`);
  },

  getEditorTextarea() {
    return document.getElementById('noteContent');
  },

  replaceEditorSelection(text, selectStart, selectEnd) {
    const ta = this.getEditorTextarea();
    if (!ta) return;
    const start = ta.selectionStart || 0;
    const end = ta.selectionEnd || 0;
    ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
    ta.focus();
    const nextStart = start + (selectStart ?? text.length);
    const nextEnd = start + (selectEnd ?? text.length);
    ta.selectionStart = nextStart;
    ta.selectionEnd = nextEnd;
    this.updateMarkdownPreview();
  },

  wrapEditorSelection(before, after, placeholder) {
    const ta = this.getEditorTextarea();
    if (!ta) return;
    const start = ta.selectionStart || 0;
    const end = ta.selectionEnd || 0;
    const selected = ta.value.slice(start, end) || placeholder;
    const text = before + selected + after;
    this.replaceEditorSelection(text, before.length, before.length + selected.length);
  },

  prefixEditorLines(prefix, fallback) {
    const ta = this.getEditorTextarea();
    if (!ta) return;
    const start = ta.selectionStart || 0;
    const end = ta.selectionEnd || 0;
    const selected = ta.value.slice(start, end) || fallback;
    const lines = selected.split('\n');
    const text = lines.map((line, index) => (
      typeof prefix === 'function' ? prefix(line, index) : prefix + line
    )).join('\n');
    this.replaceEditorSelection(text, 0, text.length);
  },

  applyMarkdownFormat(type) {
    const ta = this.getEditorTextarea();
    if (!ta) return;
    const selected = ta.value.slice(ta.selectionStart || 0, ta.selectionEnd || 0);
    const actions = {
      h1: () => this.prefixEditorLines('# ', '标题'),
      h2: () => this.prefixEditorLines('## ', '标题'),
      h3: () => this.prefixEditorLines('### ', '标题'),
      bold: () => this.wrapEditorSelection('**', '**', '粗体文本'),
      italic: () => this.wrapEditorSelection('*', '*', '斜体文本'),
      quote: () => this.prefixEditorLines('> ', '引用内容'),
      ul: () => this.prefixEditorLines('- ', '列表项'),
      ol: () => this.prefixEditorLines((line, index) => `${index + 1}. ${line}`, '列表项'),
      task: () => this.prefixEditorLines('- [ ] ', '待办事项'),
      inlineCode: () => this.wrapEditorSelection('`', '`', 'code'),
      codeBlock: () => this.replaceEditorSelection(`\`\`\`\n${selected || 'code'}\n\`\`\``, 4, 4 + (selected || 'code').length),
      table: () => this.replaceEditorSelection('| Name | Value |\n| --- | --- |\n| Item | Detail |'),
      link: () => this.wrapEditorSelection('[', '](https://example.com)', selected || '链接文本'),
    };
    if (actions[type]) actions[type]();
  },

  handleEditorKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); this.saveNote({ keepOpen: true }); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this.saveNote(); return; }
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === '1') { e.preventDefault(); this.applyMarkdownFormat('h1'); return; }
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === '2') { e.preventDefault(); this.applyMarkdownFormat('h2'); return; }
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === '3') { e.preventDefault(); this.applyMarkdownFormat('h3'); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); this.applyMarkdownFormat('bold'); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); this.applyMarkdownFormat('italic'); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.applyMarkdownFormat('link'); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === '/') { e.preventDefault(); this.openShortcutModal(); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '7') { e.preventDefault(); this.applyMarkdownFormat('ol'); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '8') { e.preventDefault(); this.applyMarkdownFormat('ul'); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); this.applyMarkdownFormat('codeBlock'); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'x') { e.preventDefault(); this.applyMarkdownFormat('task'); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') { e.preventDefault(); this.cycleEditorMode(); return; }
    if (e.key === 'Tab') { e.preventDefault(); this.indentEditorLines(!e.shiftKey); }
  },

  indentEditorLines(indent) {
    const ta = this.getEditorTextarea();
    if (!ta) return;
    const value = ta.value;
    const start = ta.selectionStart || 0;
    const end = ta.selectionEnd || 0;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEndIndex = value.indexOf('\n', end);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split('\n');
    const next = lines.map(line => indent ? '  ' + line : line.replace(/^ {1,2}/, '')).join('\n');
    ta.value = value.slice(0, lineStart) + next + value.slice(lineEnd);
    ta.selectionStart = lineStart;
    ta.selectionEnd = lineStart + next.length;
    this.updateMarkdownPreview();
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
    await this.uploadImageFile(file);
  },

  async uploadImageFile(file) {
    const fd = new FormData();
    fd.append('image', file);
    this.showLoading(true);
    try {
      const res = await fetch(apiPath('/upload'), { method: 'POST', credentials: 'include', headers: this.accessKey ? { 'X-Access-Key': this.accessKey } : {}, body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || '上传失败');
      this.insertMarkdownImage(file.name || data.name || 'image', data.url);
      this.toast('图片已插入');
    } catch (err) {
      this.toast(err.message);
    } finally {
      this.showLoading(false);
    }
  },

  insertMarkdownImage(name, url) {
    const safeName = String(name || 'image').replace(/[\[\]\n\r]/g, ' ').trim() || 'image';
    const snippet = `![${safeName}](${url})`;
    this.replaceEditorSelection(snippet);
  },

  async handleEditorPaste(e) {
    const files = Array.from(e.clipboardData?.files || []).filter(file => file.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    for (const file of files) await this.uploadImageFile(file);
  },

  async handleEditorDrop(e) {
    const files = Array.from(e.dataTransfer?.files || []).filter(file => file.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    if (this.role !== 'editor') { this.toast('需要编辑密码'); return; }
    const ta = this.getEditorTextarea();
    if (ta) ta.focus();
    for (const file of files) await this.uploadImageFile(file);
  },

  // ===== 笔记列表渲染 =====
  renderNotes() {
    const notes = this.getFilteredNotes();
    const isEditor = this.role === 'editor';
    const grid = document.getElementById('browseView');

    const categoryId = this.isCategoryFilter(this.currentFilter) ? this.getCategoryIdFromFilter(this.currentFilter) : null;
    const filterLabels = { 'all': '笔记管理文档', 'star': '收藏夹' };
    const filterDescs = {
      'all': '探索你的笔记目录结构，了解如何组织和管理个人知识库。点击卡片查看完整内容。',
      'star': '你收藏的重要笔记，方便快速查找和回顾。'
    };
    const filterTitle = categoryId
      ? `${this.getCategoryLabel(categoryId)}笔记`
      : (filterLabels[this.currentFilter] || this.currentFilter.replace('tag:', '#'));
    const notebookLabel = this.getCurrentNotebookLabel();
    const isNotebook = Boolean(this.getCurrentNotebookId());
    const title = isNotebook ? `${notebookLabel} / ${filterTitle}` : filterTitle;
    const desc = isNotebook
      ? `当前笔记本独立保存自己的笔记和分类；标签来自全局，可在此笔记本内继续筛选。`
      : (categoryId ? `当前分类下的笔记。你可以在左侧编辑分类名称，或继续用标签细分。` : (filterDescs[this.currentFilter] || ''));

    let html = `
      <div class="content-header">
        <div class="content-header__breadcrumb">
          <a onclick="App.navTo('docs')">Docs</a><span>/</span>
          <a id="breadcrumbCurrent">${this.escapeHTML(isNotebook ? notebookLabel : filterTitle)}</a>
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
      const isFiltered = Boolean(this.searchQuery) || this.currentFilter !== 'all';
      html += `
        <div class="empty-state">
          <div class="empty-state__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div class="empty-state__title">${isFiltered ? '没有找到匹配的笔记' : '还没有笔记'}</div>
          <div class="empty-state__desc">${isFiltered ? '尝试更换搜索关键词或选择其他分类' : (isEditor ? '点击下方按钮创建第一篇笔记' : '这里还没有内容')}</div>
          ${isEditor ? `<button class="btn btn--primary" onclick="App.openNoteModal()">+ 新建笔记</button>` : ''}
        </div>`;
    } else {
      html += notes.map(n => `
        <div class="note-card" onclick="App.showDetail(${n.id})" role="button" tabindex="0">
          <div class="note-card__header">
            <div class="note-card__icon">${this.getIconSVG(n.id)}</div>
            ${isEditor ? `<div class="note-card__actions">
              <button class="note-card__action-btn" title="切换收藏" onclick="event.stopPropagation(); App.toggleStar(${n.id})">${n.starred ? '⭐' : '☆'}</button>
              <button class="note-card__action-btn note-card__action-btn--delete" title="删除" onclick="event.stopPropagation(); App.deleteNoteDirect(${n.id})">🗑</button>
            </div>` : ''}
          </div>
          <h3 class="note-card__title">${this.escapeHTML(n.title)}</h3>
          <p class="note-card__excerpt">${this.escapeHTML(this.getNotePreviewText(n))}</p>
          <div class="note-card__footer">
            <span class="note-card__date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${n.date}
            </span>
            <span class="note-card__readtime">${n.readTime} 阅读</span>
            <div class="note-card__tags">${(n.tags || []).map(t => `<span class="note-card__tag">#${this.escapeHTML(t)}</span>`).join('')}</div>
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
      this.renderMobileTags();
      return;
    }
    container.innerHTML = Array.from(allTags).sort().map(tag => `
      <a class="sidebar__item" data-filter="${this.escapeHTML('tag:' + tag)}" onclick="App.setFilterFromElement(this)">
        <svg class="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        ${this.escapeHTML(tag)}
        <span class="sidebar__count">${notes.filter(n => (n.tags || []).includes(tag)).length}</span>
      </a>
    `).join('');
    this.renderMobileTags();
  },

  // ===== 搜索 =====
  filter() {
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.searchQuery = document.getElementById('searchInput').value;
      this.renderNotes();
    }, 250);
  },

  // ===== Markdown 渲染 =====
  markdownToPlainText(md) {
    const host = document.createElement('div');
    host.innerHTML = this.renderMarkdown(md || '');
    return (host.textContent || '').replace(/\s+/g, ' ').trim();
  },

  getNotePreviewText(note) {
    // Markdown 全量渲染开销大，按 id+version 缓存，避免每次列表重绘都重新解析
    const cacheKey = `${note?.id}:${note?.version || 1}:${note?.updatedAt || ''}`;
    const cached = this._previewCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const text = this.markdownToPlainText(note?.content || note?.excerpt || '');
    const fallback = String(note?.excerpt || '');
    const preview = text || fallback;
    const cleaned = preview
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    const result = cleaned.length > 140 ? `${cleaned.slice(0, 140).trim()}...` : cleaned;
    if (this._previewCache.size > 500) this._previewCache.clear();
    this._previewCache.set(cacheKey, result);
    return result;
  },

  renderMarkdown(md) {
    if (window.CMSMarkdown?.render) return window.CMSMarkdown.render(md || '');
    // fail closed：渲染模块未加载时降级为纯文本，绝不走未净化的自研渲染
    return `<pre style="white-space:pre-wrap">${this.escapeHTML(md || '')}</pre>`;
  },

  // ===== 工具 =====
  escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },
  getIconSVG(seed) {
    const icons = [
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
    ];
    // 按笔记 id 取模，避免每次重绘图标随机跳变
    const index = Math.abs(Number(seed) || 0) % icons.length;
    return icons[index];
  },
  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('sidebar--open');
    document.getElementById('sidebarOverlay').classList.toggle('overlay--active');
  },
  isMobile() {
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  },
  setMobileSheetLock(on) {
    if (this.isMobile()) window.scrollTo(0, 0);
    document.body.classList.toggle('mobile-sheet-open', Boolean(on));
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.classList.toggle('overlay--active', Boolean(on));
  },
  openNotebookSheet() {
    this.renderMobileNotebooks();
    this.renderMobileFilters();
    document.getElementById('filterSheet')?.classList.remove('mobile-sheet--active');
    const sheet = document.getElementById('notebookSheet');
    sheet?.classList.add('mobile-sheet--active');
    const body = sheet?.querySelector('.mobile-sheet__body');
    if (body) body.scrollTop = 0;
    this.setMobileSheetLock(true);
  },
  closeNotebookSheet() {
    document.getElementById('notebookSheet')?.classList.remove('mobile-sheet--active');
    const filterOpen = document.getElementById('filterSheet')?.classList.contains('mobile-sheet--active');
    this.setMobileSheetLock(filterOpen);
  },
  openFilterSheet() {
    this.renderMobileFilters();
    document.getElementById('notebookSheet')?.classList.remove('mobile-sheet--active');
    const sheet = document.getElementById('filterSheet');
    sheet?.classList.add('mobile-sheet--active');
    const body = sheet?.querySelector('.mobile-sheet__body');
    if (body) body.scrollTop = 0;
    this.setMobileSheetLock(true);
  },
  closeFilterSheet() {
    document.getElementById('filterSheet')?.classList.remove('mobile-sheet--active');
    const notebookOpen = document.getElementById('notebookSheet')?.classList.contains('mobile-sheet--active');
    this.setMobileSheetLock(notebookOpen);
  },
  closeMobileSheets() {
    document.getElementById('notebookSheet')?.classList.remove('mobile-sheet--active');
    document.getElementById('filterSheet')?.classList.remove('mobile-sheet--active');
    document.getElementById('sidebar')?.classList.remove('sidebar--open');
    this.setMobileSheetLock(false);
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
window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) App.refreshFromServer('visibility');
});
window.addEventListener('focus', () => App.refreshFromServer('focus'));

// 窗口跨过 1200px 断点时同步目录栏显隐（原先由 JS 内联 style 写死，resize 后不会恢复）
const tocMediaQuery = window.matchMedia('(min-width: 1200px)');
tocMediaQuery.addEventListener?.('change', () => {
  const toc = document.getElementById('tocNav');
  if (!toc) return;
  const detailEl = document.getElementById('detailView');
  if (detailEl?.classList.contains('detail-view--active')) {
    if (tocMediaQuery.matches) App.renderDetailToc(detailEl);
    else toc.style.display = 'none';
    return;
  }
  const browseVisible = document.getElementById('browseView')?.style.display !== 'none';
  toc.style.display = (tocMediaQuery.matches && browseVisible) ? '' : 'none';
});

// 焦点陷阱：弹窗/登录层打开时，Tab 循环限制在层内
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const overlay = document.querySelector('.modal-overlay.modal-overlay--active, .login-overlay.login-overlay--active');
  if (!overlay) return;
  const focusables = Array.from(overlay.querySelectorAll(
    'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
  )).filter(el => !el.disabled && el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (!overlay.contains(active)) {
    e.preventDefault();
    first.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  }
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented) return;
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    App.openShortcutModal();
    return;
  }
  const noteModalOpen = document.getElementById('noteModal')?.classList.contains('modal-overlay--active');
  if (noteModalOpen && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    App.saveNote({ keepOpen: true });
    return;
  }
  if (noteModalOpen && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    App.saveNote();
    return;
  }
  if (e.key === 'Escape') {
    const shortcutModal = document.getElementById('shortcutModal');
    if (shortcutModal?.classList.contains('modal-overlay--active')) {
      App.closeShortcutModal();
      return;
    }
    const notebookSheet = document.getElementById('notebookSheet');
    const filterSheet = document.getElementById('filterSheet');
    if (notebookSheet?.classList.contains('mobile-sheet--active') || filterSheet?.classList.contains('mobile-sheet--active')) {
      App.closeMobileSheets();
      return;
    }
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal?.classList.contains('modal-overlay--active')) {
      App.closePasswordModal();
      return;
    }
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
document.getElementById('passwordModal').addEventListener('click', function (e) {
  if (e.target === this) App.closePasswordModal();
});
document.getElementById('shortcutModal').addEventListener('click', function (e) {
  if (e.target === this) App.closeShortcutModal();
});
