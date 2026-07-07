import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable to track page visibility and detect tab switches
 * Useful for preventing flash/flicker on desktop browsers when switching tabs
 */
export function usePageVisibility() {
  const isVisible = ref(!document.hidden);
  const wasHidden = ref(false);
  
  function handleVisibilityChange() {
    const isNowVisible = !document.hidden;
    
    if (!isNowVisible) {
      // Tab is being hidden
      wasHidden.value = true;
    } else if (wasHidden.value) {
      // Tab just became visible after being hidden
      // This is useful for disabling animations/transitions temporarily
      wasHidden.value = false;
    }
    
    isVisible.value = isNowVisible;
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    isVisible,
    wasHidden,
  };
}
