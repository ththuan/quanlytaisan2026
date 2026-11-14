import { onBeforeUnmount, onMounted } from 'vue';

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

const isEditableFocused = (): boolean => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  if (active.matches(EDITABLE_SELECTOR)) return true;
  return active.isContentEditable;
};

export function useVisualKeyboard(): void {
  let viewport: VisualViewport | null = null;
  let frame = 0;

  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!viewport) return;

      const covered = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      const open =
        covered > 140 &&
        viewport.scale <= 1.01 &&
        isEditableFocused() &&
        window.innerWidth <= 1367;

      document.documentElement.classList.toggle('keyboard-open', open);
    });
  };

  const onFocusOut = () => {
    window.setTimeout(update, 80);
  };

  onMounted(() => {
    viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', update);
      viewport.addEventListener('scroll', update);
    }
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', onFocusOut);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    if (viewport) {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    }
    document.removeEventListener('focusin', update);
    document.removeEventListener('focusout', onFocusOut);
    document.documentElement.classList.remove('keyboard-open');
  });
}
