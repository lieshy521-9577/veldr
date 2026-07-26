// ===== 通用 UI 工具：转义、图标、抽屉、toast、进度条 =====
export const uiMethods = {
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
  },
};
