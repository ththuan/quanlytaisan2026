<template>
  <div
    class="scroll-progress"
    aria-hidden="true"
  >
    <motion.div
      v-if="reduce"
      class="scroll-progress__bar"
      :style="{ scaleX: scrollYProgress }"
    />
    <motion.div
      v-else
      class="scroll-progress__bar"
      :style="{ scaleX: smoothProgress }"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion-v';

const container = ref<HTMLElement | null>(null);
const reduce = useReducedMotion();

const { scrollYProgress } = useScroll({ container });
const smoothProgress = useSpring(scrollYProgress, {
  stiffness: 250,
  damping: 40,
  bounce: 0,
});

onMounted(() => {
  container.value = document.querySelector<HTMLElement>('.el-main');
});
</script>

<style scoped>
.scroll-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  overflow: hidden;
  pointer-events: none;
  z-index: 10;
}

.scroll-progress__bar {
  width: 100%;
  height: 100%;
  transform-origin: 0 50%;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.55);
  will-change: transform;
}
</style>
