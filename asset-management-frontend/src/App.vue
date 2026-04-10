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
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --el-font-size-base: 14px;
  --el-font-family: 'Plus Jakarta Sans', sans-serif;
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
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 14px;
  color: #1e293b;
  background-color: #f8fafc;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
}

#app {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 14px;
}

/* Force modern font on UI elements */
input, button, select, textarea, .el-button, .el-input, .el-select, .el-table, 
.el-menu, .el-dropdown, .el-message, .el-breadcrumb, .el-form-item__label, .el-tag {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 14px;
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
