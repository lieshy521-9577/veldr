<template>
  <section class="article-image-upload form-section">
    <div class="section-heading">
      <h2>Main Image</h2>
      <p>Use one image as the visual anchor for lists and the reader page.</p>
    </div>

    <div class="form-group">
      <label for="featuredImage" class="form-label">Main image</label>

      <div
        class="upload-area"
        :class="{ 'is-dragover': isDragOver, 'has-image': hasImage }"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
      >
        <input
          ref="fileInput"
          type="file"
          id="featuredImage"
          @change="handleFileSelect"
          @click.stop
          accept="image/*"
          class="file-input"
        />

        <div class="click-target" @click.stop="triggerFileInput">
          <div v-if="!hasImage" class="upload-placeholder">
            <i class="fas fa-cloud-upload-alt upload-icon"></i>
            <p class="upload-text">Click to upload or drag and drop</p>
            <p class="upload-hint">JPG, PNG, GIF, or WebP up to 16MB</p>
          </div>

          <div v-else class="image-preview">
            <img :src="imagePreview" alt="Preview" class="preview-image" />
            <div class="image-overlay">
              <button type="button" @click.stop="removeImage" class="icon-button remove-button" title="Remove image">
                <i class="fas fa-times"></i>
              </button>
              <button type="button" @click.stop="triggerFileInput" class="icon-button change-button" title="Change image">
                <i class="fas fa-edit"></i>
              </button>
              <button type="button" @click.stop="openCropModal" class="icon-button crop-button" title="Crop image">
                <i class="fas fa-crop"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="errors.featuredImage" class="invalid-feedback">
        {{ errors.featuredImage }}
      </div>

      <p class="upload-info">
        <i class="fas fa-info-circle"></i>
        Recommended ratio: 16:9. The reader page displays this as the main image.
      </p>
    </div>

    <ImageCropModal
      :show="showCropModal"
      :image-src="cropImageSrc"
      :aspect-ratio="16/9"
      @close="closeCropModal"
      @crop-complete="handleCropComplete"
    />
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import ImageCropModal from '@/components/ui/ImageCropModal.vue';
import { smartCompress, validateImageFile, createPreviewUrl } from '@/utils/imageUtils.js';
import { articleApi } from '@/api/articleApi.js';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  errors: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue', 'image-change']);

const fileInput = ref(null);
const isDragOver = ref(false);
const showCropModal = ref(false);
const cropImageSrc = ref('');

const hasImage = computed(() => Boolean(props.modelValue.featuredImage || props.modelValue.featuredImageUrl));
const imagePreview = computed(() => props.modelValue.featuredImageUrl || null);

const validateFile = (file) => {
  const validation = validateImageFile(file, {
    maxSize: 16 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  });

  return validation.errors;
};

const setImage = (file, url) => {
  emit('update:modelValue', {
    ...props.modelValue,
    featuredImage: file,
    featuredImageUrl: url
  });
  emit('image-change', file);
};

const handleFileSelect = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const errors = validateFile(file);
  if (errors.length > 0) {
    emit('update:modelValue', {
      ...props.modelValue,
      featuredImage: null,
      featuredImageUrl: ''
    });
    return;
  }

  processFile(file);
};

const processFile = async (file) => {
  try {
    const compressedFile = await smartCompress(file);
    const uploadResult = await articleApi.uploadImage(compressedFile);

    if (!uploadResult.success) {
      throw new Error(uploadResult.message || 'Upload failed');
    }

    setImage(compressedFile, uploadResult.url);
  } catch (error) {
    console.error('Image upload failed, using local preview:', error);
    setImage(file, createPreviewUrl(file));
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event) => {
  event.preventDefault();
  isDragOver.value = false;
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragOver.value = false;

  const file = event.dataTransfer.files?.[0];
  if (file && validateFile(file).length === 0) {
    processFile(file);
  }
};

const triggerFileInput = (event) => {
  event?.stopPropagation();
  fileInput.value?.click();
};

const removeImage = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    featuredImage: null,
    featuredImageUrl: ''
  });
  emit('image-change', null);

  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const openCropModal = () => {
  if (!props.modelValue.featuredImageUrl) return;
  cropImageSrc.value = props.modelValue.featuredImageUrl;
  showCropModal.value = true;
};

const closeCropModal = () => {
  showCropModal.value = false;
  cropImageSrc.value = '';
};

const handleCropComplete = async (croppedFile) => {
  try {
    const compressedFile = await smartCompress(croppedFile);
    const uploadResult = await articleApi.uploadCroppedImage(compressedFile);

    if (!uploadResult.success) {
      throw new Error(uploadResult.message || 'Cropped image upload failed');
    }

    setImage(compressedFile, uploadResult.url);
    closeCropModal();
  } catch (error) {
    console.error('Cropped image processing failed:', error);
    alert('Failed to process the cropped image. Please try again.');
  }
};
</script>

<style lang="scss" scoped>
.form-section {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.section-heading {
  margin-bottom: 1rem;

  h2 {
    margin: 0;
    color: var(--color-heading);
    font-size: 1.1rem;
  }

  p {
    margin: 0.35rem 0 0;
    color: var(--color-text-muted);
    font-size: 0.92rem;
  }
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text);
  font-weight: 800;
}

.upload-area {
  position: relative;
  width: 100%;
  min-height: 220px;
  overflow: hidden;
  background: var(--color-surface-muted);
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius-lg);
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;

  &:hover,
  &.is-dragover {
    background: var(--color-accent-soft);
    border-color: var(--color-accent);
  }

  &.is-dragover {
    transform: scale(1.01);
  }

  &.has-image {
    border-style: solid;
    border-color: var(--color-accent-border);
    background: var(--color-surface);
  }
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.click-target {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-placeholder {
  display: grid;
  place-items: center;
  gap: 0.45rem;
  padding: 2rem;
  color: var(--color-text-muted);
  text-align: center;
}

.upload-icon {
  color: var(--color-accent);
  font-size: 2.8rem;
}

.upload-text {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.05rem;
  font-weight: 800;
}

.upload-hint,
.upload-info {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.88rem;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: rgba(8, 17, 28, 0.56);
  opacity: 0;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-heading);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
  }
}

.remove-button { color: var(--color-danger); }
.change-button { color: var(--color-accent); }
.crop-button { color: var(--color-success); }

.invalid-feedback {
  margin-top: 0.35rem;
  color: var(--color-danger);
  font-size: 0.86rem;
}

.upload-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.65rem;
}

@media (max-width: 768px) {
  .upload-area,
  .image-preview {
    min-height: 170px;
    height: 170px;
  }
}
</style>
