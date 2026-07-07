<template>
  <div class="tinymce-editor">
    <div class="editor-container">
      <Editor
        v-model="content"
        :api-key="apiKey"
        :init="editorConfig"
        :disabled="disabled"
        :tinymce-script-src="tinymceCdnSrc"
        @init="onEditorInit"
        @change="onContentChange"
        @blur="onEditorBlur"
        @focus="onEditorFocus"
      />
      <div v-if="loading" class="editor-loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading editor...</span>
        </div>
        <p class="mt-2">Loading editor...</p>
      </div>
    </div>
    
    <!-- Editor Toolbar (if needed) -->
    <div v-if="showToolbar" class="editor-toolbar">
      <div class="toolbar-group">
        <button
          @click="insertImage"
          class="toolbar-button"
          :disabled="disabled"
          type="button"
        >
          <i class="fas fa-image"></i>
          Insert Image
        </button>
        <button
          @click="insertLink"
          class="toolbar-button"
          :disabled="disabled"
          type="button"
        >
          <i class="fas fa-link"></i>
          Insert Link
        </button>
        <button
          @click="insertTable"
          class="toolbar-button"
          :disabled="disabled"
          type="button"
        >
          <i class="fas fa-table"></i>
          Insert Table
        </button>
      </div>
      
      <div class="toolbar-group">
        <button
          @click="togglePreview"
          class="toolbar-button"
          :disabled="disabled"
          type="button"
        >
          <i class="fas fa-eye"></i>
          {{ isPreviewMode ? 'Edit' : 'Preview' }}
        </button>
        <button
          @click="toggleFullscreen"
          class="toolbar-button"
          :disabled="disabled"
          type="button"
        >
          <i class="fas fa-expand"></i>
          {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
        </button>
      </div>
    </div>
    
    <!-- Character Count -->
    <div v-if="showCharCount" class="char-count">
      <span class="char-count-text">
        {{ characterCount }} characters
        <span v-if="wordCount > 0">({{ wordCount }} words)</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { useToast } from 'vue-toastification';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  height: {
    type: [Number, String],
    default: 500
  },
  placeholder: {
    type: String,
    default: 'Start writing...'
  },
  showToolbar: {
    type: Boolean,
    default: false
  },
  showCharCount: {
    type: Boolean,
    default: true
  },
  uploadUrl: {
    type: String,
    default: '/api/upload'
  },
  apiKey: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'init', 'change', 'blur', 'focus']);

const toast = useToast();
const loading = ref(true);
const editorInstance = ref(null);
const isPreviewMode = ref(false);
const isFullscreen = ref(false);

// Use Tiny Cloud CDN so core & plugins resolve correctly
const tinyApiKey = props.apiKey || import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';
const tinymceCdnSrc = `https://cdn.tiny.cloud/1/${tinyApiKey}/tinymce/6/tinymce.min.js`;

const content = ref(String(props.modelValue || ''));

// 调试函数 (已禁用)
const debugLog = (message, value) => {
  // console.log(`[TinyMCE Debug] ${message}:`, {
  //   type: typeof value,
  //   value: value,
  //   isString: typeof value === 'string',
  //   isObject: typeof value === 'object',
  //   isNull: value === null,
  //   isUndefined: value === undefined
  // });  // 调试日志已禁用
};

// Character and word count
const characterCount = computed(() => {
  const html = String(content.value ?? '');
  return html.replace(/<[^>]*>/g, '').length;
});

const wordCount = computed(() => {
  const html = String(content.value ?? '');
  const text = html.replace(/<[^>]*>/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
});

// Editor configuration
const editorConfig = {
  height: props.height,
  width: '100%',
  menubar: false, // 禁用菜单栏
  branding: false, // 关闭底部官网提示
  statusbar: true, // 显示底部状态栏
  readonly: false, // 设置只读属性
  resize: false, // 调节编辑器大小
  contextmenu: 'copy paste cut link', // 上下文菜单
  draggable_modal: true, // 模态框拖动
  placeholder: props.placeholder,
  theme: 'silver', // 主题
  language: 'zh_CN', // 设置语言为中文
  content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
  fontsize_formats: '12px 14px 16px 18px 20px 22px 24px 26px 36px 48px 56px', // 字体大小选项
  font_formats: "微软雅黑='微软雅黑'; 宋体='宋体'; 黑体='黑体'; 仿宋='仿宋'; 楷体='楷体'; 隶书='隶书'; 幼圆='幼圆'; Arial=arial; Arial Black=arial black; Book Antiqua=book antiqua; Comic Sans MS=comic sans ms; Courier New=courier new; Georgia=georgia; Helvetica=helvetica; Impact=impact; Tahoma=tahoma; Times New Roman=times new roman; Trebuchet MS=trebuchet ms; Verdana=verdana",
  toolbar_sticky: true, // 粘性工具栏
  toolbar_mode: 'sliding', // 滑动工具栏模式
  // 插件配置 - 移除有问题的插件
  plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount autoresize emoticons',
  // 工具栏配置
  toolbar: 'undo redo | fontselect styleselect fontsizeselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist | link image media table | forecolor backcolor | removeformat | customUpload clearContent | code | help | fullscreen',
  // 图片上传配置
  // images_upload_url: props.uploadUrl, // 移除，只使用自定义处理器
  automatic_uploads: true,
  file_picker_types: 'image',
  image_advtab: true, // 为上传图片窗口添加高级属性
  // 添加上传处理器来处理响应
  images_upload_handler: (blobInfo, progress) => {
    console.log('TinyMCE upload handler called:', {
      filename: blobInfo.filename(),
      size: blobInfo.blob().size,
      uploadUrl: props.uploadUrl,
      progress: typeof progress
    });
    
    // 返回 Promise 而不是使用回调函数
    return new Promise((resolve, reject) => {
    
      const formData = new FormData();
      formData.append('file', blobInfo.blob(), blobInfo.filename());
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', props.uploadUrl);
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && typeof progress === 'function') {
          const percentComplete = (e.loaded / e.total) * 100;
          console.log('Upload progress:', percentComplete + '%');
          progress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        console.log('Upload response received:', xhr.status, xhr.responseText);
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('Parsed response:', response);
            if (response.success && response.url) {
              console.log('Upload successful, resolving with URL:', response.url);
              toast.success('图片上传成功');
              resolve(response.url);
            } else {
              console.log('Upload failed, rejecting with message');
              const errorMsg = response.message || '上传失败';
              toast.error('图片上传失败: ' + errorMsg);
              reject(new Error(errorMsg));
            }
          } catch (e) {
            console.error('Response parsing error:', e);
            toast.error('图片上传失败: 响应解析失败');
            reject(new Error('响应解析失败'));
          }
        } else {
          console.log('HTTP error, rejecting with status');
          const errorMsg = 'HTTP错误: ' + xhr.status;
          toast.error('图片上传失败: ' + errorMsg);
          reject(new Error(errorMsg));
        }
      });
      
      xhr.addEventListener('error', (e) => {
        console.error('XHR error:', e);
        toast.error('图片上传失败: 网络错误');
        reject(new Error('网络错误'));
      });
      
      xhr.addEventListener('timeout', () => {
        console.error('Upload timeout');
        toast.error('图片上传失败: 上传超时');
        reject(new Error('上传超时'));
      });
      
      xhr.timeout = 30000; // 30秒超时
      xhr.send(formData);
    });
  },
  // 粘贴配置
  paste_data_images: true, // 粘贴data格式的图像
  paste_as_text: false, // 允许粘贴格式
  // URL配置
  relative_urls: false,
  remove_script_host: false,
  convert_urls: true,
  // 快速工具栏配置
  quickbars_selection_toolbar: 'bold italic underline strikethrough | link h2 h3 h4 blockquote',
  quickbars_insert_toolbar: 'quickimage quicktable',
  // 文本模式配置
  textpattern_patterns: [
    { start: '*', end: '*', format: 'italic' },
    { start: '**', end: '**', format: 'bold' },
    { start: '#', format: 'h1' },
    { start: '##', format: 'h2' },
    { start: '###', format: 'h3' },
    { start: '####', format: 'h4' },
    { start: '#####', format: 'h5' },
    { start: '######', format: 'h6' },
    { start: '1. ', cmd: 'InsertOrderedList' },
    { start: '* ', cmd: 'InsertUnorderedList' },
    { start: '- ', cmd: 'InsertUnorderedList' }
  ],
  // Custom file picker - 使用与主上传处理器相同的逻辑
  file_picker_callback: (callback, value, meta) => {
    if (meta.filetype === 'image') {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      
      input.onchange = function() {
        const file = this.files[0];
        if (file) {
          // 验证文件大小 (16MB限制)
          const isLt16M = file.size / 1024 / 1024 < 16;
          if (!isLt16M) {
            toast.error('图片大小不能超过16MB');
            return;
          }
          
          console.log('File picker upload started:', file.name, file.size);
          
          const formData = new FormData();
          formData.append('file', file);
          
          const xhr = new XMLHttpRequest();
          xhr.open('POST', props.uploadUrl);
          
          xhr.addEventListener('load', () => {
            console.log('File picker response:', xhr.status, xhr.responseText);
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.success && response.url) {
                  console.log('File picker upload successful:', response.url);
                  callback(response.url, { title: file.name });
                  toast.success('图片上传成功');
                } else {
                  toast.error('图片上传失败: ' + (response.message || '未知错误'));
                }
              } catch (e) {
                console.error('File picker response parsing error:', e);
                toast.error('图片上传失败: 响应解析失败');
              }
            } else {
              toast.error('图片上传失败: HTTP错误 ' + xhr.status);
            }
          });
          
          xhr.addEventListener('error', () => {
            console.error('File picker XHR error');
            toast.error('图片上传失败: 网络错误');
          });
          
          xhr.timeout = 30000;
          xhr.send(formData);
        }
      };
      
      input.click();
    }
  },
  // 初始化回调
  init_instance_callback: (editor) => {
    console.log('TinyMCE init_instance_callback');
    loading.value = false;
    editorInstance.value = editor;
    hasInit.value = true;
    
    // 初始化时设置内容
    if (props.modelValue) {
      const stringValue = String(props.modelValue || '');
      editor.setContent(stringValue);
      content.value = stringValue;
    }
    
    // 监听编辑器内容变化
    editor.on('Input undo redo Change execCommand SetContent', (e) => {
      hasChange.value = true;
      const editorContent = editor.getContent();
      content.value = String(editorContent || '');
      emit('change', editorContent, editor);
      
      // 延迟重置标志位，防止循环更新
      setTimeout(() => {
        hasChange.value = false;
      }, 100);
    });
  },
  // Setup function
  setup: (editor) => {
    editor.on('init', () => {
      console.log('TinyMCE editor initialized');
      
      // 添加强制通知清理机制
      setInterval(() => {
        const notifications = document.querySelectorAll('.tox-notification');
        notifications.forEach(notification => {
          const text = notification.querySelector('.tox-text')?.textContent;
          if (text && text.includes('uploads/')) {
            // 检查是否是上传相关的通知
            const progressBar = notification.querySelector('.tox-bar');
            if (progressBar) {
              const width = progressBar.style.width;
              // 如果进度条是100%或者通知存在超过10秒，强制关闭
              if (width === '100%' || width === '100%') {
                console.log('Removing completed upload notification');
                notification.remove();
              }
            } else {
              // 如果没有进度条但是包含uploads/，可能是错误通知，也尝试关闭
              const isError = notification.classList.contains('tox-notification--error');
              if (isError) {
                console.log('Removing error upload notification');
                notification.remove();
              }
            }
          }
        });
      }, 2000); // 每2秒检查一次
      
      // 添加强制清理所有通知的机制（作为备用）
      setTimeout(() => {
        const allNotifications = document.querySelectorAll('.tox-notification');
        allNotifications.forEach(notification => {
          const text = notification.querySelector('.tox-text')?.textContent;
          if (text && text.includes('uploads/')) {
            console.log('Force removing upload notification');
            notification.remove();
          }
        });
      }, 5000); // 5秒后强制清理
    });
    
    // 添加自定义按钮
    editor.ui.registry.addButton('customUpload', {
      text: '📁',
      tooltip: '上传图片',
      onAction: () => {
        // 触发文件选择
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
      }
    });
    
    // 添加清空内容按钮
    editor.ui.registry.addButton('clearContent', {
      text: '🗑️',
      tooltip: '清空内容',
      onAction: () => {
        editor.setContent('');
        content.value = '';
      }
    });
    
    // 添加全屏按钮
    editor.ui.registry.addButton('fullscreen', {
      text: '⛶',
      tooltip: '全屏',
      onAction: () => {
        editor.execCommand('mceFullScreen');
      }
    });
    
    // 监听Tab键进行缩进
    editor.on('keydown', (e) => {
      if (e.keyCode === 9) {
        if (e.shiftKey) {
          editor.execCommand('Outdent');
        } else {
          editor.execCommand('Indent');
        }
        e.preventDefault();
        e.stopPropagation();
      }
    });
    
    // 监听全屏状态变化
    editor.on('FullscreenStateChanged', (e) => {
      isFullscreen.value = e.state;
    });
  }
};

// 添加标志位防止循环更新
const hasChange = ref(false);
const hasInit = ref(false);

// Watch for model value changes
watch(() => props.modelValue, (newValue) => {
  debugLog('Model value changed', newValue);
  if (!hasChange.value && hasInit.value) {
    const stringValue = String(newValue || '');
    if (stringValue !== content.value) {
      content.value = stringValue;
      // 使用 nextTick 确保 DOM 更新后再设置内容
      nextTick(() => {
        if (editorInstance.value) {
          editorInstance.value.setContent(stringValue);
        }
      });
    }
  }
});

// Watch for content changes
watch(content, (newValue) => {
  emit('update:modelValue', newValue);
});

// Editor event handlers
const onEditorInit = (event, editor) => {
  emit('init', editor);
};

const onContentChange = (val, editor) => {
  // 确保内容始终是字符串
  const stringValue = String(val ?? '');
  content.value = stringValue;
  emit('change', stringValue, editor);
};

const onEditorBlur = (event, editor) => {
  emit('blur', event, editor);
};

const onEditorFocus = (event, editor) => {
  emit('focus', event, editor);
};

// Toolbar actions
const insertImage = () => {
  if (editorInstance.value) {
    editorInstance.value.execCommand('mceImage');
  }
};

const insertLink = () => {
  if (editorInstance.value) {
    editorInstance.value.execCommand('mceLink');
  }
};

const insertTable = () => {
  if (editorInstance.value) {
    editorInstance.value.execCommand('mceInsertTable');
  }
};

const togglePreview = () => {
  if (editorInstance.value) {
    if (isPreviewMode.value) {
      editorInstance.value.execCommand('mcePreview');
    } else {
      editorInstance.value.execCommand('mcePreview');
    }
    isPreviewMode.value = !isPreviewMode.value;
  }
};

const toggleFullscreen = () => {
  if (editorInstance.value) {
    editorInstance.value.execCommand('mceFullScreen');
    isFullscreen.value = !isFullscreen.value;
  }
};

// Expose methods
defineExpose({
  focus: () => editorInstance.value?.focus(),
  blur: () => editorInstance.value?.blur(),
  getContent: () => editorInstance.value?.getContent(),
  setContent: (content) => editorInstance.value?.setContent(content),
  insertContent: (content) => editorInstance.value?.insertContent(content),
  execCommand: (command) => editorInstance.value?.execCommand(command),
  getEditor: () => editorInstance.value
});

// Cleanup on unmount
onUnmounted(() => {
  if (editorInstance.value) {
    editorInstance.value.destroy();
  }
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.tinymce-editor {
  width: 100%;
}

.editor-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border: 2px solid $border-color;
  border-radius: 0.5rem;
  
  .spinner-border {
    width: 2rem;
    height: 2rem;
  }
  
  p {
    margin: 0;
    color: $text-muted;
    font-size: 0.875rem;
  }
}

.editor-container {
  width: 100%;
  position: relative;
  
  :deep(.tox-tinymce) {
    border-radius: 0.5rem !important;
    border-color: $border-color !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    
    &:focus-within {
      border-color: $primary-color !important;
      box-shadow: 0 0 0 3px rgba($primary-color, 0.1) !important;
    }
  }
  
  :deep(.tox-toolbar) {
    background: #f8f9fa !important;
    border-bottom: 1px solid $border-color !important;
  }
  
  :deep(.tox-edit-area__iframe) {
    background: white !important;
  }
  
  :deep(.tox-statusbar) {
    background: #f8f9fa !important;
    border-top: 1px solid $border-color !important;
  }
  
  :deep(.tox-edit-area__iframe) {
    border-radius: 0 0 0.5rem 0.5rem !important;
  }
  
  :deep(.tox-toolbar) {
    border-radius: 0.5rem 0.5rem 0 0 !important;
  }
}

.editor-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  z-index: 2;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: $light-bg;
  border: 1px solid $border-color;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
}

.toolbar-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid $border-color;
  border-radius: 0.375rem;
  color: $text-color;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: $primary-color;
    color: white;
    border-color: $primary-color;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  i {
    font-size: 0.75rem;
  }
}

.char-count {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: $light-bg;
  border: 1px solid $border-color;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
}

.char-count-text {
  font-size: 0.75rem;
  color: $text-muted;
  font-weight: 500;
}

.spinner-border {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  vertical-align: -0.125em;
  border: 0.25em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to { transform: rotate(360deg); }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.mt-2 {
  margin-top: 0.5rem;
}

.text-primary {
  color: $primary-color;
}

// Responsive design
@media (max-width: 768px) {
  .editor-toolbar {
    padding: 0.5rem;
  }
  
  .toolbar-button {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .char-count {
    padding: 0.375rem;
  }
  
  .char-count-text {
    font-size: 0.625rem;
  }
}
</style>
