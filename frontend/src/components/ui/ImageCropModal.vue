<template>
  <div v-if="show" class="image-crop-modal" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Crop Image</h3>
        <button @click="closeModal" class="close-btn" type="button" aria-label="Close crop modal">
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
            <label>Quality</label>
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
            <label>Max Size</label>
            <select v-model="maxSize" class="size-select">
              <option value="800">800px</option>
              <option value="1200">1200px</option>
              <option value="1600">1600px</option>
              <option value="2000">2000px</option>
              <option value="original">Original</option>
            </select>
          </div>
        </div>

        <div class="preview-section">
          <h4>Preview</h4>
          <div class="preview-container">
            <img :src="previewImage" alt="Preview" class="preview-image" />
            <div class="preview-info">
              <p>Size: {{ previewSize.width }} x {{ previewSize.height }}</p>
              <p>File: {{ formatFileSize(previewSize.size) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary" type="button">Cancel</button>
        <button @click="resetCrop" class="btn btn-outline" type="button">Reset</button>
        <button @click="cropImage" class="btn btn-primary" type="button" :disabled="isProcessing">
          <i v-if="isProcessing" class="fas fa-spinner fa-spin"></i>
          {{ isProcessing ? 'Processing...' : 'Apply Crop' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import VueCropper from 'vue-cropperjs';

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

const closeModal = () => emit('close');

const resetCrop = () => {
  cropper.value?.reset();
};

const compressImage = (canvas, maxWidth, maxHeight) => {
  let { width, height } = canvas;

  if (maxWidth && maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    if (ratio < 1) {
      width *= ratio;
      height *= ratio;
    }
  }

  const newCanvas = document.createElement('canvas');
  newCanvas.width = width;
  newCanvas.height = height;
  newCanvas.getContext('2d').drawImage(canvas, 0, 0, width, height);

  return newCanvas;
};

const updatePreview = async () => {
  if (!cropper.value) return;

  try {
    const size = maxSize.value === 'original' ? Infinity : parseInt(maxSize.value);
    const canvas = cropper.value.getCroppedCanvas({
      maxWidth: size,
      maxHeight: size
    });

    if (!canvas) return;

    const compressedCanvas = compressImage(
      canvas,
      maxSize.value === 'original' ? null : parseInt(maxSize.value),
      maxSize.value === 'original' ? null : parseInt(maxSize.value)
    );

    previewImage.value = compressedCanvas.toDataURL('image/jpeg', quality.value);
    previewSize.value = {
      width: Math.round(compressedCanvas.width),
      height: Math.round(compressedCanvas.height),
      size: compressedCanvas.toBlob
        ? await new Promise(resolve => compressedCanvas.toBlob(blob => resolve(blob.size), 'image/jpeg', quality.value))
        : 0
    };
  } catch (error) {
    console.error('Failed to update crop preview:', error);
  }
};

const cropImage = async () => {
  if (!cropper.value) return;

  isProcessing.value = true;

  try {
    const size = maxSize.value === 'original' ? Infinity : parseInt(maxSize.value);
    const canvas = cropper.value.getCroppedCanvas({
      maxWidth: size,
      maxHeight: size
    });

    if (!canvas) {
      throw new Error('Could not read the cropped image.');
    }

    const compressedCanvas = compressImage(
      canvas,
      maxSize.value === 'original' ? null : parseInt(maxSize.value),
      maxSize.value === 'original' ? null : parseInt(maxSize.value)
    );

    const blob = await new Promise(resolve => {
      compressedCanvas.toBlob(resolve, 'image/jpeg', quality.value);
    });

    emit('crop-complete', new File([blob], 'cropped-image.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    }));
    closeModal();
  } catch (error) {
    console.error('Failed to crop image:', error);
    alert('Failed to crop the image. Please try again.');
  } finally {
    isProcessing.value = false;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

watch(quality, updatePreview);
watch(maxSize, updatePreview);

watch(() => props.imageSrc, () => {
  if (props.imageSrc && cropper.value) {
    nextTick(updatePreview);
  }
});

watch(() => props.show, (show) => {
  if (show && cropper.value) {
    nextTick(() => {
      cropper.value?.cropper?.reset();
      cropper.value?.cropper?.clear();
      cropper.value?.cropper?.replace(props.imageSrc);
      updatePreview();
    });
  }
});

const onCropperReady = () => updatePreview();
</script>

<style lang="scss" scoped>
.image-crop-modal {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(8, 17, 28, 0.74);
  backdrop-filter: blur(8px);
}

.modal-content {
  width: min(100%, 920px);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
}

.modal-header {
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);

  h3 {
    margin: 0;
    color: var(--color-heading);
    font-size: 1.15rem;
  }
}

.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;

  &:hover {
    color: var(--color-heading);
    background: var(--color-surface-muted);
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

.crop-container {
  height: 400px;
  margin-bottom: 1rem;
  overflow: hidden;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);

  .cropper {
    width: 100% !important;
    height: 100% !important;
  }
}

.crop-controls,
.preview-container {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}

.crop-controls {
  margin-bottom: 1rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    color: var(--color-text);
    font-weight: 800;
    white-space: nowrap;
  }
}

.quality-slider {
  width: 120px;
  accent-color: var(--color-accent);
}

.size-select {
  padding: 0.45rem 0.55rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}

.quality-value {
  min-width: 3rem;
  color: var(--color-accent);
  font-weight: 800;
}

.preview-section h4 {
  margin: 0 0 0.65rem;
  color: var(--color-heading);
}

.preview-container {
  align-items: center;
}

.preview-image {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}

.preview-info p {
  margin: 0 0 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.modal-footer {
  justify-content: flex-end;
  gap: 0.65rem;
  background: var(--color-surface-muted);
  border-top: 1px solid var(--color-border);
}

.btn {
  min-height: 2.4rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 800;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.btn-primary {
  color: var(--color-text-inverse);
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.btn-secondary {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-border);
}

.btn-outline {
  color: var(--color-accent);
  background: transparent;
  border-color: var(--color-accent-border);
}

@media (max-width: 768px) {
  .crop-container {
    height: 300px;
  }

  .crop-controls,
  .preview-container,
  .modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

:global(.cropper-container) {
  direction: ltr;
  font-size: 0;
  line-height: 0;
  position: relative;
  touch-action: none;
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

:global(.cropper-wrap-box),
:global(.cropper-drag-box),
:global(.cropper-face.cropper-move) {
  position: absolute;
  inset: 0;
}

:global(.cropper-wrap-box) {
  overflow: hidden;
}

:global(.cropper-canvas),
:global(.cropper-crop-box) {
  position: absolute;
  left: 0;
  top: 0;
}

:global(.cropper-view-box) {
  display: block;
  height: 100%;
  outline: 1px solid var(--color-accent);
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

:global(.cropper-center:before),
:global(.cropper-center:after) {
  background-color: #eee;
  content: " ";
  display: block;
  position: absolute;
}

:global(.cropper-center:before) {
  height: 1px;
  left: -3px;
  top: -3px;
  width: 7px;
}

:global(.cropper-center:after) {
  height: 7px;
  left: -3px;
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
}

:global(.cropper-line),
:global(.cropper-point) {
  background-color: var(--color-accent);
  display: block;
  opacity: 0.75;
  position: absolute;
}

:global(.cropper-line.line-e) { cursor: ew-resize; right: -3px; top: 0; width: 5px; height: 100%; }
:global(.cropper-line.line-n) { cursor: ns-resize; height: 5px; left: 0; top: -3px; width: 100%; }
:global(.cropper-line.line-w) { cursor: ew-resize; left: -3px; top: 0; width: 5px; height: 100%; }
:global(.cropper-line.line-s) { bottom: -3px; cursor: ns-resize; height: 5px; left: 0; width: 100%; }

:global(.cropper-point) {
  height: 5px;
  width: 5px;
}

:global(.cropper-point.point-e) { cursor: ew-resize; margin-top: -3px; right: -3px; top: 50%; }
:global(.cropper-point.point-n) { cursor: ns-resize; left: 50%; margin-left: -3px; top: -3px; }
:global(.cropper-point.point-w) { cursor: ew-resize; left: -3px; margin-top: -3px; top: 50%; }
:global(.cropper-point.point-s) { bottom: -3px; cursor: ns-resize; left: 50%; margin-left: -3px; }
:global(.cropper-point.point-ne) { cursor: nesw-resize; right: -3px; top: -3px; }
:global(.cropper-point.point-nw) { cursor: nwse-resize; left: -3px; top: -3px; }
:global(.cropper-point.point-sw) { bottom: -3px; cursor: nesw-resize; left: -3px; }
:global(.cropper-point.point-se) { bottom: -3px; cursor: nwse-resize; right: -3px; }

:global(.cropper-invisible) { opacity: 0; }
:global(.cropper-hidden) { display: none !important; }
:global(.cropper-move) { cursor: move; }
:global(.cropper-crop) { cursor: crosshair; }
:global(.cropper-disabled .cropper-drag-box),
:global(.cropper-disabled .cropper-face),
:global(.cropper-disabled .cropper-line),
:global(.cropper-disabled .cropper-point) { cursor: not-allowed; }
</style>
