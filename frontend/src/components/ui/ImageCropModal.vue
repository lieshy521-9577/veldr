<template>
  <div v-if="show" class="image-crop-modal" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>裁剪图片</h3>
        <button @click="closeModal" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="crop-container">
          <vue-cropper
            ref="cropper"
            :src="imageSrc"
            :aspect-ratio="aspectRatio"
            :view-mode="1"
            :drag-mode="'move'"
            :background="false"
            :auto-crop-area="0.8"
            :restore="false"
            :guides="true"
            :center="true"
            :highlight="true"
            :crop-box-movable="true"
            :crop-box-resizable="true"
            :toggle-drag-mode-on-dblclick="false"
            :min-container-width="300"
            :min-container-height="300"
            :min-crop-box-width="100"
            :min-crop-box-height="100"
            :responsive="true"
            :check-cross-origin="false"
            :check-orientation="false"
            :modal="true"
            :scalable="true"
            :zoomable="true"
            :zoom-on-touch="true"
            :zoom-on-wheel="true"
            :ready="onCropperReady"
            class="cropper"
          />
        </div>
        
        <div class="crop-controls">
          <div class="control-group">
            <label>质量:</label>
            <input
              v-model="quality"
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              class="quality-slider"
            />
            <span class="quality-value">{{ Math.round(quality * 100) }}%</span>
          </div>
          
          <div class="control-group">
            <label>最大尺寸:</label>
            <select v-model="maxSize" class="size-select">
              <option value="800">800px</option>
              <option value="1200">1200px</option>
              <option value="1600">1600px</option>
              <option value="2000">2000px</option>
              <option value="original">原始尺寸</option>
            </select>
          </div>
        </div>
        
        <div class="preview-section">
          <h4>预览</h4>
          <div class="preview-container">
            <img :src="previewImage" alt="预览" class="preview-image" />
            <div class="preview-info">
              <p>尺寸: {{ previewSize.width }} × {{ previewSize.height }}</p>
              <p>大小: {{ formatFileSize(previewSize.size) }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">取消</button>
        <button @click="resetCrop" class="btn btn-outline">重置</button>
        <button @click="cropImage" class="btn btn-primary" :disabled="isProcessing">
          <i v-if="isProcessing" class="fas fa-spinner fa-spin"></i>
          {{ isProcessing ? '处理中...' : '确认裁剪' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import VueCropper from 'vue-cropperjs';
// import 'cropperjs/dist/cropper.min.css';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  imageSrc: {
    type: String,
    required: true
  },
  aspectRatio: {
    type: Number,
    default: 16 / 9
  }
});

const emit = defineEmits(['close', 'crop-complete']);

const cropper = ref(null);
const quality = ref(0.8);
const maxSize = ref('1200');
const isProcessing = ref(false);
const previewImage = ref('');
const previewSize = ref({ width: 0, height: 0, size: 0 });

// 关闭模态框
const closeModal = () => {
  emit('close');
};

// 重置裁剪
const resetCrop = () => {
  if (cropper.value) {
    cropper.value.reset();
  }
};

// 压缩图片
const compressImage = (canvas, quality, maxWidth, maxHeight) => {
  const ctx = canvas.getContext('2d');
  let { width, height } = canvas;
  
  // 计算新尺寸
  if (maxWidth && maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    if (ratio < 1) {
      width *= ratio;
      height *= ratio;
    }
  }
  
  // 创建新画布
  const newCanvas = document.createElement('canvas');
  newCanvas.width = width;
  newCanvas.height = height;
  const newCtx = newCanvas.getContext('2d');
  
  // 绘制压缩后的图片
  newCtx.drawImage(canvas, 0, 0, width, height);
  
  return newCanvas;
};

// 更新预览
const updatePreview = async () => {
  if (!cropper.value) return;
  
  try {
    const canvas = cropper.value.getCroppedCanvas({
      maxWidth: maxSize.value === 'original' ? Infinity : parseInt(maxSize.value),
      maxHeight: maxSize.value === 'original' ? Infinity : parseInt(maxSize.value),
    });
    
    if (canvas) {
      const compressedCanvas = compressImage(
        canvas, 
        quality.value, 
        maxSize.value === 'original' ? null : parseInt(maxSize.value),
        maxSize.value === 'original' ? null : parseInt(maxSize.value)
      );
      
      previewImage.value = compressedCanvas.toDataURL('image/jpeg', quality.value);
      previewSize.value = {
        width: Math.round(compressedCanvas.width),
        height: Math.round(compressedCanvas.height),
        size: compressedCanvas.toBlob ? await new Promise(resolve => {
          compressedCanvas.toBlob(blob => resolve(blob.size), 'image/jpeg', quality.value);
        }) : 0
      };
    }
  } catch (error) {
    console.error('更新预览失败:', error);
  }
};

// 裁剪图片
const cropImage = async () => {
  if (!cropper.value) return;
  
  isProcessing.value = true;
  
  try {
    const canvas = cropper.value.getCroppedCanvas({
      maxWidth: maxSize.value === 'original' ? Infinity : parseInt(maxSize.value),
      maxHeight: maxSize.value === 'original' ? Infinity : parseInt(maxSize.value),
    });
    
    if (!canvas) {
      throw new Error('无法获取裁剪后的图片');
    }
    
    // 压缩图片
    const compressedCanvas = compressImage(
      canvas, 
      quality.value, 
      maxSize.value === 'original' ? null : parseInt(maxSize.value),
      maxSize.value === 'original' ? null : parseInt(maxSize.value)
    );
    
    // 转换为 Blob
    const blob = await new Promise(resolve => {
      compressedCanvas.toBlob(resolve, 'image/jpeg', quality.value);
    });
    
    // 创建 File 对象
    const file = new File([blob], 'cropped-image.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
    
    emit('crop-complete', file);
    closeModal();
    
  } catch (error) {
    console.error('裁剪图片失败:', error);
    alert('裁剪图片失败，请重试');
  } finally {
    isProcessing.value = false;
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 监听质量变化
watch(quality, updatePreview);
watch(maxSize, updatePreview);

// 监听图片源变化
watch(() => props.imageSrc, () => {
  if (props.imageSrc && cropper.value) {
    nextTick(() => {
      updatePreview();
    });
  }
});

// 监听显示状态
watch(() => props.show, (show) => {
  if (show && cropper.value) {
    nextTick(() => {
      // 确保 Cropper.js 正确初始化
      if (cropper.value && cropper.value.cropper) {
        cropper.value.cropper.reset();
        cropper.value.cropper.clear();
        cropper.value.cropper.replace(props.imageSrc);
      }
      updatePreview();
    });
  }
});

// Cropper 准备就绪回调
const onCropperReady = () => {
  console.log('Cropper ready');
  updatePreview();
};

// 初始化 Cropper
const initializeCropper = () => {
  if (cropper.value && props.imageSrc) {
    nextTick(() => {
      if (cropper.value && cropper.value.cropper) {
        cropper.value.cropper.reset();
        cropper.value.cropper.clear();
        cropper.value.cropper.replace(props.imageSrc);
        updatePreview();
      }
    });
  }
};
</script>

<style lang="scss" scoped>
.image-crop-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.crop-container {
  margin-bottom: 20px;
  position: relative;
  width: 100%;
  height: 400px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  
  .cropper {
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    max-height: none !important;
  }
}

.crop-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
  
  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
    
    label {
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
    }
    
    .quality-slider {
      width: 120px;
    }
    
    .size-select {
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
    }
    
    .quality-value {
      font-weight: 500;
      color: #059669;
      min-width: 40px;
    }
  }
}

.preview-section {
  h4 {
    margin: 0 0 10px 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }
  
  .preview-container {
    display: flex;
    gap: 15px;
    align-items: center;
    padding: 15px;
    background: #f9fafb;
    border-radius: 6px;
  }
  
  .preview-image {
    width: 120px;
    height: 80px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #d1d5db;
  }
  
  .preview-info {
    p {
      margin: 0 0 4px 0;
      font-size: 0.875rem;
      color: #6b7280;
    }
  }
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.btn-primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
    
    &:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }
  }
  
  &.btn-secondary {
    background: #6b7280;
    color: white;
    border-color: #6b7280;
    
    &:hover:not(:disabled) {
      background: #4b5563;
      border-color: #4b5563;
    }
  }
  
  &.btn-outline {
    background: white;
    color: #374151;
    border-color: #d1d5db;
    
    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .crop-container .cropper {
    height: 300px;
  }
  
  .crop-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .preview-container {
    flex-direction: column;
    text-align: center;
  }
  
  .modal-footer {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
}

// Cropper.js 基础样式
:global(.cropper-container) {
  direction: ltr;
  font-size: 0;
  line-height: 0;
  position: relative;
  -ms-touch-action: none;
  touch-action: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  width: 100% !important;
  height: 100% !important;
}

:global(.cropper-container img) {
  backface-visibility: hidden;
  display: block;
  height: 100%;
  image-orientation: 0deg;
  max-height: none !important;
  max-width: none !important;
  min-height: 0 !important;
  min-width: 0 !important;
  width: 100%;
}

:global(.cropper-wrap-box) {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

:global(.cropper-canvas) {
  left: 0;
  position: absolute;
  top: 0;
}

:global(.cropper-crop-box) {
  left: 0;
  position: absolute;
  top: 0;
}

:global(.cropper-view-box) {
  display: block;
  height: 100%;
  outline: 1px solid #39f;
  outline-color: rgba(51, 153, 255, 0.75);
  overflow: hidden;
  width: 100%;
}

:global(.cropper-dashed) {
  border: 0 dashed #eee;
  display: block;
  opacity: 0.5;
  position: absolute;
}

:global(.cropper-dashed.dashed-h) {
  border-bottom-width: 1px;
  border-top-width: 1px;
  height: calc(100% / 3);
  left: 0;
  top: calc(100% / 3);
  width: 100%;
}

:global(.cropper-dashed.dashed-v) {
  border-left-width: 1px;
  border-right-width: 1px;
  height: 100%;
  left: calc(100% / 3);
  top: 0;
  width: calc(100% / 3);
}

:global(.cropper-center) {
  display: block;
  height: 0;
  left: 50%;
  opacity: 0.75;
  position: absolute;
  top: 50%;
  width: 0;
}

:global(.cropper-center:before) {
  background-color: #eee;
  content: " ";
  display: block;
  height: 1px;
  left: -3px;
  position: absolute;
  top: -3px;
  width: 7px;
}

:global(.cropper-center:after) {
  background-color: #eee;
  content: " ";
  display: block;
  height: 7px;
  left: -3px;
  position: absolute;
  top: -3px;
  width: 1px;
}

:global(.cropper-face) {
  background-color: #fff;
  display: block;
  height: 100%;
  opacity: 0.1;
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

:global(.cropper-line) {
  background-color: #39f;
  display: block;
  height: 100%;
  opacity: 0.75;
  position: absolute;
  width: 100%;
}

:global(.cropper-line.line-e) {
  cursor: ew-resize;
  right: -3px;
  top: 0;
  width: 5px;
}

:global(.cropper-line.line-n) {
  cursor: ns-resize;
  height: 5px;
  left: 0;
  top: -3px;
  width: 100%;
}

:global(.cropper-line.line-w) {
  cursor: ew-resize;
  left: -3px;
  top: 0;
  width: 5px;
}

:global(.cropper-line.line-s) {
  bottom: -3px;
  cursor: ns-resize;
  height: 5px;
  left: 0;
  width: 100%;
}

:global(.cropper-point) {
  background-color: #39f;
  display: block;
  height: 5px;
  opacity: 0.75;
  position: absolute;
  width: 5px;
}

:global(.cropper-point.point-e) {
  cursor: ew-resize;
  margin-top: -3px;
  right: -3px;
  top: 50%;
}

:global(.cropper-point.point-n) {
  cursor: ns-resize;
  left: 50%;
  margin-left: -3px;
  top: -3px;
}

:global(.cropper-point.point-w) {
  cursor: ew-resize;
  left: -3px;
  margin-top: -3px;
  top: 50%;
}

:global(.cropper-point.point-s) {
  bottom: -3px;
  cursor: ns-resize;
  left: 50%;
  margin-left: -3px;
}

:global(.cropper-point.point-ne) {
  cursor: nesw-resize;
  right: -3px;
  top: -3px;
}

:global(.cropper-point.point-nw) {
  cursor: nwse-resize;
  left: -3px;
  top: -3px;
}

:global(.cropper-point.point-sw) {
  bottom: -3px;
  cursor: nesw-resize;
  left: -3px;
}

:global(.cropper-point.point-se) {
  bottom: -3px;
  cursor: nwse-resize;
  right: -3px;
}

:global(.cropper-point.point-se:before) {
  background-color: #39f;
  bottom: -50%;
  content: " ";
  display: block;
  height: 200%;
  opacity: 0;
  position: absolute;
  right: -50%;
  width: 200%;
}

:global(.cropper-invisible) {
  opacity: 0;
}

:global(.cropper-bg) {
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAA3NCSVQICAjb4U/gAAAABlBMVEXMzMz////TjRV2AAAACXBIWXMAAArrAAAK6wGCiw1aAAAAHHRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1M26LyyjAAAABFJREFUCJlj+M/AgBVhF/0PAH6/D/HkDxOGAAAAAElFTkSuQmCC");
}

:global(.cropper-hide) {
  display: block;
  height: 0;
  position: absolute;
  width: 0;
}

:global(.cropper-hidden) {
  display: none !important;
}

:global(.cropper-move) {
  cursor: move;
}

:global(.cropper-crop) {
  cursor: crosshair;
}

:global(.cropper-disabled .cropper-drag-box) {
  cursor: not-allowed;
}

:global(.cropper-disabled .cropper-face) {
  cursor: not-allowed;
}

:global(.cropper-disabled .cropper-line) {
  cursor: not-allowed;
}

:global(.cropper-disabled .cropper-point) {
  cursor: not-allowed;
}

// 修复拖拽区域定位问题
:global(.cropper-drag-box) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  cursor: move;
}

:global(.cropper-face.cropper-move) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  cursor: move;
  z-index: 1;
}
</style>
