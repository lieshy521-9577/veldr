<template>
  <div ref="container" class="lazy-image-container">
    <img
      v-if="hasIntersected || !lazy"
      :src="src"
      :alt="alt"
      :class="['lazy-image', { 'loaded': hasIntersected }]"
      @load="onLoad"
      @error="onError"
    />
    <div v-else class="lazy-image-placeholder">
      <div class="placeholder-content">
        <i class="fas fa-image placeholder-icon"></i>
        <span class="placeholder-text">Loading...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useLazyLoading } from '@/composables/useLazyLoading.js';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  lazy: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['load', 'error']);

// Use lazy loading composable
const { element: container, hasIntersected } = useLazyLoading({
  threshold: 0.1,
  triggerOnce: true
});

// Local state
const isLoaded = ref(false);
const hasError = ref(false);

// Computed properties
const shouldShowImage = computed(() => {
  return hasIntersected.value || !props.lazy;
});

// Event handlers
const onLoad = (event) => {
  isLoaded.value = true;
  hasError.value = false;
  emit('load', event);
};

const onError = (event) => {
  hasError.value = true;
  isLoaded.value = false;
  emit('error', event);
};
</script>

<style lang="scss" scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
  background-color: #f3f4f6;
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  opacity: 0;

  &.loaded {
    opacity: 1;
  }
}

.lazy-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  color: #9ca3af;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.placeholder-icon {
  font-size: 2rem;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.7;
}
</style>
