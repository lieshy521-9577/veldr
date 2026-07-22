<template>
  <section class="article-basic-info form-section">
    <div class="section-heading">
      <h2>Note Details</h2>
      <p>Give the note a clear title and optional URL slug.</p>
    </div>

    <div class="form-grid">
      <div class="form-group">
        <label for="title" class="form-label">Title</label>
        <input
          type="text"
          id="title"
          v-model="title"
          @input="onTitleChange"
          class="form-control"
          :class="{ 'is-invalid': errors.title }"
          placeholder="Enter note title"
          required
        />
        <div v-if="errors.title" class="invalid-feedback">
          {{ errors.title }}
        </div>
      </div>

      <div class="form-group">
        <label for="slug" class="form-label">Slug <span>optional</span></label>
        <div class="input-group">
          <span class="input-group-text">/</span>
          <input
            type="text"
            id="slug"
            v-model="slug"
            @input="onSlugChange"
            class="form-control"
            :class="{ 'is-invalid': errors.slug }"
            placeholder="only-if-needed"
          />
        </div>
        <div v-if="errors.slug" class="invalid-feedback">
          {{ errors.slug }}
        </div>
        <small class="text-muted">Leave empty for private notes, or use lowercase letters, numbers, and hyphens.</small>
      </div>
    </div>

    <div class="form-group">
      <label for="excerpt" class="form-label">Excerpt</label>
      <textarea
        id="excerpt"
        v-model="excerpt"
        rows="3"
        class="form-control"
        :class="{ 'is-invalid': errors.excerpt }"
        placeholder="A short summary for note cards"
      ></textarea>
      <div v-if="errors.excerpt" class="invalid-feedback">
        {{ errors.excerpt }}
      </div>
      <small class="text-muted">Shown in lists and previews when available.</small>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

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

const title = computed({
  get: () => props.modelValue?.title || '',
  set: (value) => {
    emit('update:modelValue', { ...props.modelValue, title: value });
  }
});

const slug = computed({
  get: () => props.modelValue?.slug || '',
  set: (value) => {
    emit('update:modelValue', { ...props.modelValue, slug: value });
  }
});

const excerpt = computed({
  get: () => props.modelValue?.excerpt || '',
  set: (value) => {
    emit('update:modelValue', { ...props.modelValue, excerpt: value });
  }
});

const generateSlug = (value) => {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const onTitleChange = (event) => {
  const newTitle = event.target.value;
  if (!props.modelValue) return;

  if (!props.isEditing || !props.modelValue.slug) {
    emit('update:modelValue', { ...props.modelValue, title: newTitle, slug: generateSlug(newTitle) });
  } else {
    emit('update:modelValue', { ...props.modelValue, title: newTitle });
  }

  emit('title-change', newTitle);
};

const onSlugChange = (event) => {
  const newSlug = event.target.value;
  emit('update:modelValue', { ...props.modelValue, slug: newSlug });
  emit('slug-change', newSlug);
};
</script>

<style lang="scss" scoped>
.form-section {
  padding-bottom: 1.5rem;
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

.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.8fr);
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text);
  font-weight: 800;

  span {
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-weight: 600;
  }
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.72rem 0.85rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 0.96rem;
  line-height: 1.5;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }

  &.is-invalid {
    border-color: var(--color-danger);
  }
}

.input-group {
  display: flex;
  width: 100%;

  &-text {
    display: flex;
    align-items: center;
    padding: 0.72rem 0.85rem;
    color: var(--color-text-muted);
    background: var(--color-surface-muted);
    border: 1px solid var(--color-border);
    border-right: 0;
    border-radius: var(--border-radius) 0 0 var(--border-radius);
  }

  .form-control {
    min-width: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}

.invalid-feedback {
  margin-top: 0.35rem;
  color: var(--color-danger);
  font-size: 0.86rem;
}

.text-muted {
  display: block;
  margin-top: 0.45rem;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

@media (max-width: 820px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
