<template>
  <div class="norm-page">
    <div class="page-head">
      <h2>Định mức &amp; Cảnh báo thiết bị</h2>
      <el-button
        v-if="activeTab === 'norms' && canEditNorms"
        type="primary"
        :icon="Plus"
        @click="openCreate"
      >
        Thêm định mức
      </el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane
        label="Danh mục định mức"
        name="norms"
      >
        <div class="toolbar">
          <el-input
            v-model="normSearch"
            placeholder="Tìm theo tên thiết bị..."
            clearable
            style="max-width: 320px"
            @keyup.enter="loadNorms"
            @clear="loadNorms"
          />
          <el-button @click="loadNorms">
            Tìm
          </el-button>
        </div>
        <el-table
          v-loading="loadingNorms"
          :data="norms"
          stripe
        >
          <el-table-column
            prop="equipment_name"
            label="Máy móc, thiết bị"
            min-width="220"
          />
          <el-table-column
            label="Phạm vi"
            width="130"
          >
            <template #default="{ row }">
              {{ scopeLabel(row.scope) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="position_group"
            label="Nhóm chức danh"
            min-width="180"
          />
          <el-table-column
            prop="unit"
            label="ĐVT"
            width="70"
            align="center"
          />
          <el-table-column
            label="SL tối đa"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              {{ row.max_quantity ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column
            label="Giá tối đa (triệu)"
            width="140"
            align="right"
          >
            <template #default="{ row }">
              {{ row.max_price != null ? formatNumber(row.max_price) : '-' }}
            </template>
          </el-table-column>
          <el-table-column
            label="Hiệu lực"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                :type="row.is_active ? 'success' : 'info'"
                size="small"
              >
                {{ row.is_active ? 'Đang áp dụng' : 'Tắt' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="canEditNorms"
            label="Thao tác"
            width="140"
            align="center"
          >
            <template #default="{ row }">
              <el-button
                text
                type="primary"
                size="small"
                @click="openEdit(row)"
              >
                Sửa
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                @click="removeNorm(row)"
              >
                Xóa
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane
        label="Cảnh báo vượt định mức"
        name="warnings"
      >
        <div class="toolbar">
          <el-checkbox
            v-model="showAcknowledged"
            @change="loadWarnings"
          >
            Hiện cả cảnh báo đã xử lý
          </el-checkbox>
          <el-button
            :icon="Refresh"
            @click="loadWarnings"
          >
            Làm mới
          </el-button>
        </div>
        <el-table
          v-loading="loadingWarnings"
          :data="warnings"
          stripe
        >
          <el-table-column
            label="Thời gian"
            width="170"
          >
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column
            label="Đơn vị"
            min-width="180"
          >
            <template #default="{ row }">
              {{ row.department?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            label="Tài sản"
            min-width="220"
          >
            <template #default="{ row }">
              <span v-if="row.asset_code">{{ row.asset_code }} — </span>{{ row.asset_name || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            label="Loại"
            width="110"
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                :type="row.warning_type === 'price' ? 'warning' : 'danger'"
                size="small"
              >
                {{ row.warning_type === 'price' ? 'Vượt giá' : 'Vượt số lượng' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="message"
            label="Nội dung"
            min-width="320"
          />
          <el-table-column
            label="Trạng thái"
            width="130"
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                :type="row.acknowledged ? 'success' : 'warning'"
                size="small"
              >
                {{ row.acknowledged ? 'Đã ghi nhận' : 'Chưa xử lý' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="Thao tác"
            width="120"
            align="center"
          >
            <template #default="{ row }">
              <el-button
                v-if="!row.acknowledged"
                text
                type="primary"
                size="small"
                @click="ackWarning(row)"
              >
                Đã ghi nhận
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Dialog thêm/sửa định mức -->
    <el-dialog
      v-model="showDialog"
      :title="editingId ? 'Sửa định mức' : 'Thêm định mức'"
      width="560px"
    >
      <el-form label-width="150px">
        <el-form-item
          label="Máy móc, thiết bị"
          required
        >
          <el-input
            v-model="form.equipment_name"
            placeholder="VD: Máy in, Máy vi tính để bàn..."
          />
        </el-form-item>
        <el-form-item label="Phạm vi">
          <el-select
            v-model="form.scope"
            style="width: 100%"
          >
            <el-option
              value="title"
              label="Theo chức danh"
            />
            <el-option
              value="room"
              label="Theo phòng làm việc"
            />
            <el-option
              value="digital"
              label="Thiết bị số"
            />
            <el-option
              value="secret"
              label="Bảo mật nhà nước"
            />
            <el-option
              value="other"
              label="Khác"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Nhóm chức danh">
          <el-select
            v-model="form.position_group"
            filterable
            allow-create
            default-first-option
            clearable
            placeholder="Chọn hoặc nhập nhóm chức danh..."
            style="width: 100%"
          >
            <el-option
              v-for="group in positionGroupOptions"
              :key="group"
              :label="group"
              :value="group"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Đơn vị tính">
          <el-input
            v-model="form.unit"
            placeholder="bộ / chiếc"
          />
        </el-form-item>
        <el-form-item label="Số lượng tối đa">
          <el-input-number
            v-model="form.max_quantity"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Mức giá tối đa (triệu)">
          <el-input-number
            v-model="form.max_price"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Văn bản">
          <el-input
            v-model="form.document_no"
            placeholder="VD: 10/2026/QĐ-TTg"
          />
        </el-form-item>
        <el-form-item label="Ghi chú">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
        <el-form-item label="Đang áp dụng">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">
          Hủy
        </el-button>
        <el-button
          type="primary"
          :loading="saving"
          @click="saveNorm"
        >
          Lưu
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import normService, { type EquipmentNorm, type NormWarning } from '@/services/norm.service';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
const canEditNorms = computed(() => authStore.isAdmin);

const activeTab = ref<'norms' | 'warnings'>('norms');

const norms = ref<EquipmentNorm[]>([]);
const loadingNorms = ref(false);
const normSearch = ref('');

const warnings = ref<NormWarning[]>([]);
const loadingWarnings = ref(false);
const showAcknowledged = ref(false);

const showDialog = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const form = ref<any>({
  equipment_name: '',
  scope: 'other',
  position_group: '',
  unit: 'bộ',
  max_quantity: 0,
  max_price: 0,
  document_no: '10/2026/QĐ-TTg',
  note: '',
  is_active: true,
});

const DEFAULT_POSITION_GROUPS = [
  'Hiệu trưởng',
  'Phó Hiệu trưởng',
  'Trưởng phòng, Phó Trưởng phòng và các chức danh tương đương',
  'Chuyên viên và các chức danh tương đương',
  'Chuyên viên và các chức danh tương đương; Cá nhân ký hợp đồng lao động',
  'Cá nhân ký hợp đồng lao động khác',
];

const positionGroupOptions = computed(() => {
  const set = new Set<string>(DEFAULT_POSITION_GROUPS);
  norms.value.forEach((n) => {
    const group = String(n.position_group || '').trim();
    if (group) set.add(group);
  });
  return Array.from(set);
});

const unwrap = (res: any) => res?.data ?? res ?? [];

const scopeLabel = (s: string) =>
  ({
    title: 'Theo chức danh',
    room: 'Phòng làm việc',
    digital: 'Thiết bị số',
    secret: 'Bảo mật',
    other: 'Khác',
  } as Record<string, string>)[s] || s;

const formatNumber = (v: any) => Number(v).toLocaleString('vi-VN');
const formatDateTime = (d: string) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

const loadNorms = async () => {
  loadingNorms.value = true;
  try {
    const res: any = await normService.listNorms({ search: normSearch.value || undefined });
    norms.value = unwrap(res);
  } catch {
    ElMessage.error('Không tải được danh mục định mức');
  } finally {
    loadingNorms.value = false;
  }
};

const loadWarnings = async () => {
  loadingWarnings.value = true;
  try {
    const res: any = await normService.listWarnings(
      showAcknowledged.value ? {} : { acknowledged: false }
    );
    warnings.value = unwrap(res);
  } catch {
    ElMessage.error('Không tải được cảnh báo');
  } finally {
    loadingWarnings.value = false;
  }
};

const openCreate = () => {
  editingId.value = null;
  form.value = {
    equipment_name: '',
    scope: 'other',
    position_group: '',
    unit: 'bộ',
    max_quantity: 0,
    max_price: 0,
    document_no: '10/2026/QĐ-TTg',
    note: '',
    is_active: true,
  };
  showDialog.value = true;
};

const openEdit = (row: EquipmentNorm) => {
  editingId.value = row.id;
  form.value = {
    equipment_name: row.equipment_name,
    scope: row.scope,
    position_group: row.position_group || '',
    unit: row.unit || 'bộ',
    max_quantity: row.max_quantity ?? 0,
    max_price: row.max_price != null ? Number(row.max_price) : 0,
    document_no: row.document_no || '',
    note: row.note || '',
    is_active: row.is_active,
  };
  showDialog.value = true;
};

const saveNorm = async () => {
  if (!form.value.equipment_name?.trim()) {
    ElMessage.warning('Vui lòng nhập tên máy móc, thiết bị');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await normService.updateNorm(editingId.value, form.value);
    } else {
      await normService.createNorm(form.value);
    }
    ElMessage.success('Đã lưu định mức');
    showDialog.value = false;
    await loadNorms();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Không lưu được định mức');
  } finally {
    saving.value = false;
  }
};

const removeNorm = async (row: EquipmentNorm) => {
  try {
    await ElMessageBox.confirm(`Xóa định mức "${row.equipment_name}"?`, 'Xác nhận', {
      type: 'warning',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    });
  } catch {
    return;
  }
  try {
    await normService.deleteNorm(row.id);
    ElMessage.success('Đã xóa định mức');
    await loadNorms();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Không xóa được định mức');
  }
};

const ackWarning = async (row: NormWarning) => {
  try {
    await normService.acknowledgeWarning(row.id);
    ElMessage.success('Đã ghi nhận cảnh báo');
    await loadWarnings();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Không cập nhật được');
  }
};

onMounted(() => {
  loadNorms();
  loadWarnings();
});
</script>

<style scoped>
.norm-page {
  padding: 20px;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.page-head h2 {
  margin: 0;
  font-size: 18px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
</style>
