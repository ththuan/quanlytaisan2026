<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Tăng tài sản</h2>
        <div class="sub">
          Theo dõi tăng tài sản (mua sắm / cấp phát)
        </div>
      </div>
    </div>

    <ProcurementListContent />
  </div>
</template>

<script setup lang="ts">
import ProcurementListContent from '@/views/Procurements/ProcurementListContent.vue';
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.sub {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
}

.page :deep(.el-tabs__content) {
  padding: 20px 0;
  min-height: calc(100vh - 250px);
  position: relative;
}

.page :deep(.el-tab-pane) {
  min-height: inherit;
}

.page :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
}

.page :deep(.el-card) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .page :deep(.el-tabs__content) {
    padding: 16px 0;
  }
  
  .page-header {
    margin-bottom: 12px;
  }
}
</style>
