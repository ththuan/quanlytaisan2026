<template>
  <div class="repair-request-view">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon">
              <Tools />
            </el-icon>
            Sửa chữa / Bảo trì thiết bị
          </h1>
          <p class="page-subtitle">
            Theo dõi yêu cầu sửa chữa và bảo trì thiết bị
          </p>
        </div>
      </div>
    </div>

    <el-card>
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
