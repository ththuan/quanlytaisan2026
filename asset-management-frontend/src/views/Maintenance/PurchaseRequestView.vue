<template>
  <div class="purchase-request-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Đề nghị trang cấp / Mua sắm thiết bị</span>
        </div>
      </template>
      <ProcurementList />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ProcurementList from '@/components/Maintenance/ProcurementList.vue';
</script>

<style scoped>
.purchase-request-view {
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
