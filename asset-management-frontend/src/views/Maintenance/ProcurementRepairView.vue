<template>
  <div class="procurement-repair-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('maintenance.title') }}</span>
        </div>
      </template>
      
      <el-tabs
        v-model="activeTab"
        type="border-card"
      >
        <el-tab-pane
          label="Sửa chữa"
          name="repair"
        >
          <RepairList />
        </el-tab-pane>
        <el-tab-pane
          :label="$t('maintenance.tabs.procurement')"
          name="procurement"
        >
          <ProcurementList />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProcurementList from '@/components/Maintenance/ProcurementList.vue';
import RepairList from '@/components/Maintenance/RepairList.vue';

const activeTab = ref('repair');
</script>

<style scoped>
.procurement-repair-view {
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
