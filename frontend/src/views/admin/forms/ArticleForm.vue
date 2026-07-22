<template>
  <form @submit.prevent="handleSubmit" class="article-form">
    <!-- Basic Information -->
    <ArticleBasicInfo
      v-model="formData"
      :errors="errors"
      :is-editing="isEditing"
      @title-change="onTitleChange"
      @slug-change="onSlugChange"
    />

    <!-- Content Editor -->
    <ArticleContent
      v-model="formData"
      :errors="errors"
      @content-change="onContentChange"
    />

    <!-- Image Upload -->
    <ArticleImageUpload
      v-model="formData"
      :errors="errors"
      @image-change="onImageChange"
    />

    <!-- Actions -->
    <ArticleActions
      :is-editing="isEditing"
      :is-submitting="isSubmitting"
      :current-status="formData.status"
      :is-form-valid="isFormValid"
      :show-status="showStatus"
      :status-message="statusMessage"
      :is-toggling-status="isTogglingStatus"
      @cancel="handleCancel"
      @save="handleSave"
      @status-change="handleStatusChange"
    />
  </form>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useArticle } from '@/composables/useArticle.js';
import ArticleBasicInfo from './ArticleBasicInfo.vue';
import ArticleContent from './ArticleContent.vue';
import ArticleImageUpload from './ArticleImageUpload.vue';
import ArticleActions from './ArticleActions.vue';

const props = defineProps({
  article: {
    type: Object,
    default: () => ({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      status: 'private',
      featuredImage: null,
      featuredImageUrl: ''
    })
  },
  isEditing: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit']);

const router = useRouter();
const toast = useToast();

// Use article composable
const {
  formData,
  isSubmitting,
  isEditing,
  hasContent,
  wordCount,
  charCount,
  validateForm,
  generateSlug,
  updateSlug,
  resetForm,
  handleFileUpload,
  prepareFormData
} = useArticle();

// Local state
const errors = ref({});
const showStatus = ref(false);
const statusMessage = ref('');
const isTogglingStatus = ref(false);

// Computed properties
const isFormValid = computed(() => {
  const validationErrors = validateForm();
  return Object.keys(validationErrors).length === 0;
});

// Watch for changes in the article prop
watch(() => props.article, (newVal) => {
  resetForm(newVal);
}, { deep: true, immediate: true });

// Watch for title changes to auto-generate slug
watch(() => formData.value.title, () => {
  updateSlug();
});

// Event handlers
const onTitleChange = (title) => {
  // Additional title change logic if needed
};

const onSlugChange = (slug) => {
  // Additional slug change logic if needed
};

const onContentChange = (content) => {
  // Additional content change logic if needed
};

const onImageChange = (file) => {
  // Additional image change logic if needed
};

// Handle form submission
const handleSubmit = async () => {
  isSubmitting.value = true;
  errors.value = {};
  showStatus.value = false;
  
  try {
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      errors.value = validationErrors;
      isSubmitting.value = false;
      return;
    }
    
    // Prepare form data
    const data = prepareFormData();
    
    // Emit the submit event with form data
    emit('submit', data);
    
    // 注意：这里不重置isSubmitting，让父组件处理成功/失败后的状态重置
    
  } catch (error) {
    console.error('Error submitting form:', error);
    toast.error('An error occurred while saving the article');
    isSubmitting.value = false;
  }
};

// Handle save
const handleSave = async () => {
  isSubmitting.value = true;
  errors.value = {};
  showStatus.value = false;
  
  try {
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      errors.value = validationErrors;
      showStatus.value = true;
      statusMessage.value = 'Please fix the errors below before saving';
      isSubmitting.value = false;
      return;
    }
    
    // Prepare form data
    const data = prepareFormData();
    
    // Emit the submit event with form data
    emit('submit', data);
    
    // 注意：这里不重置isSubmitting，让父组件处理成功/失败后的状态重置
    
  } catch (error) {
    console.error('Error saving article:', error);
    toast.error('An error occurred while saving the article');
    isSubmitting.value = false;
  }
};

// Handle status change
const handleStatusChange = (newStatus) => {
  const oldStatus = formData.value.status;
  
  // Update form data
  formData.value.status = newStatus;
  
  // Show status message
  showStatus.value = true;
  const statusMessages = {
    'draft': 'Draft',
    'private': 'Private',
    'published': 'Published'
  };
  statusMessage.value = `Status set to ${statusMessages[newStatus]}`;
  
  // Auto-hide status message after 3 seconds
  setTimeout(() => {
    showStatus.value = false;
  }, 3000);
};

// Handle cancel
const handleCancel = () => {
  router.back();
};

// Set editing mode
watch(() => props.isEditing, (newVal) => {
  isEditing.value = newVal;
}, { immediate: true });

// Expose methods for parent component
const resetSubmittingState = () => {
  isSubmitting.value = false;
};

defineExpose({
  resetSubmittingState
});
</script>

<style lang="scss" scoped>
// Form-specific styles can be added here if needed
// Most styles are now handled by individual form components
</style>
