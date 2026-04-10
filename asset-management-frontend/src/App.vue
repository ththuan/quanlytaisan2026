<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useIdleTimeout } from '@/composables/useIdleTimeout';

// Tự động logout sau 30 phút không hoạt động
useIdleTimeout();
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

/* Reset and Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif !important;
  font-size: var(--font-size-base);
  color: #1e293b;
  background-color: #f8fafc;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.55;
}

#app {
  font-family: 'Inter', sans-serif !important;
  font-size: var(--font-size-base);
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
