<template>
  <div
    v-if="controller.isDesktop.value"
    class="table-layout-toolbar"
  >
    <template v-if="controller.isEditing.value">
      <span class="table-layout-toolbar__hint">
        Kéo vạch phân cách trên header để chỉnh cột
      </span>
      <el-button
        size="small"
        @click="controller.cancelEditing"
      >
        Hủy
      </el-button>
      <el-button
        size="small"
        type="primary"
        @click="controller.saveAndLock"
      >
        Lưu &amp; khóa
      </el-button>
    </template>

    <div
      v-else-if="controller.isLocked.value"
      class="table-layout-toolbar__locked"
    >
      <el-icon><Lock /></el-icon>
      <span>Bố cục cột đã khóa</span>
    </div>

    <el-button
      v-else
      size="small"
      :icon="Grid"
      @click="controller.startEditing"
    >
      Chỉnh bố cục cột
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { Grid, Lock } from '@element-plus/icons-vue';

defineProps<{
  controller: {
    isDesktop: { value: boolean };
    isEditing: { value: boolean };
    isLocked: { value: boolean };
    startEditing: () => void | Promise<void>;
    cancelEditing: () => void | Promise<void>;
    saveAndLock: () => void | Promise<void>;
  };
}>();
</script>

<style scoped>
.table-layout-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-height: 28px;
  margin: 0 0 8px;
  color: #64748b;
  font-size: 12px;
}

.table-layout-toolbar__hint {
  margin-right: auto;
}

.table-layout-toolbar__locked {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #94a3b8;
  font-size: 12px;
}
</style>
