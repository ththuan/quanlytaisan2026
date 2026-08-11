<template>
  <div id="app">
    <router-view />
    <PWAUpdatePrompt />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.vue';

// Global dialog close optimization - fixes flash on ALL dialogs
let dialogCloseHandler: ((e: Event) => void) | null = null;

// Desktop Chrome/Edge specific optimizations to prevent tab-switch flash
onMounted(() => {
  const isChromiumBased = /Chrome|Edg/.test(navigator.userAgent);
  const isDesktop = window.innerWidth >= 1024;
  
  if (isChromiumBased && isDesktop) {
    // Add a class to enable Chromium-specific optimizations
    document.documentElement.classList.add('chromium-desktop');
    
    // Optimize rendering for Chromium on desktop
    let rafId: number;
    let tabSwitchTimeout: number;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is being hidden - no action needed
        return;
      }
      
      // Tab just became visible - temporarily disable most transitions to prevent flash
      document.documentElement.classList.add('tab-switching');
      
      // Use RAF to ensure smooth render
      rafId = requestAnimationFrame(() => {
        // Force a repaint (excluding dialogs/overlays)
        const mainContent = document.getElementById('app');
        if (mainContent) {
          mainContent.style.transform = 'translateZ(0)';
          
          requestAnimationFrame(() => {
            // Remove transform
            if (mainContent) {
              mainContent.style.transform = '';
            }
            
            // Re-enable transitions after a short delay
            tabSwitchTimeout = window.setTimeout(() => {
              document.documentElement.classList.remove('tab-switching');
            }, 100);
          });
        }
      });
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount
    onBeforeUnmount(() => {
      if (rafId) cancelAnimationFrame(rafId);
      if (tabSwitchTimeout) clearTimeout(tabSwitchTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }

  // === GLOBAL DIALOG CLOSE OPTIMIZATION ===
  // This applies to ALL Element Plus dialogs, drawers, message-boxes
  // No need to modify individual dialog components!
  
  // Approach: When ANY dialog starts closing, disable its transitions
  // to prevent white flash. This is more reliable than CSS-only solutions.
  
  const disableDialogTransitions = () => {
    const overlays = document.querySelectorAll('.el-overlay:not(.is-message-box)');
    overlays.forEach((overlay) => {
      const el = overlay as HTMLElement;
      const dialog = el.querySelector('.el-dialog, .el-drawer') as HTMLElement;
      
      // Disable transitions
      el.style.transition = 'none';
      el.style.animation = 'none';
      if (dialog) {
        dialog.style.transition = 'none';
        dialog.style.animation = 'none';
      }
      
      // Re-enable after dialog is gone
      setTimeout(() => {
        if (!document.body.contains(el)) return; // Already removed
        el.style.transition = '';
        el.style.animation = '';
        if (dialog && document.body.contains(dialog)) {
          dialog.style.transition = '';
          dialog.style.animation = '';
        }
      }, 300);
    });
  };
  
  dialogCloseHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    
    // Detect dialog close button click
    if (target?.classList.contains('el-dialog__close') || 
        target?.closest('.el-dialog__headerbtn') ||
        target?.classList.contains('el-icon-close') ||
        (target?.classList.contains('el-overlay') && e.type === 'click')) {
      disableDialogTransitions();
    }
  };
  
  // Listen to clicks on close buttons and overlay
  document.addEventListener('click', dialogCloseHandler, true);
  
  // Handle ESC key
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const hasOpenDialog = document.querySelector('.el-overlay:not(.is-message-box)');
      if (hasOpenDialog) {
        disableDialogTransitions();
      }
    }
  };
  
  document.addEventListener('keydown', handleKeydown);
  
  // Handle programmatic closes (via v-model changes)
  // Use MutationObserver to detect when overlay is being removed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node instanceof HTMLElement && node.classList?.contains('el-overlay')) {
          // Overlay is being removed - ensure no flash
          node.style.transition = 'none';
          node.style.opacity = '0';
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: false });
  
  // CRITICAL: Clean up orphaned overlays that block content
  // Only runs when tab becomes visible to avoid interfering with normal operation
  const cleanupOrphanedOverlays = () => {
    const overlays = document.querySelectorAll('.el-overlay');
    overlays.forEach((overlay) => {
      const el = overlay as HTMLElement;
      
      // Only check for truly orphaned overlays (no visible content)
      const hasDialog = el.querySelector('.el-dialog');
      const hasDrawer = el.querySelector('.el-drawer');
      const hasMsgBox = el.querySelector('.el-message-box');
      const hasLoading = el.querySelector('.el-loading-mask');
      
      // Check if overlay is invisible
      const style = window.getComputedStyle(el);
      const isInvisible = style.opacity === '0' || style.display === 'none' || style.visibility === 'hidden';
      
      // ONLY remove if: invisible AND no active components AND no children
      if (isInvisible && !hasDialog && !hasDrawer && !hasMsgBox && !hasLoading && el.children.length === 0) {
        console.log('[Cleanup] Removing orphaned overlay');
        el.remove();
      }
    });
    
    // Restore body scroll if no overlays remain
    if (!document.querySelector('.el-overlay')) {
      document.body.classList.remove('el-popup-parent--hidden');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  };
  
  // ONLY run cleanup when tab becomes visible, NOT on interval
  // This prevents interfering with normal dialog operations
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Tab became visible - wait a bit then clean up orphaned overlays
      setTimeout(cleanupOrphanedOverlays, 300);
    }
  });
  
  onBeforeUnmount(() => {
    if (dialogCloseHandler) {
      document.removeEventListener('click', dialogCloseHandler, true);
    }
    document.removeEventListener('keydown', handleKeydown);
    observer.disconnect();
  });
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  /* Typography scale: 14px base + semantic steps for hierarchy */
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 22px;

  --el-font-size-base: 14px;
  --el-font-family: 'Inter', sans-serif;
}

html {
  font-size: 14px;
}

/* Prevent font flash (FOUT/FOIT) */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
}

/* Ensure Inter font is loaded before displaying text */
@supports (font-display: swap) {
  @font-face {
    font-family: 'Inter';
    font-display: swap;
  }
}

/* Reset and Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Prevent layout shift on scrollbar appearance/disappearance */
html {
  overflow-y: scroll;
  scrollbar-gutter: stable;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
  font-size: var(--font-size-base);
  color: #1e293b;
  background-color: #f8fafc;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.55;
  /* Prevent flash when switching tabs */
  overflow-y: scroll;
}

#app {
  font-family: 'Inter', sans-serif !important;
  font-size: var(--font-size-base);
  /* Use GPU acceleration for smoother rendering */
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* CSS Containment to prevent repaints outside #app */
  contain: layout style paint;
}

/* Optimize rendering for desktop browsers (Chrome/Edge) */
@media (min-width: 1024px) {
  #app {
    /* Force layer creation on desktop for better performance */
    will-change: transform;
  }
  
  /* Prevent flash when switching tabs on desktop */
  body {
    /* Disable auto-font-size adjustment that can cause reflow */
    text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  
  /* Chromium-specific optimizations */
  .chromium-desktop body {
    /* Reduce paint area on tab switch */
    isolation: isolate;
  }
  
  .chromium-desktop #app {
    /* Optimize compositing on Chromium browsers */
    content-visibility: auto;
  }
}

/* Keep one font family globally but allow components to choose proper size from the scale */
input, button, select, textarea, .el-button, .el-input, .el-select, .el-table, 
.el-menu, .el-dropdown, .el-message, .el-breadcrumb, .el-form-item__label, .el-tag {
  font-family: 'Inter', sans-serif !important;
}

h1 {
  font-size: var(--font-size-2xl);
}

h2 {
  font-size: var(--font-size-xl);
}

h3 {
  font-size: var(--font-size-lg);
}

h4,
h5,
h6 {
  font-size: var(--font-size-base);
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
