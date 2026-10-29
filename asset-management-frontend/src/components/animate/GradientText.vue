<template>
  <span
    class="gradient-text"
    :class="{ 'gradient-text--neon': neon }"
    :style="layerStyle"
  >
    <span class="gradient-text__label">{{ text }}</span>
    <span
      v-if="neon"
      class="gradient-text__label gradient-text__label--glow"
      aria-hidden="true"
    >{{ text }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    text: string;
    gradient?: string;
    neon?: boolean;
    speed?: number;
  }>(),
  {
    gradient: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 30%, #ec4899 60%, #8b5cf6 80%, #3b82f6 100%)',
    neon: false,
    speed: 14,
  },
);

const layerStyle = computed(() => ({
  '--gradient-text-image': props.gradient,
  '--gradient-text-duration': `${props.speed}s`,
}));
</script>

<style scoped>
.gradient-text {
  position: relative;
  display: inline-block;
  white-space: inherit;
}

.gradient-text__label {
  display: inline-block;
  color: transparent;
  background-image: var(--gradient-text-image);
  background-size: 700% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-text-sweep var(--gradient-text-duration) linear infinite;
}

.gradient-text__label--glow {
  position: absolute;
  inset: 0;
  filter: blur(10px);
  opacity: 0.55;
  mix-blend-mode: plus-lighter;
  pointer-events: none;
}

@keyframes gradient-text-sweep {
  from {
    background-position: 0% 50%;
  }
  to {
    background-position: 100% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gradient-text__label {
    animation: none;
    background-position: 50% 50%;
  }
}
</style>
