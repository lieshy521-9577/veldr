<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-dialog" @click.stop>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fas fa-exclamation-triangle"></i>
            Confirm Delete
          </h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="handleCancel"
            :disabled="isDeleting"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <p>
            Are you sure you want to delete <strong>"{{ articleTitle }}"</strong>?
          </p>
          <div class="alert" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <strong>Warning:</strong> This action cannot be undone. The note and all its data will be permanently deleted.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleCancel"
            :disabled="isDeleting"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-danger"
            @click="handleConfirm"
            :disabled="isDeleting"
          >
            <i v-if="isDeleting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash"></i>
            {{ isDeleting ? 'Deleting...' : 'Delete Note' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  articleTitle: {
    type: String,
    default: ''
  },
  isDeleting: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['confirm', 'cancel']);

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  if (!props.isDeleting) {
    emit('cancel');
  }
};

const handleOverlayClick = () => {
  if (!props.isDeleting) {
    emit('cancel');
  }
};

watch(() => props.show, (isVisible, wasVisible, onCleanup) => {
  if (!isVisible) return;

  const handleEsc = (event) => {
    if (event.key === 'Escape' && !props.isDeleting) {
      emit('cancel');
    }
  };

  document.addEventListener('keydown', handleEsc);
  onCleanup(() => document.removeEventListener('keydown', handleEsc));
});
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: color-mix(in srgb, var(--color-bg) 42%, rgba(0, 0, 0, 0.58));
  backdrop-filter: blur(12px);
}

.modal-dialog {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}

.modal-content {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  box-shadow: var(--shadow-strong);
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
}

.modal-header {
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0;
  color: var(--color-heading);
  font-size: 1.05rem;
  font-weight: 800;

  i {
    color: #d97706;
  }
}

.btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;

  &:hover:not(:disabled) {
    border-color: var(--color-border);
    background: var(--color-surface-muted);
    color: var(--color-heading);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.modal-body {
  padding: 1.25rem;

  p {
    margin: 0 0 1rem;
    color: var(--color-text);
    line-height: 1.55;
  }
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin: 0;
  padding: 0.85rem;
  border: 1px solid color-mix(in srgb, #f59e0b 46%, var(--color-border));
  border-radius: 8px;
  background: color-mix(in srgb, #f59e0b 16%, var(--color-surface));
  color: var(--color-heading);

  i {
    margin-top: 0.15rem;
    color: #d97706;
  }
}

.modal-footer {
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 108px;
  min-height: 42px;
  padding: 0.55rem 1rem;
  border: 1px solid transparent;
  border-radius: 8px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }
}

.btn-secondary {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text);

  &:hover:not(:disabled) {
    border-color: var(--accent);
  }
}

.btn-danger {
  border-color: #dc2626;
  background: #dc2626;
  color: #fff;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }
}

@media (max-width: 576px) {
  .modal-overlay {
    padding: 0.65rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  .modal-footer {
    flex-direction: column-reverse;

    .btn {
      width: 100%;
    }
  }
}
</style>
