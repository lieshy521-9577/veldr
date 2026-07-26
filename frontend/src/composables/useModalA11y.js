import { onMounted, onBeforeUnmount } from 'vue';

/**
 * 弹窗无障碍：焦点陷阱 + 可选 ESC 关闭。
 * containerRef 指向弹窗根元素（overlay 或 panel 均可）。
 */
export function useModalA11y(containerRef, { onEscape = null } = {}) {
  const handleKeydown = (event) => {
    const container = containerRef.value;
    if (!container) return;

    if (event.key === 'Escape' && typeof onEscape === 'function') {
      event.preventDefault();
      onEscape();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusables = Array.from(container.querySelectorAll(
      'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
    )).filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (!container.contains(active)) {
      event.preventDefault();
      first.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    }
  };

  onMounted(() => document.addEventListener('keydown', handleKeydown));
  onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown));
}
