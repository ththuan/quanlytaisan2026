<template>
  <div
    ref="root"
    class="image-zoom"
    :style="{ width, height, cursor }"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
    @mousemove="handleMove"
    @click="handleClick"
  >
    <motion.div
      class="image-zoom__inner"
      :animate="{ scale: zoomed ? zoomScale : 1 }"
      :transition="transition"
      :style="{ transformOrigin: origin }"
    >
      <slot />
    </motion.div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { motion, useReducedMotion } from 'motion-v';

const props = withDefaults(
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
    zoomOnHover: true,
    zoomOnClick: true,
    disabled: false,
    width: '100%',
    height: '100%',
  },
);

const root = ref<HTMLElement | null>(null);
const reduce = useReducedMotion();
const zoomed = ref(false);
const origin = ref('50% 50%');

const transition = computed(() =>
  reduce.value
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 200, damping: 28 },
);

const cursor = computed(() => {
  if (props.disabled) return 'default';
  return zoomed.value ? 'zoom-out' : 'zoom-in';
});

const updateOrigin = (event: MouseEvent) => {
  const element = root.value;
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
  origin.value = `${x}px ${y}px`;
};

const handleEnter = () => {
  if (props.disabled || !props.zoomOnHover || reduce.value) return;
  zoomed.value = true;
};

const handleLeave = () => {
  if (!props.zoomOnHover) return;
  zoomed.value = false;
};

const handleMove = (event: MouseEvent) => {
  if (props.disabled) return;
  updateOrigin(event);
};

const handleClick = (event: MouseEvent) => {
  if (props.disabled || !props.zoomOnClick || reduce.value) return;
  updateOrigin(event);
  zoomed.value = !zoomed.value;
};
</script>

<style scoped>
.image-zoom {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  touch-action: manipulation;
}

.image-zoom__inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
}
</style>
