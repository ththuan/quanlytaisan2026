<template>
  <div
    v-if="active"
    :key="seed"
    class="particles-burst"
    aria-hidden="true"
  >
    <span
      v-for="index in count"
      :key="index"
      class="particles-burst__dot"
      :style="dotStyle(index)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    active: boolean;
    count?: number;
    radius?: number;
    colors?: string[];
  }>(),
  {
    count: 8,
    radius: 26,
    colors: () => ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
  },
);

const seed = ref(0);
watch(
  () => props.active,
  (active) => {
    if (active) seed.value += 1;
  },
);

const dotStyle = (index: number) => {
  const angle = (360 / props.count) * index;
  const color = props.colors[index % props.colors.length];
  return {
    '--particle-angle': `${angle}deg`,
    '--particle-radius': `${props.radius}px`,
    '--particle-color': color,
    '--particle-delay': `${index * 18}ms`,
  };
};
</script>

<style scoped>
.particles-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 20;
}

.particles-burst__dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  margin: -2.5px 0 0 -2.5px;
  border-radius: 50%;
  background: var(--particle-color);
  box-shadow: 0 0 6px var(--particle-color);
  animation: particle-burst 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--particle-delay);
  opacity: 0;
}

@keyframes particle-burst {
  0% {
    opacity: 0;
    transform: rotate(var(--particle-angle)) translateY(0) scale(0.2);
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(var(--particle-angle)) translateY(calc(var(--particle-radius) * -1)) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .particles-burst {
    display: none;
  }
}
</style>
