<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Tăng / Giảm tài sản</h2>
        <div class="sub">Theo dõi tăng tài sản (mua sắm/cấp phát) và giảm tài sản (thanh lý)</div>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="Tăng tài sản" name="increase">
        <ProcurementListContent />
      </el-tab-pane>
      <el-tab-pane label="Giảm tài sản" name="decrease" lazy>
        <AssetDisposalCaseList />
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
  margin-bottom: 12px;
}

.sub {
  color: #909399;
  font-size: 13px;
}
</style>
