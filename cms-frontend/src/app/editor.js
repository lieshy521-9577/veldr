import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import { apiPath } from '../config.js';

const EDITOR_HEIGHT = '500px';

function imageAltText(name) {
  return String(name || 'image').replace(/[\[\]\n\r]/g, ' ').trim() || 'image';
}

export const editorMethods = {
  openNoteModal(editId) {
    if (this.role !== 'editor') {
      this.toast('查看模式下不能编辑，请先输入编辑密码');
      return;
    }

    this.editingNoteId = editId || null;
    this.editingNoteVersion = null;
    const modal = document.getElementById('noteModal');
    const titleEl = document.getElementById('noteTitle');
    const categoryEl = document.getElementById('noteCategory');
    const tagsEl = document.getElementById('noteTags');
    const deleteBtn = document.getElementById('modalDeleteBtn');
    let content = '';

    if (editId) {
      const note = this._notes.find((item) => item.id === editId);
      if (!note) return;
      document.getElementById('modalTitle').textContent = '编辑笔记';
      document.getElementById('modalSaveBtn').textContent = '更新笔记';
      titleEl.value = note.title;
      this.ensureCategoryOptions(note.category);
      categoryEl.value = note.category;
      tagsEl.value = (note.tags || []).join(', ');
      content = note.content || '';
      this.editingNoteVersion = Number(note.version) || 1;
      deleteBtn.style.display = '';
    } else {
      document.getElementById('modalTitle').textContent = '新建笔记';
      document.getElementById('modalSaveBtn').textContent = '保存笔记';
      titleEl.value = '';
      this.ensureCategoryOptions(this.getDefaultCategoryId());
      categoryEl.value = this.getDefaultCategoryId();
      tagsEl.value = '';
      deleteBtn.style.display = 'none';
    }

    modal.classList.add('modal-overlay--active');
    this.autosaveDirty = false;
    this.conflictPending = false;
    this.suppressAutosave = true;
    this.setEditorMarkdown(content);
    this.setEditorMode(this.isMobile() ? 'write' : 'split');
    this.updateMarkdownPreview(true);
    this.suppressAutosave = false;
    this.setAutosaveStatus(this.editingNoteId ? `服务器版本 v${this.editingNoteVersion || 1}` : '新笔记尚未保存');
    setTimeout(() => titleEl.focus(), 100);
  },

  ensureRichEditor(initialValue = '') {
    if (this.richEditor) return this.richEditor;

    const host = document.getElementById('noteContentHost');
    if (!host) return null;

    this.richEditor = new Editor({
      el: host,
      height: EDITOR_HEIGHT,
      minHeight: '360px',
      initialValue,
      initialEditType: 'markdown',
      previewStyle: 'vertical',
      hideModeSwitch: true,
      usageStatistics: false,
      autofocus: false,
      placeholder: '在此编写笔记内容...',
      toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task', 'indent', 'outdent'],
        ['table', 'image', 'link'],
        ['code', 'codeblock'],
      ],
      events: {
        change: () => this.updateMarkdownPreview(),
        keydown: (event) => this.handleEditorKeydown(event),
      },
      hooks: {
        addImageBlobHook: async (blob, callback) => {
          try {
            const url = await this.uploadImageFile(blob, { insert: false });
            callback(url, imageAltText(blob.name));
          } catch {
            // uploadImageFile has already shown a useful error message
          }
        },
      },
    });

    return this.richEditor;
  },

  getEditorMarkdown() {
    return this.richEditor?.getMarkdown() || '';
  },

  setEditorMarkdown(markdown) {
    const editor = this.ensureRichEditor(markdown);
    if (!editor) return;
    const previousSuppress = this.suppressAutosave;
    this.suppressAutosave = true;
    editor.setMarkdown(markdown || '', false);
    this.suppressAutosave = previousSuppress;
  },

  async saveNote(options = {}) {
    if (this.role !== 'editor') {
      this.toast('需要编辑密码');
      return;
    }

    const keepOpen = Boolean(options.keepOpen);
    const title = document.getElementById('noteTitle').value.trim();
    const content = this.getEditorMarkdown().trim();
    if (!title) {
      alert('请输入笔记标题');
      return;
    }
    if (!content) {
      alert('请输入笔记内容');
      return;
    }

    const payload = this.getNoteFormPayload();
    if (this.editingNoteId && this.editingNoteVersion) payload.version = this.editingNoteVersion;

    this.showLoading(true);
    try {
      if (this.editingNoteId) {
        const updated = await this.api('PUT', apiPath(`/notes/${this.editingNoteId}`), payload);
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
        this.showBrowse();
      } else {
        this.renderNotes();
      }
    } catch (error) {
      if (error.code === 'VERSION_CONFLICT' || error.status === 409) {
        this.handleVersionConflict(error.current);
        return;
      }
      this.toast(error.message);
    } finally {
      this.showLoading(false);
    }
  },

  async deleteNote() {
    if (this.role !== 'editor') {
      this.toast('需要编辑密码');
      return;
    }
    if (!this.editingNoteId || !confirm('确定要删除这篇笔记吗？此操作不可撤销。')) return;

    this.showLoading(true);
    try {
      await this.api('DELETE', apiPath(`/notes/${this.editingNoteId}`));
      await this.reloadNotes();
      this.updateCounts();
      this.renderTags();
      this.closeModal({ force: true });
      this.showBrowse();
      this.toast('笔记已删除');
    } catch (error) {
      this.toast(error.message);
    } finally {
      this.showLoading(false);
    }
  },

  async deleteNoteDirect(id) {
    if (this.role !== 'editor') {
      this.toast('需要编辑密码');
      return;
    }
    if (!confirm('确定要删除这篇笔记吗？')) return;

    this.showLoading(true);
    try {
      await this.api('DELETE', apiPath(`/notes/${id}`));
      await this.reloadNotes();
      this.updateCounts();
      this.renderTags();
      if (this.currentNote?.id === id) {
        this.currentNote = null;
        this.showBrowse();
      }
      this.renderNotes();
      this.toast('笔记已删除');
    } catch (error) {
      this.toast(error.message);
    } finally {
      this.showLoading(false);
    }
  },

  async toggleStar(id) {
    if (this.role !== 'editor') {
      this.toast('需要编辑密码');
      return;
    }
    const note = this._notes.find((item) => item.id === id);
    if (!note) return;
    const nextStarred = !note.starred;
    note.starred = nextStarred;
    this.updateCounts();
    if (this.currentNote?.id === id) this.currentNote.starred = nextStarred;
    this.renderNotes();
    try {
      await this.api('PUT', apiPath(`/notes/${id}`), { starred: nextStarred });
    } catch (error) {
      note.starred = !nextStarred;
      this.updateCounts();
      this.renderNotes();
      this.toast(error.message);
    }
  },

  hasUnsavedEditorInput() {
    if (this.autosaveDirty) return true;
    if (this.editingNoteId) return false;
    const title = document.getElementById('noteTitle')?.value.trim() || '';
    return Boolean(title || this.getEditorMarkdown().trim());
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
    const wrapper = document.getElementById('markdownEditor');
    const editor = this.ensureRichEditor();
    if (!wrapper || !editor) return;

    const safeMode = ['split', 'write', 'preview'].includes(mode) ? mode : 'split';
    this.currentEditorMode = safeMode;
    wrapper.className = `markdown-editor markdown-editor--${safeMode}`;
    document.querySelectorAll('.modal__view-btn').forEach((button) => {
      button.classList.toggle('modal__view-btn--active', button.dataset.editorMode === safeMode);
    });

    if (safeMode === 'split') {
      editor.changeMode('markdown', true);
      editor.changePreviewStyle('vertical');
    } else if (safeMode === 'write') {
      editor.changeMode('wysiwyg', true);
    } else {
      editor.changeMode('markdown', true);
    }

    const previousSuppress = this.suppressAutosave;
    this.suppressAutosave = true;
    this.updateMarkdownPreview(true);
    this.suppressAutosave = previousSuppress;
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
    if (immediate) this.renderPreviewNow();
    else this._previewTimer = setTimeout(() => this.renderPreviewNow(), 150);
  },

  renderPreviewNow() {
    if (this.currentEditorMode !== 'preview') return;
    const preview = document.getElementById('markdownPreview');
    if (preview) preview.innerHTML = this.renderMarkdown(this.getEditorMarkdown());
  },

  updateMarkdownStats() {
    const text = this.getEditorMarkdown();
    const trimmed = text.trim();
    const wordCount = trimmed ? (trimmed.match(/[\u4e00-\u9fff]|[A-Za-z0-9_]+/g) || []).length : 0;
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
    const status = document.getElementById('markdownAutosave');
    if (status) status.textContent = text;
  },

  scheduleAutosave() {
    if (this.role !== 'editor') return;
    this.autosaveDirty = true;
    if (!this.editingNoteId || this.conflictPending) return;
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
      const updated = await this.api('PUT', apiPath(`/notes/${this.editingNoteId}`), payload);
      this.editingNoteVersion = Number(updated.version) || this.editingNoteVersion;
      this.autosaveDirty = false;
      const local = this._notes.find((note) => note.id === updated.id);
      if (local) Object.assign(local, updated);
      this.lastKnownNotesVersion = this.getNotesVersionFingerprint();
      this.setAutosaveStatus(`已自动保存 ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (error) {
      if (error.status === 409 || error.code === 'VERSION_CONFLICT') {
        this.setAutosaveStatus('其他设备有更新，自动保存已暂停');
        this.handleVersionConflict(error.current);
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
    const content = this.getEditorMarkdown().trim();
    const tags = tagsRaw ? tagsRaw.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
    return { title, category, tags, content, notebookId: this.getCurrentNotebookId() };
  },

  async handleVersionConflict(remote) {
    this.conflictPending = true;
    if (confirm('这篇笔记在其他设备上更新过。点击“确定”加载服务器版本并放弃当前编辑。')) {
      if (remote) this.applyRemoteNoteToEditor(remote);
      else if (this.editingNoteId) this.applyRemoteNoteToEditor(await this.api('GET', apiPath(`/notes/${this.editingNoteId}`)));
      this.conflictPending = false;
      this.toast('已加载服务器版本');
      return;
    }
    if (!confirm('要用当前编辑内容覆盖服务器版本吗？服务器上的修改将被替换。')) {
      this.setAutosaveStatus('存在版本冲突，自动保存已暂停，请手动保存或重新打开');
      return;
    }
    if (!this.editingNoteId) return;
    try {
      this.showLoading(true);
      const payload = this.getNoteFormPayload();
      payload.version = this.editingNoteVersion;
      payload.force = true;
      const updated = await this.api('PUT', apiPath(`/notes/${this.editingNoteId}`), payload);
      this.editingNoteVersion = Number(updated.version) || this.editingNoteVersion;
      this.autosaveDirty = false;
      this.conflictPending = false;
      this.setAutosaveStatus('已覆盖保存');
      await this.reloadNotes();
      this.toast('已覆盖服务器版本');
    } catch (error) {
      this.toast(error.message);
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
      this.setEditorMarkdown(note.content || '');
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

  applyMarkdownFormat(type) {
    const editor = this.ensureRichEditor();
    if (!editor) return;
    const commands = {
      bold: 'bold', italic: 'italic', quote: 'blockQuote', ul: 'bulletList',
      ol: 'orderedList', task: 'taskList', inlineCode: 'code', codeBlock: 'codeBlock',
    };
    if (type === 'table') editor.exec('addTable', { columns: 2, rows: 2 });
    else if (type === 'link') editor.exec('addLink', { linkText: editor.getSelectedText() || '链接文本', linkUrl: 'https://' });
    else if (commands[type]) editor.exec(commands[type]);
    this.updateMarkdownPreview();
  },

  handleEditorKeydown(event) {
    const primary = event.ctrlKey || event.metaKey;
    if (primary && event.key.toLowerCase() === 's') { event.preventDefault(); this.saveNote({ keepOpen: true }); return; }
    if (primary && event.key === 'Enter') { event.preventDefault(); this.saveNote(); return; }
    if (primary && event.key === '/') { event.preventDefault(); this.openShortcutModal(); return; }
    if (primary && event.altKey && ['1', '2', '3'].includes(event.key)) {
      event.preventDefault();
      const selected = this.richEditor?.getSelectedText() || '标题';
      this.richEditor?.insertText(`${'#'.repeat(Number(event.key))} ${selected}`);
      return;
    }
    if (primary && event.shiftKey && event.key === '7') { event.preventDefault(); this.applyMarkdownFormat('ol'); return; }
    if (primary && event.shiftKey && event.key === '8') { event.preventDefault(); this.applyMarkdownFormat('ul'); return; }
    if (primary && event.shiftKey && event.key.toLowerCase() === 'c') { event.preventDefault(); this.applyMarkdownFormat('codeBlock'); return; }
    if (primary && event.shiftKey && event.key.toLowerCase() === 'x') { event.preventDefault(); this.applyMarkdownFormat('task'); return; }
    if (primary && event.shiftKey && event.key.toLowerCase() === 'p') { event.preventDefault(); this.cycleEditorMode(); return; }
    if (event.key === 'Tab') { event.preventDefault(); this.richEditor?.exec(event.shiftKey ? 'outdent' : 'indent'); }
  },

  uploadImage() {
    document.getElementById('imageInput').click();
  },

  async handleImageSelected(event) {
    if (this.role !== 'editor') {
      this.toast('需要编辑密码');
      event.target.value = '';
      return;
    }
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try { await this.uploadImageFile(file); } catch { /* toast shown by uploadImageFile */ }
  },

  async uploadImageFile(file, options = {}) {
    const formData = new FormData();
    formData.append('image', file);
    this.showLoading(true);
    try {
      const response = await fetch(apiPath('/upload'), {
        method: 'POST', credentials: 'include',
        headers: this.accessKey ? { 'X-Access-Key': this.accessKey } : {},
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.url) throw new Error(data?.error || '图片上传失败');
      if (options.insert !== false) {
        this.insertMarkdownImage(file.name || data.name || 'image', data.url);
        this.toast('图片已插入');
      }
      return data.url;
    } catch (error) {
      this.toast(error.message);
      throw error;
    } finally {
      this.showLoading(false);
    }
  },

  insertMarkdownImage(name, url) {
    const editor = this.ensureRichEditor();
    if (!editor) return;
    editor.exec('addImage', { imageUrl: url, altText: imageAltText(name) });
    this.updateMarkdownPreview();
  },
};
