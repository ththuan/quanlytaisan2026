<template>
  <div class="repair-request-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Sửa chữa / Bảo trì thiết bị</span>
        </div>
      </template>
      <RepairList />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import RepairList from '@/components/Maintenance/RepairList.vue';
</script>

<style scoped>
.repair-request-view {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}
</style>
