<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Tăng / Giảm tài sản</h2>
        <div class="sub">
          Theo dõi tăng tài sản (mua sắm/cấp phát) và giảm tài sản (thanh lý)
        </div>
      </div>
    </div>

    <el-tabs
      v-model="activeTab"
      type="card"
    >
      <el-tab-pane
        label="Tăng tài sản"
        name="increase"
      >
        <KeepAlive>
          <ProcurementListContent />
        </KeepAlive>
      </el-tab-pane>
      <el-tab-pane
        label="Giảm tài sản"
        name="decrease"
        lazy
      >
        <KeepAlive>
          <AssetDisposalCaseList />
        </KeepAlive>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AssetDisposalCaseList from '@/views/AssetDisposals/AssetDisposalCaseList.vue';
import ProcurementListContent from '@/views/Procurements/ProcurementListContent.vue';

const activeTab = ref<'increase' | 'decrease'>('increase');
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
