<template>
  <div class="category-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>Quản lý danh mục tài sản</h3>
          <div style="display: flex; gap: 8px;">
            <el-button :icon="Refresh" :loading="loading" @click="fetchCategories">Làm mới</el-button>
            <el-button type="primary" :icon="Plus" @click="openCreate">Thêm danh mục</el-button>
          </div>
        </div>
      </template>

      <!-- Search + Filter -->
      <el-row :gutter="12" class="filter-row">
        <el-col :xs="24" :sm="10">
          <el-input
            v-model="search"
            placeholder="Tìm theo tên hoặc mã danh mục..."
            clearable
            :prefix-icon="Search"
            @input="onSearch"
            @clear="onSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="6">
          <el-select v-model="filterActive" placeholder="Trạng thái" clearable @change="fetchCategories">
            <el-option label="Đang dùng" :value="true" />
            <el-option label="Không dùng" :value="false" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8" style="display: flex; align-items: center; gap: 8px;">
          <el-switch v-model="treeMode" active-text="Dạng cây" inactive-text="Dạng bảng" @change="fetchCategories" />
        </el-col>
      </el-row>

      <!-- Tree view -->
      <el-tree
        v-if="treeMode && !loading"
        :data="treeData"
        :props="{ label: 'name', children: 'children' }"
        node-key="id"
        default-expand-all
        class="category-tree"
      >
        <template #default="{ data }">
          <div class="tree-node">
            <span class="tree-label">
              <el-tag size="small" type="info" style="margin-right: 6px; font-family: 'Plus Jakarta Sans', sans-serif;">{{ data.code }}</el-tag>
              {{ data.name }}
              <el-tag v-if="!data.is_active" size="small" type="danger" style="margin-left: 6px;">Không dùng</el-tag>
            </span>
            <span class="tree-meta">
              <span v-if="data.unit">{{ data.unit }}</span>
              <span v-if="data.is_depreciable"> · Khấu hao {{ data.depreciation_rate }}%/năm</span>
              <span v-if="data.useful_life_years"> · {{ data.useful_life_years }} năm</span>
            </span>
            <span class="tree-actions">
              <el-button size="small" text :icon="Edit" @click.stop="openEdit(data)" />
              <el-button size="small" text type="danger" :icon="Delete" @click.stop="handleDelete(data)" />
            </span>
          </div>
        </template>
      </el-tree>

      <!-- Table view -->
      <el-table
        v-if="!treeMode"
        v-loading="loading"
        :data="filteredCategories"
        stripe
        border
        style="margin-top: 12px;"
      >
        <el-table-column prop="code" label="Mã" width="130" />
        <el-table-column prop="name" label="Tên danh mục" min-width="220" />
        <el-table-column prop="category_group" label="Nhóm" width="120" />
        <el-table-column prop="unit" label="Đơn vị" width="90" />
        <el-table-column label="Khấu hao" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.is_depreciable" type="success" size="small">
              {{ row.depreciation_rate }}%/năm
            </el-tag>
            <el-tag v-else type="info" size="small">Không KH</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Năm SD" prop="useful_life_years" width="80" />
        <el-table-column label="Trạng thái" width="110">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? 'Đang dùng' : 'Không dùng' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="110" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text :icon="Edit" @click="openEdit(row)" />
            <el-button size="small" text type="danger" :icon="Delete" @click="handleDelete(row)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'"
      width="600px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="Mã danh mục" prop="code">
          <el-input v-model="form.code" placeholder="VD: MMTB.01" />
        </el-form-item>
        <el-form-item label="Tên danh mục" prop="name">
          <el-input v-model="form.name" placeholder="Tên danh mục tài sản" />
        </el-form-item>
        <el-form-item label="Mã cha">
          <el-input v-model="form.parent_code" placeholder="Bỏ trống nếu là danh mục gốc" />
        </el-form-item>
        <el-form-item label="Nhóm danh mục">
          <el-input v-model="form.category_group" placeholder="VD: Máy móc thiết bị" />
        </el-form-item>
        <el-form-item label="Kiểm kê theo">
          <el-select v-model="form.tracking_type" style="width: 100%;">
            <el-option value="individual" label="Đơn lẻ (có mã QR riêng)" />
            <el-option value="batch" label="Theo nhóm (công cụ dụng cụ, không cần QR từng cái)" />
          </el-select>
        </el-form-item>
        <el-form-item label="Đơn vị tính" prop="unit">
          <el-input v-model="form.unit" placeholder="Cái, Bộ, Chiếc..." />
        </el-form-item>
        <el-form-item label="Có khấu hao">
          <el-switch v-model="form.is_depreciable" />
        </el-form-item>
        <template v-if="form.is_depreciable">
          <el-form-item label="Tỷ lệ KH (%)" prop="depreciation_rate">
            <el-input-number v-model="form.depreciation_rate" :min="0" :max="100" :step="0.5" :precision="2" />
          </el-form-item>
          <el-form-item label="Năm sử dụng">
            <el-input-number v-model="form.useful_life_years" :min="1" :max="100" />
          </el-form-item>
        </template>
        <el-form-item label="Mô tả">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Hoạt động">
          <el-switch v-model="form.is_active" />
        </el-form-item>
        <el-form-item label="Thứ tự">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Lưu</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from '@/types/element-plus';
import { Plus, Refresh, Search, Edit, Delete } from '@element-plus/icons-vue';
import { assetCategoryService } from '@/services/assetCategory.service';
import type { AssetCategory } from '@/services/assetCategory.service';

const loading = ref(false);
const saving = ref(false);
const categories = ref<AssetCategory[]>([]);
const treeData = ref<any[]>([]);
const search = ref('');
const filterActive = ref<boolean | null>(null);
const treeMode = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();

const form = ref<Partial<AssetCategory>>({
  code: '',
  name: '',
  parent_code: '',
  category_group: '',
  unit: '',
  tracking_type: 'individual',
  is_depreciable: false,
  depreciation_rate: undefined,
  useful_life_years: undefined,
  description: '',
  is_active: true,
  sort_order: 0,
});

const rules: FormRules = {
  code: [{ required: true, message: 'Nhập mã danh mục', trigger: 'blur' }],
  name: [{ required: true, message: 'Nhập tên danh mục', trigger: 'blur' }],
  unit: [{ required: true, message: 'Nhập đơn vị tính', trigger: 'blur' }],
};

const filteredCategories = computed(() => {
  let list = categories.value;
  if (filterActive.value !== null) list = list.filter(c => c.is_active === filterActive.value);
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }
  return list;
});

const fetchCategories = async () => {
  loading.value = true;
  try {
    if (treeMode.value) {
      const res = await assetCategoryService.getTree();
      treeData.value = res.data;
    } else {
      const res = await assetCategoryService.getAll(true);
      categories.value = res.data;
    }
  } finally {
    loading.value = false;
  }
};

const onSearch = () => { /* reactive computed handles it */ };

const openCreate = () => {
  editingId.value = null;
  resetForm();
  dialogVisible.value = true;
};

const openEdit = (row: AssetCategory) => {
  editingId.value = row.id;
  form.value = { ...row };
  dialogVisible.value = true;
};

const handleDelete = async (row: AssetCategory) => {
  try {
    await ElMessageBox.confirm(
      `Xóa danh mục "${row.name}" (${row.code})? Thao tác này không thể hoàn tác.`,
      'Xác nhận xóa',
      { type: 'warning' }
    );
    await assetCategoryService.delete(row.id);
    ElMessage.success('Đã xóa danh mục');
    fetchCategories();
  } catch {
    // User cancelled
  }
};

const handleSave = async () => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    if (editingId.value) {
      await assetCategoryService.update(editingId.value, form.value);
      ElMessage.success('Đã cập nhật danh mục');
    } else {
      await assetCategoryService.create(form.value);
      ElMessage.success('Đã tạo danh mục mới');
    }
    dialogVisible.value = false;
    fetchCategories();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Không thể lưu danh mục');
  } finally {
    saving.value = false;
  }
};

const resetForm = () => {
  form.value = {
    code: '', name: '', parent_code: '', category_group: '', unit: '',
    is_depreciable: false, depreciation_rate: undefined, useful_life_years: undefined,
    tracking_type: 'individual' as 'individual' | 'batch',
    description: '', is_active: true, sort_order: 0,
  };
  formRef.value?.clearValidate();
};

onMounted(fetchCategories);
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header h3 { margin: 0; }
.filter-row { margin-bottom: 12px; }
.filter-row .el-select,
.filter-row .el-input { width: 100%; }

.category-tree { margin-top: 12px; }
.tree-node {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding: 4px 0;
  flex-wrap: wrap;
}
.tree-label { font-weight: 500; }
.tree-meta { font-size: 0.8rem; color: #6b7280; flex: 1; }
.tree-actions { margin-left: auto; opacity: 0; transition: opacity 0.15s; }
.tree-node:hover .tree-actions { opacity: 1; }
</style>
