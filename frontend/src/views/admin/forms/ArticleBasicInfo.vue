<template>
  <div class="article-basic-info">
    <div class="form-group">
      <label for="title" class="form-label">Title</label>
      <input
        type="text"
        id="title"
        v-model="title"
        @input="onTitleChange"
        class="form-control"
        :class="{ 'is-invalid': errors.title }"
        placeholder="Enter article title"
        required
      />
      <div v-if="errors.title" class="invalid-feedback">
        {{ errors.title }}
      </div>
    </div>

    <div class="form-group">
      <label for="slug" class="form-label">Slug（可选）</label>
      <div class="input-group">
        <span class="input-group-text">/</span>
        <input
          type="text"
          id="slug"
          v-model="slug"
          @input="onSlugChange"
          class="form-control"
          :class="{ 'is-invalid': errors.slug }"
        placeholder="仅在需要英文 URL 时填写"
        />
      </div>
      <div v-if="errors.slug" class="invalid-feedback">
        {{ errors.slug }}
      </div>
      <small class="text-muted">个人笔记可留空；英文标题会自动生成 URL 标识。</small>
    </div>

    <div class="form-group">
      <label for="excerpt" class="form-label">Excerpt</label>
      <textarea
        id="excerpt"
        v-model="excerpt"
        rows="3"
        class="form-control"
        :class="{ 'is-invalid': errors.excerpt }"
        placeholder="A short summary of your article"
      ></textarea>
      <div v-if="errors.excerpt" class="invalid-feedback">
        {{ errors.excerpt }}
      </div>
      <small class="text-muted">A brief description that will appear in article previews</small>
    </div>

  </div>
</template>

<script setup>
import { watch, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  errors: {
    type: Object,
    default: () => ({})
  },
  isEditing: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'title-change', 'slug-change']);

// Computed properties to safely access formData properties
const title = computed({
  get: () => props.modelValue?.title || '',
  set: (value) => {
    if (props.modelValue) {
      emit('update:modelValue', { ...props.modelValue, title: value });
    }
  }
});

const slug = computed({
  get: () => props.modelValue?.slug || '',
  set: (value) => {
    if (props.modelValue) {
      emit('update:modelValue', { ...props.modelValue, slug: value });
    }
  }
});

const excerpt = computed({
  get: () => props.modelValue?.excerpt || '',
  set: (value) => {
    if (props.modelValue) {
      emit('update:modelValue', { ...props.modelValue, excerpt: value });
    }
  }
});

// Generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Handle title change
const onTitleChange = (event) => {
  const newTitle = event.target.value;
  
  // Ensure modelValue exists
  if (!props.modelValue) return;
  
  // Auto-generate slug if not editing or slug is empty
  if (!props.isEditing || !props.modelValue.slug) {
    const newSlug = generateSlug(newTitle);
    emit('update:modelValue', { ...props.modelValue, title: newTitle, slug: newSlug });
  } else {
    emit('update:modelValue', { ...props.modelValue, title: newTitle });
  }
  
  emit('title-change', newTitle);
};

// Handle slug change
const onSlugChange = (event) => {
  const newSlug = event.target.value;
  
  // Ensure modelValue exists
  if (!props.modelValue) return;
  
  emit('update:modelValue', { ...props.modelValue, slug: newSlug });
  emit('slug-change', newSlug);
};

// Watch for external modelValue changes
watch(() => props.modelValue, (newData) => {
  // This ensures the component stays in sync with parent
}, { deep: true });
</script>

<style lang="scss" scoped>
.article-basic-info {
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .form-control {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    color: #374151;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

    &:focus {
      border-color: #3b82f6;
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
    }

    &.is-invalid {
      border-color: #ef4444;

      &:focus {
        box-shadow: 0 0 0 0.2rem rgba(239, 68, 68, 0.25);
      }
    }
  }

  .input-group {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    width: 100%;

    &-text {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.75rem;
      font-size: 1rem;
      font-weight: 400;
      line-height: 1.5;
      color: #6b7280;
      text-align: center;
      white-space: nowrap;
      background-color: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem 0 0 0.375rem;
      border-right: 0;
    }

    .form-control {
      position: relative;
      flex: 1 1 auto;
      width: 1%;
      min-width: 0;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }

  .invalid-feedback {
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #ef4444;

    &.d-block {
      display: block;
    }
  }

  .text-muted {
    color: #6b7280 !important;
    font-size: 0.875rem;
  }


  .form-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &-input {
      margin: 0;
    }

    &-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-weight: 500;
      cursor: pointer;

      i {
        font-size: 0.875rem;
      }
    }
  }
}
</style>
