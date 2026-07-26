// ===== 事件委托：JS 生成的 DOM 一律用 data-action，不再拼接内联 onclick =====
// （消除 id/标签值注入内联 JS 的风险，也为将来启用 CSP 扫清 JS 侧障碍。）

const clickActions = {
  'nav': (App, el) => App.navTo(el.dataset.id),
  'add-menu': (App) => App.addMenu(),
  'rename-menu': (App, el) => App.renameMenu(el.dataset.id),
  'delete-menu': (App, el) => App.deleteMenu(el.dataset.id),
  'set-filter': (App, el) => App.setFilterFromElement(el),
  'rename-category': (App, el) => App.renameCategory(el.dataset.id),
  'delete-category': (App, el) => App.deleteCategory(el.dataset.id),
  'show-detail': (App, el) => App.showDetail(Number(el.dataset.id)),
  'show-browse': (App) => App.showBrowse(),
  'toggle-star': (App, el) => App.toggleStar(Number(el.dataset.id)),
  'delete-note': (App, el) => App.deleteNoteDirect(Number(el.dataset.id)),
  'open-note-modal': (App, el) => App.openNoteModal(el.dataset.id ? Number(el.dataset.id) : undefined),
  'scroll-heading': (App, el) => {
    document.getElementById(`note-heading-${el.dataset.index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
};

export function installDelegation(App) {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const handler = clickActions[el.dataset.action];
    if (!handler) return;
    handler(App, el);
  });

  // 笔记卡片 role="button"：补齐键盘可达（Enter / Space 打开详情）
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target;
    if (!(el instanceof Element) || !el.matches('.note-card[data-action="show-detail"]')) return;
    e.preventDefault();
    App.showDetail(Number(el.dataset.id));
  });

  // 顶部菜单：双击重命名、右键删除（原内联 ondblclick/oncontextmenu）
  document.addEventListener('dblclick', (e) => {
    const el = e.target.closest('.topnav__link[data-action="nav"]');
    if (!el || App.role !== 'editor') return;
    App.startEditMenu(el.dataset.id, el);
  });

  document.addEventListener('contextmenu', (e) => {
    const el = e.target.closest('.topnav__link[data-action="nav"]');
    if (!el || App.role !== 'editor') return;
    e.preventDefault();
    App.deleteMenu(el.dataset.id); // docs 菜单由 deleteMenu 内部拦截
  });
}
