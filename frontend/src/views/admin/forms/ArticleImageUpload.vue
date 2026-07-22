<template>
  <div class="article-image-upload">
    <div class="form-group">
      <label for="featuredImage" class="form-label">Featured Image</label>
      
      <!-- Upload Area -->
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
        
        <div 
          class="click-target"
          @click.stop="triggerFileInput"
        >
        
          <div v-if="!hasImage" class="upload-placeholder">
            <i class="fas fa-cloud-upload-alt upload-icon"></i>
            <p class="upload-text">Click to upload or drag and drop</p>
            <p class="upload-hint">PNG, JPG, GIF up to 16MB</p>
          </div>
          
          <div v-else class="image-preview">
            <img :src="imagePreview" :alt="'Preview'" class="preview-image" />
            <div class="image-overlay">
              <button 
                type="button"
                @click.stop="removeImage"
                class="remove-button"
                title="Remove image"
              >
                <i class="fas fa-times"></i>
              </button>
              <button 
                type="button"
                @click.stop="triggerFileInput"
                class="change-button"
                title="Change image"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button 
                v-if="hasImage"
                type="button"
                @click.stop="openCropModal"
                class="crop-button"
                title="Crop image"
              >
                <i class="fas fa-crop"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="errors.featuredImage" class="invalid-feedback">
        {{ errors.featuredImage }}
      </div>
      
      <div class="upload-info">
        <small class="text-muted">
          <i class="fas fa-info-circle"></i>
          Recommended: 1200x630px, max 5MB. Supported formats: JPG, PNG, GIF, WebP
        </small>
      </div>
    </div>

    <!-- Image Crop Modal -->
    <ImageCropModal
      :show="showCropModal"
      :image-src="cropImageSrc"
      :aspect-ratio="16/9"
      @close="closeCropModal"
      @crop-complete="handleCropComplete"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ImageCropModal from '@/components/ui/ImageCropModal.vue';
import { smartCompress, validateImageFile, createPreviewUrl, revokePreviewUrl } from '@/utils/imageUtils.js';
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

// Computed properties
const hasImage = computed(() => {
  return !!(props.modelValue.featuredImage || props.modelValue.featuredImageUrl);
});

const imagePreview = computed(() => {
  if (props.modelValue.featuredImageUrl) {
    return props.modelValue.featuredImageUrl;
  }
  return null;
});

// File validation
const validateFile = (file) => {
  const validation = validateImageFile(file, {
    maxSize: 16 * 1024 * 1024, // 16MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  });
  
  return validation.errors;
};

// Handle file selection
const handleFileSelect = (event) => {
  console.log('📂 [DEBUG] ArticleImageUpload - 文件选择发生变化', {
    files: event.target.files,
    fileCount: event.target.files.length
  });
  
  const file = event.target.files[0];
  if (!file) {
    console.log('⚠️ [DEBUG] ArticleImageUpload - 没有选择文件');
    return;
  }

  console.log('📄 [DEBUG] ArticleImageUpload - 选择的文件信息', {
    name: file.name,
    size: file.size,
    type: file.type
  });

  const errors = validateFile(file);
  if (errors.length > 0) {
    console.log('❌ [DEBUG] ArticleImageUpload - 文件验证失败', errors);
    emit('update:modelValue', { 
      ...props.modelValue, 
      featuredImage: null,
      featuredImageUrl: ''
    });
    return;
  }

  console.log('✅ [DEBUG] ArticleImageUpload - 文件验证通过，开始处理');
  processFile(file);
};

// Process selected file
const processFile = async (file) => {
  console.log('🔄 [DEBUG] ArticleImageUpload - 开始处理文件', {
    fileName: file.name,
    fileSize: file.size
  });
  
  try {
    // 智能压缩图片
    const compressedFile = await smartCompress(file);
    
    // 上传到后端
    console.log('📤 [DEBUG] ArticleImageUpload - 上传图片到后端...');
    const uploadResult = await articleApi.uploadImage(compressedFile);
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.message || '上传失败');
    }
    
    console.log('📸 [DEBUG] ArticleImageUpload - 文件处理完成', {
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + '%',
      uploadUrl: uploadResult.url
    });
    
    // 更新表单数据
    emit('update:modelValue', {
      ...props.modelValue,
      featuredImage: compressedFile,
      featuredImageUrl: uploadResult.url
    });
    emit('image-change', compressedFile);
    
  } catch (error) {
    console.error('处理图片失败:', error);
    // 如果上传失败，使用本地预览
    const previewUrl = createPreviewUrl(file);
    emit('update:modelValue', {
      ...props.modelValue,
      featuredImage: file,
      featuredImageUrl: previewUrl
    });
    emit('image-change', file);
  }
};

// Drag and drop handlers
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

  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    const errors = validateFile(file);
    if (errors.length === 0) {
      processFile(file);
    }
  }
};

// Trigger file input
const triggerFileInput = (event) => {
  // Prevent event from bubbling up to parent elements
  if (event) {
    event.stopPropagation();
  }
  
  console.log('🖱️ [DEBUG] ArticleImageUpload - 触发文件选择', {
    fileInputExists: !!fileInput.value,
    hasImage: hasImage.value,
    event: event
  });
  fileInput.value?.click();
};

// Remove image
const removeImage = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    featuredImage: null,
    featuredImageUrl: ''
  });
  emit('image-change', null);
  
  // Clear file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Open crop modal
const openCropModal = () => {
  if (props.modelValue.featuredImageUrl) {
    cropImageSrc.value = props.modelValue.featuredImageUrl;
    showCropModal.value = true;
  }
};

// Close crop modal
const closeCropModal = () => {
  showCropModal.value = false;
  cropImageSrc.value = '';
};

// Handle crop complete
const handleCropComplete = async (croppedFile) => {
  try {
    // 智能压缩裁剪后的图片
    const compressedFile = await smartCompress(croppedFile);
    
    // 上传裁剪后的图片到后端
    console.log('📤 [DEBUG] ArticleImageUpload - 上传裁剪图片到后端...');
    const uploadResult = await articleApi.uploadCroppedImage(compressedFile);
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.message || '上传裁剪图片失败');
    }
    
    console.log('📸 [DEBUG] ArticleImageUpload - 裁剪图片处理完成', {
      originalSize: croppedFile.size,
      compressedSize: compressedFile.size,
      compressionRatio: ((croppedFile.size - compressedFile.size) / croppedFile.size * 100).toFixed(1) + '%',
      uploadUrl: uploadResult.url
    });
    
    // 更新表单数据
    emit('update:modelValue', {
      ...props.modelValue,
      featuredImage: compressedFile,
      featuredImageUrl: uploadResult.url
    });
    
    emit('image-change', compressedFile);
    
    // 关闭模态框
    closeCropModal();
    
  } catch (error) {
    console.error('处理裁剪图片失败:', error);
    alert('处理裁剪图片失败，请重试');
  }
};
</script>

<style lang="scss" scoped>
.article-image-upload {
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .upload-area {
    position: relative;
    width: 100%;
    min-height: 200px;
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    background-color: #f9fafb;
    transition: all 0.2s ease;
    overflow: hidden;
    
    .click-target {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &:hover {
      border-color: #3b82f6;
      background-color: #eff6ff;
    }

    &.is-dragover {
      border-color: #3b82f6;
      background-color: #eff6ff;
      transform: scale(1.02);
    }

    &.has-image {
      border-style: solid;
      border-color: #10b981;
      background-color: #f0fdf4;
    }
  }

  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    text-align: center;
    color: #6b7280;

    .upload-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #9ca3af;
    }

    .upload-text {
      font-size: 1.125rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .upload-hint {
      font-size: 0.875rem;
      color: #6b7280;
    }
  }

  .image-preview {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;

    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      opacity: 0;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 1;
      }
    }

    .remove-button,
    .change-button,
    .crop-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border: none;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.9);
      color: #374151;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: white;
        transform: scale(1.1);
      }

      i {
        font-size: 0.875rem;
      }
    }

    .remove-button {
      color: #ef4444;

      &:hover {
        background-color: #fef2f2;
        color: #dc2626;
      }
    }

    .change-button {
      color: #3b82f6;

      &:hover {
        background-color: #eff6ff;
        color: #2563eb;
      }
    }

    .crop-button {
      color: #059669;

      &:hover {
        background-color: #ecfdf5;
        color: #047857;
      }
    }
  }

  .invalid-feedback {
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #ef4444;
  }

  .text-muted {
    color: #6b7280 !important;
    font-size: 0.875rem;
  }

  .upload-info {
    margin-top: 0.5rem;
    
    .text-muted {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      
      i {
        font-size: 0.75rem;
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .upload-area {
    min-height: 150px;
  }

  .upload-placeholder {
    height: 150px;

    .upload-icon {
      font-size: 2rem;
    }

    .upload-text {
      font-size: 1rem;
    }
  }

  .image-preview {
    height: 150px;
  }
}
</style>
