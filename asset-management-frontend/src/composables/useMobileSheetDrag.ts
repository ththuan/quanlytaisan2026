import { onBeforeUnmount } from 'vue';

const DRAG_ZONE_PX = 48;
const DISMISS_DISTANCE_PX = 96;
const DISMISS_VELOCITY = 0.55;
const SHEET_BREAKPOINT = 768;

const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, [contenteditable="true"], .el-dialog__headerbtn';

const isSheetDialog = (dialog: HTMLElement): boolean => {
  if (!document.documentElement.classList.contains('app-overlay')) return false;
  if (dialog.classList.contains('is-fullscreen')) return false;
  if (window.innerWidth > SHEET_BREAKPOINT) return false;
  return dialog.getBoundingClientRect().height > 0;
};

export function useMobileSheetDrag(): void {
  let dialog: HTMLElement | null = null;
  let overlay: HTMLElement | null = null;
  let startY = 0;
  let startTime = 0;
  let distance = 0;
  let active = false;
  let pointerId = -1;
  let swallowClick: ((event: MouseEvent) => void) | null = null;

  const clearSwallowClick = () => {
    if (!swallowClick) return;
    document.removeEventListener('click', swallowClick, true);
    swallowClick = null;
  };

  const clearInlineStyles = () => {
    if (dialog) {
      dialog.style.transition = '';
      dialog.style.transform = '';
      dialog.style.willChange = '';
    }
    if (overlay) {
      overlay.style.transition = '';
      overlay.style.opacity = '';
    }
    dialog = null;
    overlay = null;
  };

  const removeMoveListeners = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onEnd);
    document.removeEventListener('pointercancel', onCancel);
  };

  const stop = () => {
    active = false;
    removeMoveListeners();
  };

  const reset = () => {
    const target = dialog;
    const backdrop = overlay;

    if (!target) {
      stop();
      return;
    }

    target.style.transition = 'transform 280ms cubic-bezier(0.23, 1, 0.32, 1)';
    target.style.transform = 'translate3d(0, 0, 0)';
    if (backdrop) {
      backdrop.style.transition = 'opacity 280ms cubic-bezier(0.23, 1, 0.32, 1)';
      backdrop.style.opacity = '';
    }

    stop();

    window.setTimeout(() => {
      clearInlineStyles();
    }, 300);
  };

  const dismiss = () => {
    const target = dialog;
    const backdrop = overlay;
    if (!target) {
      stop();
      return;
    }

    const closeButton = target.querySelector<HTMLElement>('.el-dialog__headerbtn');

    target.style.transition = 'transform 160ms cubic-bezier(0.4, 0, 1, 1)';
    target.style.transform = `translate3d(0, ${Math.max(distance, 140)}px, 0)`;
    if (backdrop) {
      backdrop.style.transition = 'opacity 160ms cubic-bezier(0.4, 0, 1, 1)';
      backdrop.style.opacity = '0';
    }

    stop();
    clearSwallowClick();

    window.setTimeout(() => {
      if (closeButton?.isConnected) {
        closeButton.click();
        window.setTimeout(clearInlineStyles, 60);
      } else {
        reset();
      }
    }, 140);
  };

  function onMove(event: PointerEvent) {
    if (!active || event.pointerId !== pointerId || !dialog) return;

    distance = Math.max(0, event.clientY - startY);
    if (distance > 8) event.preventDefault();

    dialog.style.transition = 'none';
    dialog.style.transform = `translate3d(0, ${distance}px, 0)`;

    if (overlay) {
      overlay.style.transition = 'none';
      overlay.style.opacity = String(Math.max(0.35, 1 - distance / 420));
    }
  }

  function onEnd(event: PointerEvent) {
    if (!active || event.pointerId !== pointerId) return;

    const elapsed = Math.max(1, performance.now() - startTime);
    const velocity = distance / elapsed;
    const shouldDismiss =
      distance > DISMISS_DISTANCE_PX || velocity > DISMISS_VELOCITY;

    if (shouldDismiss) {
      dismiss();
      return;
    }

    if (distance > 10) {
      swallowClick = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      };
      document.addEventListener('click', swallowClick, { capture: true, once: true });
      window.setTimeout(clearSwallowClick, 380);
    }

    reset();
  }

  function onCancel() {
    if (!active) return;
    reset();
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    if (event.target instanceof Element) {
      if (event.target.closest(INTERACTIVE_SELECTOR)) return;
    }

    const target = event.target as HTMLElement | null;
    const sheet = target?.closest?.('.el-dialog') as HTMLElement | null;
    if (!sheet || !isSheetDialog(sheet)) return;

    const rect = sheet.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    if (offsetY < 0 || offsetY > DRAG_ZONE_PX) return;

    dialog = sheet;
    overlay = sheet.closest('.el-overlay') as HTMLElement | null;
    startY = event.clientY;
    startTime = performance.now();
    distance = 0;
    active = true;
    pointerId = event.pointerId;

    sheet.style.willChange = 'transform';
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onCancel);
  };

  document.addEventListener('pointerdown', onPointerDown, { passive: true });

  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointerDown);
    clearSwallowClick();
    stop();
  });
}
