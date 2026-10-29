<template>
  <div
    class="auto-height"
    :class="{ 'auto-height--open': open }"
    :aria-hidden="!open"
    :inert="!open"
  >
    <div class="auto-height__inner">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
}>();
</script>

<style scoped>
.auto-height {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.24s ease;
}

.auto-height--open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.auto-height__inner {
  min-height: 0;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .auto-height {
    transition: none;
  }
}
</style>
