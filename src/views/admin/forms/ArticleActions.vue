<template>
  <div class="article-actions">
    <div class="actions-container">
      <!-- Left side - Cancel button -->
      <div class="actions-left">
        <button
          type="button"
          @click="handleCancel"
          class="btn btn-outline-secondary"
          :disabled="isSubmitting"
        >
          <i class="fas fa-arrow-left"></i>
          Cancel
        </button>
      </div>

      <!-- Right side - Action buttons -->
      <div class="actions-right">
        <!-- Status Selection Dropdown -->
        <div class="status-selector">
          <label for="status-select" class="status-label">Status:</label>
          <select
            id="status-select"
            v-model="selectedStatus"
            @change="handleStatusChange"
            class="status-select"
            :disabled="isSubmitting || isTogglingStatus || !isFormValid"
          >
            <option value="draft">Draft</option>
            <option value="private">Private</option>
            <option value="published">Published</option>
          </select>
        </div>

        <!-- Save/Update Button -->
        <button
          type="button"
          @click="handleSave"
          class="btn btn-primary"
          :disabled="isSubmitting || !isFormValid"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          <i class="fas fa-save"></i>
          {{ isEditing ? 'Update Article' : 'Save Article' }}
        </button>
      </div>
    </div>

    <!-- Form Status -->
    <div v-if="showStatus" class="form-status">
      <div class="status-item">
        <i class="fas fa-info-circle"></i>
        <span>{{ statusMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  currentStatus: {
    type: String,
    default: 'draft'
  },
  isFormValid: {
    type: Boolean,
    default: true
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  statusMessage: {
    type: String,
    default: ''
  },
  isTogglingStatus: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['cancel', 'save', 'status-change']);

// Local state for selected status
const selectedStatus = ref(props.currentStatus);

// Watch for changes in currentStatus prop
watch(() => props.currentStatus, (newStatus) => {
  selectedStatus.value = newStatus;
});

// Handle cancel action
const handleCancel = () => {
  emit('cancel');
};

// Handle save action
const handleSave = () => {
  emit('save');
};

// Handle status change
const handleStatusChange = () => {
  emit('status-change', selectedStatus.value);
};
</script>

<style lang="scss" scoped>
.article-actions {
  .actions-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 0;
    border-top: 1px solid #e5e7eb;
  }

  .actions-left,
  .actions-right {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .status-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .status-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
    }

    .status-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background-color: white;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease-in-out;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &:disabled {
        background-color: #f9fafb;
        color: #9ca3af;
        cursor: not-allowed;
      }
    }
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    line-height: 1.5;
    text-align: center;
    text-decoration: none;
    vertical-align: middle;
    cursor: pointer;
    user-select: none;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    transition: all 0.15s ease-in-out;

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    i {
      font-size: 0.875rem;
    }

    &-primary {
      color: white;
      background-color: #3b82f6;
      border-color: #3b82f6;

      &:hover:not(:disabled) {
        background-color: #2563eb;
        border-color: #2563eb;
      }
    }

    &-outline-primary {
      color: #3b82f6;
      border-color: #3b82f6;

      &:hover:not(:disabled) {
        background-color: #eff6ff;
        color: #2563eb;
      }
    }

    &-outline-secondary {
      color: #6b7280;
      border-color: #d1d5db;

      &:hover:not(:disabled) {
        background-color: #f9fafb;
        color: #374151;
      }
    }

    &-outline-success {
      color: #10b981;
      border-color: #10b981;

      &:hover:not(:disabled) {
        background-color: #ecfdf5;
        color: #059669;
      }
    }

    &-outline-warning {
      color: #f59e0b;
      border-color: #f59e0b;

      &:hover:not(:disabled) {
        background-color: #fffbeb;
        color: #d97706;
      }
    }
  }

  .spinner-border {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    vertical-align: -0.125em;
    border: 0.2em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border 0.75s linear infinite;

    &-sm {
      width: 0.875rem;
      height: 0.875rem;
      border-width: 0.15em;
    }
  }

  @keyframes spinner-border {
    to { transform: rotate(360deg); }
  }

  .me-1 {
    margin-right: 0.25rem;
  }

  .form-status {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 0.375rem;

    .status-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #0369a1;
      font-size: 0.875rem;

      i {
        font-size: 0.75rem;
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .actions-container {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .actions-left,
  .actions-right {
    justify-content: center;
  }

  .btn {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .actions-right {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
  }
}
</style>
