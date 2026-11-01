<template>
  <div class="purchase-request-view">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon">
              <ShoppingCart />
            </el-icon>
            Đề nghị trang cấp / Mua sắm thiết bị
          </h1>
          <p class="page-subtitle">
            Quản lý đề nghị mua sắm và trang cấp thiết bị
          </p>
        </div>
      </div>
    </div>

    <el-card>
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
