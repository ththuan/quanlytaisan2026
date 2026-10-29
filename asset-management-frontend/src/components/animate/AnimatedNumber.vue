<template>
  <span
    ref="root"
    class="animated-number"
    :aria-label="finalText"
  >
    <span aria-hidden="true">{{ display }}</span>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { animate, motionValue, useInView, useReducedMotion } from 'motion-v';
import { useEffectsLite } from '@/utils/effects';

const props = withDefaults(
  defineProps<{
    value: number;
    from?: number;
    decimalPlaces?: number;
    delay?: number;
    inView?: boolean;
  }>(),
  {
    from: 0,
    decimalPlaces: 0,
    delay: 0,
    inView: true,
  },
);

const root = ref<HTMLElement | null>(null);
const reduce = useReducedMotion();
const lite = useEffectsLite();
const isInView = useInView(root);

const countTransition = {
  duration: 0.9,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

const formatter = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: props.decimalPlaces,
  maximumFractionDigits: props.decimalPlaces,
});

const format = (value: number) => formatter.format(Number.isFinite(value) ? value : 0);

const display = ref(format(props.from));
const finalText = ref(format(props.value));

const motion = motionValue(props.from);
let stopAnimation: (() => void) | null = null;
let hasRun = false;

motion.on('change', (latest) => {
  display.value = format(latest);
});

const run = () => {
  if (hasRun) return;
  hasRun = true;

  if (reduce.value || lite.value) {
    motion.jump(props.value);
    display.value = finalText.value;
    return;
  }

  const timer = window.setTimeout(() => {
    const controls = animate(motion, props.value, countTransition);
    stopAnimation = () => controls.stop();
  }, props.delay);

  stopAnimation = () => window.clearTimeout(timer);
};

onMounted(() => {
  if (!props.inView || isInView.value) run();
});

watch(isInView, (now) => {
  if (now) run();
});

watch(lite, (now) => {
  if (!now) return;
  stopAnimation?.();
  motion.jump(props.value);
  display.value = finalText.value;
});

watch(
  () => props.value,
  (value) => {
    finalText.value = format(value);
    if (!hasRun) {
      if (!props.inView || isInView.value) run();
      return;
    }
    if (stopAnimation) stopAnimation();
    if (reduce.value || lite.value) {
      motion.jump(value);
      display.value = finalText.value;
      return;
    }
    const controls = animate(motion, value, countTransition);
    stopAnimation = () => controls.stop();
  },
);

onBeforeUnmount(() => {
  stopAnimation?.();
  motion.stop();
});
</script>

<style scoped>
.animated-number {
  display: inline-block;
  font-variant-numeric: tabular-nums;
}
</style>
