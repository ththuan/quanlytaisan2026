<template>
  <div
    ref="root"
    class="tilt-card"
    @mousemove="handleMove"
    @mouseleave="handleLeave"
  >
    <motion.div
      class="tilt-card__inner"
      :style="{
        rotateX,
        rotateY,
        transformPerspective: perspective,
        transformStyle: 'preserve-3d',
      }"
    >
      <slot />
    </motion.div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { motion, motionValue, useReducedMotion, useSpring } from 'motion-v';

const props = withDefaults(
  defineProps<{
    maxTilt?: number;
    perspective?: number;
    spring?: { stiffness: number; damping: number; mass?: number };
  }>(),
  {
    maxTilt: 6,
    perspective: 900,
    spring: () => ({ stiffness: 300, damping: 25, mass: 0.5 }),
  },
);

const root = ref<HTMLElement | null>(null);
const reduce = useReducedMotion();

const rotateXValue = motionValue(0);
const rotateYValue = motionValue(0);
const rotateX = useSpring(rotateXValue, props.spring);
const rotateY = useSpring(rotateYValue, props.spring);

const handleMove = (event: MouseEvent) => {
  if (reduce.value) return;
  const element = root.value;
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;

  rotateYValue.set((x - 0.5) * props.maxTilt * 2);
  rotateXValue.set((0.5 - y) * props.maxTilt * 2);
};

const handleLeave = () => {
  rotateXValue.set(0);
  rotateYValue.set(0);
};
</script>

<style scoped>
.tilt-card {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.tilt-card__inner {
  width: 100%;
  height: 100%;
  will-change: transform;
}
</style>
