<template>
  <div class="not-found">
    <el-result
      icon="warning"
      title="404"
      sub-title="Trang bạn tìm kiếm không tồn tại hoặc bạn không có quyền truy cập."
    >
      <template #extra>
        <el-button
          type="primary"
          @click="$router.push('/')"
        >
          Về trang chủ
        </el-button>
        <el-button @click="$router.back()">
          Quay lại
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
