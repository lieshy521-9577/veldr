<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-dialog" @click.stop>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fas fa-exclamation-triangle text-warning me-2"></i>
            Confirm Delete
          </h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="handleCancel"
            :disabled="isDeleting"
          ></button>
        </div>
        
        <div class="modal-body">
          <p class="mb-3">
            Are you sure you want to delete <strong>"{{ articleTitle }}"</strong>?
          </p>
          <div class="alert alert-warning d-flex align-items-center" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <div>
              <strong>Warning:</strong> This action cannot be undone. The article and all its data will be permanently deleted.
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
            <i v-if="isDeleting" class="fas fa-spinner fa-spin me-2"></i>
            <i v-else class="fas fa-trash me-2"></i>
            {{ isDeleting ? 'Deleting...' : 'Delete Article' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

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

// 监听 ESC 键
watch(() => props.show, (newVal) => {
  if (newVal) {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !props.isDeleting) {
        emit('cancel');
      }
    };
    document.addEventListener('keydown', handleEsc);
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }
});
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-dialog {
  max-width: 500px;
  width: 100%;
  margin: 0 auto;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  
  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
      background-color: #f3f4f6;
      color: #374151;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.modal-body {
  padding: 1.5rem;
  
  p {
    margin: 0 0 1rem;
    color: #374151;
    line-height: 1.5;
  }
  
  .alert {
    margin: 0;
    border: 1px solid #fbbf24;
    background-color: #fef3c7;
    color: #92400e;
    
    i {
      color: #f59e0b;
    }
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    cursor: pointer;
    min-width: 100px;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    &.btn-secondary {
      background-color: #6b7280;
      color: white;
      border-color: #6b7280;
      
      &:hover:not(:disabled) {
        background-color: #4b5563;
        border-color: #4b5563;
      }
    }
    
    &.btn-danger {
      background-color: #ef4444;
      color: white;
      border-color: #ef4444;
      
      &:hover:not(:disabled) {
        background-color: #dc2626;
        border-color: #dc2626;
      }
    }
  }
}

// 响应式设计
@media (max-width: 576px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
}
</style>
