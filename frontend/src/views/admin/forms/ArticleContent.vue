<template>
  <div class="article-content">
    <div class="form-group">
      <label class="form-label">Content</label>
      <TinyMCEEditor
        v-model="localContent"
        :api-key="tinymceApiKey"
        :height="500"
        :placeholder="'Start writing your article...'"
        :show-char-count="true"
        @change="onContentChange"
      />
      <div v-if="errors.content" class="invalid-feedback d-block">
        {{ errors.content }}
      </div>
    </div>

    <!-- Content Statistics -->
    <div class="content-stats">
      <div class="stat-item">
        <span class="stat-label">Words:</span>
        <span class="stat-value">{{ wordCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Characters:</span>
        <span class="stat-value">{{ charCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Reading Time:</span>
        <span class="stat-value">{{ readingTime }} min</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import TinyMCEEditor from '@/components/ui/TinyMCEEditor.vue';

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

const emit = defineEmits(['update:modelValue', 'content-change']);

// Load TinyMCE API key from environment variables
const tinymceApiKey = import.meta.env.VITE_TINYMCE_API_KEY || '';

// Local content state to ensure it's always a string
const localContent = computed({
  get: () => String(props.modelValue.content || ''),
  set: (value) => {
    const stringValue = String(value || '');
    emit('update:modelValue', { ...props.modelValue, content: stringValue });
  }
});

// Watch for modelValue changes and update local content
watch(() => props.modelValue.content, (newValue) => {
  const stringValue = String(newValue || '');
  if (stringValue !== localContent.value) {
    localContent.value = stringValue;
  }
}, { immediate: true });

// Computed properties for content statistics
const wordCount = computed(() => {
  const content = String(props.modelValue.content || '');
  const text = content.replace(/<[^>]*>/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
});

const charCount = computed(() => {
  const content = String(props.modelValue.content || '');
  return content.replace(/<[^>]*>/g, '').length;
});

const readingTime = computed(() => {
  const words = wordCount.value;
  // Average reading speed is about 200-250 words per minute
  return Math.ceil(words / 200);
});

// Handle content change
const onContentChange = (content) => {
  const stringContent = String(content || '');
  localContent.value = stringContent;
  emit('content-change', stringContent);
};
</script>

<style lang="scss" scoped>
.article-content {
  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
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

  .content-stats {
    display: flex;
    gap: 1.5rem;
    padding: 1rem;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    margin-top: 0.5rem;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;

      .stat-label {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .content-stats {
    flex-direction: column;
    gap: 0.75rem;

    .stat-item {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;

      .stat-label {
        font-size: 0.875rem;
        text-transform: none;
      }

      .stat-value {
        font-size: 1rem;
      }
    }
  }
}
</style>


