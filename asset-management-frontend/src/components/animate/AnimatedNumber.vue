<template>
  <span
    class="animated-number"
    :aria-label="finalText"
  >{{ finalText }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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

const finalText = computed(() => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: props.decimalPlaces,
    maximumFractionDigits: props.decimalPlaces,
  });
  return formatter.format(Number.isFinite(props.value) ? props.value : 0);
});
</script>

<style scoped>
.animated-number {
  display: inline-block;
  font-variant-numeric: tabular-nums;
}
</style>
