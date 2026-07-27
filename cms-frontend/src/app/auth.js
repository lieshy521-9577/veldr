import { apiPath, ACCESS_KEY_STORAGE } from '../config.js';

// ===== 认证与会话（HttpOnly Cookie 优先） =====
export const authMethods = {
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
    // 以 viewer 身份重新拉取数据：private 标签的笔记由服务端过滤，不能留在内存里
    this.enterApp();
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
        this.applyRouteFromHash();
      })
      .catch(() => this.showLoading(false));
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
};
