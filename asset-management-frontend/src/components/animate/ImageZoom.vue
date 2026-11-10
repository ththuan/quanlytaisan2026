<template>
  <div
    class="image-zoom"
    :style="{ width, height }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    zoomScale?: number;
    zoomOnHover?: boolean;
    zoomOnClick?: boolean;
    disabled?: boolean;
    width?: string;
    height?: string;
  }>(),
  {
    zoomScale: 2,
    zoomOnHover: false,
    zoomOnClick: false,
    disabled: false,
    width: '100%',
    height: '100%',
  },
);
</script>

<style scoped>
.image-zoom {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  touch-action: manipulation;
}

.image-zoom :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
