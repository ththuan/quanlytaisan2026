import { ref, watch, nextTick } from 'vue';

/**
 * Composable for smooth dialog open/close without flash
 * Fixes the flicker issue when closing dialogs on Chrome/Edge desktop
 * 
 * @example
 * ```ts
 * const props = defineProps<{ modelValue: boolean }>();
 * const emit = defineEmits<{ 'update:modelValue': [boolean] }>();
 * const { dialogVisible, handleBeforeClose } = useSmoothDialog(props, emit);
 * 
 * // In template:
 * <el-dialog v-model="dialogVisible" :before-close="handleBeforeClose">
 * ```
 */
export function useSmoothDialog(
  props: { modelValue: boolean },
  emit: (event: 'update:modelValue', value: boolean) => void,
  options: {
    onClose?: () => void;
    closeDelay?: number;
  } = {}
) {
  const dialogVisible = ref(props.modelValue);
  const isClosing = ref(false);
  
  const { onClose, closeDelay = 150 } = options;

  // Sync with parent v-model
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        // Opening dialog
        isClosing.value = false;
        dialogVisible.value = true;
      } else if (dialogVisible.value && !isClosing.value) {
        // External close request
        handleBeforeClose(() => {});
      }
    }
  );

  /**
   * Smooth close handler - prevents flash by:
   * 1. Marking dialog as closing
   * 2. Temporarily disabling transitions on overlay/dialog
   * 3. Waiting for animation to complete
   * 4. Actually closing the dialog
   */
  const handleBeforeClose = (done: () => void) => {
    if (isClosing.value) return;
    
    isClosing.value = true;

    // Temporarily disable transitions to prevent flash
    const overlay = document.querySelector('.el-overlay') as HTMLElement;
    const dialog = document.querySelector('.el-dialog') as HTMLElement;
    
    if (overlay) {
      overlay.style.transition = 'none';
    }
    if (dialog) {
      dialog.style.transition = 'none';
    }

    // Wait a frame before closing
    requestAnimationFrame(() => {
      // Close the dialog
      dialogVisible.value = false;
      emit('update:modelValue', false);
      
      if (onClose) {
        onClose();
      }

      // Reset after a delay
      setTimeout(() => {
        isClosing.value = false;
        done();
        
        // Re-enable transitions
        if (overlay) {
          overlay.style.transition = '';
        }
        if (dialog) {
          dialog.style.transition = '';
        }
      }, closeDelay);
    });
  };

  return {
    dialogVisible,
    isClosing,
    handleBeforeClose,
  };
}

/**
 * Alternative: Use this with visible prop pattern (not v-model)
 */
export function useSmoothDialogVisible(
  props: { visible: boolean },
  emit: (event: 'update:visible', value: boolean) => void,
  options: {
    onClose?: () => void;
    closeDelay?: number;
  } = {}
) {
  const dialogVisible = ref(props.visible);
  const isClosing = ref(false);
  
  const { onClose, closeDelay = 150 } = options;

  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        isClosing.value = false;
        dialogVisible.value = true;
      } else if (dialogVisible.value && !isClosing.value) {
        handleBeforeClose(() => {});
      }
    }
  );

  const handleBeforeClose = (done: () => void) => {
    if (isClosing.value) return;
    
    isClosing.value = true;

    const overlay = document.querySelector('.el-overlay') as HTMLElement;
    const dialog = document.querySelector('.el-dialog') as HTMLElement;
    
    if (overlay) overlay.style.transition = 'none';
    if (dialog) dialog.style.transition = 'none';

    requestAnimationFrame(() => {
      dialogVisible.value = false;
      emit('update:visible', false);
      
      if (onClose) onClose();

      setTimeout(() => {
        isClosing.value = false;
        done();
        
        if (overlay) overlay.style.transition = '';
        if (dialog) dialog.style.transition = '';
      }, closeDelay);
    });
  };

  return {
    dialogVisible,
    isClosing,
    handleBeforeClose,
  };
}
