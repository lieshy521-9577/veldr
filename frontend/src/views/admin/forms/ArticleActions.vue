<template>
  <div class="article-actions">
    <div class="actions-container">
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

      <div class="actions-right">
        <div class="status-selector">
          <label for="status-select" class="status-label">Status</label>
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

        <button
          type="button"
          @click="handleSave"
          class="btn btn-primary"
          :disabled="isSubmitting || !isFormValid"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
          <i v-else class="fas fa-save"></i>
          {{ isEditing ? 'Update Note' : 'Save Note' }}
        </button>
      </div>
    </div>

    <div v-if="showStatus" class="form-status">
      <i class="fas fa-info-circle"></i>
      <span>{{ statusMessage }}</span>
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
const selectedStatus = ref(props.currentStatus);

watch(() => props.currentStatus, (newStatus) => {
  selectedStatus.value = newStatus;
});

const handleCancel = () => emit('cancel');
const handleSave = () => emit('save');
const handleStatusChange = () => emit('status-change', selectedStatus.value);
</script>

<style lang="scss" scoped>
.actions-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.5rem;
}

.actions-left,
.actions-right,
.status-selector,
.form-status {
  display: flex;
  align-items: center;
}

.actions-left,
.actions-right {
  gap: 0.75rem;
}

.status-selector {
  gap: 0.5rem;
}

.status-label {
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 800;
}

.status-select {
  min-height: 2.45rem;
  padding: 0.55rem 0.75rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.55rem;
  padding: 0.65rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 800;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
}

.btn-primary {
  color: var(--color-text-inverse);
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.btn-outline-secondary {
  color: var(--color-text);
  background: transparent;
  border-color: var(--color-border);
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 0.15em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to { transform: rotate(360deg); }
}

.form-status {
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  font-weight: 700;
}

@media (max-width: 760px) {
  .actions-container,
  .actions-right {
    align-items: stretch;
    flex-direction: column;
  }

  .btn,
  .status-selector,
  .status-select {
    width: 100%;
  }

  .status-selector {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
