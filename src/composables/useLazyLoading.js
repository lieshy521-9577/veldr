import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Lazy loading composable
 * Provides intersection observer functionality for lazy loading components
 */
export function useLazyLoading(options = {}) {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0.1,
    triggerOnce = true
  } = options;

  const element = ref(null);
  const isIntersecting = ref(false);
  const hasIntersected = ref(false);
  const observer = ref(null);

  const startObserving = () => {
    if (!element.value || !window.IntersectionObserver) return;

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting.value = entry.isIntersecting;
          
          if (entry.isIntersecting && !hasIntersected.value) {
            hasIntersected.value = true;
          }
        });
      },
      {
        root,
        rootMargin,
        threshold
      }
    );

    observer.value.observe(element.value);
  };

  const stopObserving = () => {
    if (observer.value) {
      observer.value.disconnect();
      observer.value = null;
    }
  };

  onMounted(() => {
    startObserving();
  });

  onUnmounted(() => {
    stopObserving();
  });

  return {
    element,
    isIntersecting,
    hasIntersected,
    startObserving,
    stopObserving
  };
}
