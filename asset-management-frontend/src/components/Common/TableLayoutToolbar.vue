<template>
  <div
    v-if="controller.isDesktop.value"
    class="table-layout-toolbar"
  >
    <div
      v-if="controller.isEditing.value"
      class="table-layout-toolbar__edit"
    >
      <span class="table-layout-toolbar__hint">
        Kéo vạch phân cách trên header để chỉnh cột
      </span>
      <el-button
        size="small"
        :disabled="controller.isSaving.value"
        @click="controller.cancelEditing"
      >
        Hủy
      </el-button>
      <el-button
        size="small"
        type="primary"
        :loading="controller.isSaving.value"
        @click="controller.saveAndLock"
      >
        Lưu &amp; khóa
      </el-button>
    </div>

    <el-popover
      v-else
      placement="bottom-end"
      :width="300"
      trigger="click"
      popper-class="table-layout-popover"
    >
      <template #reference>
        <el-button
          circle
          size="small"
          :icon="Setting"
          :loading="controller.isLoading.value"
          title="Bố cục bảng"
          aria-label="Bố cục bảng"
        />
      </template>

      <div class="table-layout-settings">
        <div class="table-layout-settings__title">
          Bố cục bảng
        </div>

        <div class="table-layout-settings__row">
          <span>Mật độ hiển thị</span>
          <el-radio-group
            size="small"
            :model-value="controller.density.value"
            @change="(value: string | number | boolean) => controller.setDensity(value as 'comfortable' | 'compact')"
          >
            <el-radio-button value="comfortable">
              Thoáng
            </el-radio-button>
            <el-radio-button value="compact">
              Gọn
            </el-radio-button>
          </el-radio-group>
        </div>

        <template v-if="controller.canManage.value && !controller.isLocked.value">
          <el-divider />
          <el-button
            class="table-layout-settings__edit"
            type="primary"
            plain
            size="small"
            @click="controller.startEditing"
          >
            Chỉnh độ rộng cột
          </el-button>
        </template>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue';

defineProps<{
  controller: {
    isDesktop: { value: boolean };
    isEditing: { value: boolean };
    isLocked: { value: boolean };
    isLoading: { value: boolean };
    isSaving: { value: boolean };
    canManage: { value: boolean };
    density: { value: 'comfortable' | 'compact' };
    setDensity: (value: 'comfortable' | 'compact') => void;
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
  min-height: 28px;
  margin: 0 0 8px;
  color: #64748b;
  font-size: 12px;
}

.table-layout-toolbar__edit {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.table-layout-toolbar__hint {
  margin-right: auto;
}

.table-layout-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-layout-settings__title {
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
}

.table-layout-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #475569;
  font-size: 13px;
}

.table-layout-settings__edit {
  width: 100%;
}
</style>
