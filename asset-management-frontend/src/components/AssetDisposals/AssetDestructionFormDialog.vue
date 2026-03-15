<template>
  <el-dialog
    v-model="visible"
    :title="formData.disposal_type === 'destruction' ? 'Tạo hồ sơ tiêu hủy tài sản' : 'Tạo hồ sơ thanh lý tài sản'"
    width="900px"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <div class="dialog-hint" v-if="formData.disposal_type === 'destruction'">
      <el-alert type="info" show-icon :closable="false">
        <template #title>
          <b>Tiêu hủy tài sản</b> – Điều 24 Quy chế 2026: Áp dụng cho tài sản liên quan đến
          bí mật nhà nước, bảo vệ môi trường, phần mềm hết hạn bản quyền. Hiệu trưởng quyết
          định tiêu hủy TS cố định có nguyên giá &lt; 1 tỷ đồng.
        </template>
      </el-alert>
    </div>
    <div class="dialog-hint" v-else>
      <el-alert type="warning" show-icon :closable="false">
        <template #title>
          <b>Thanh lý tài sản</b> – Điều 23 Quy chế 2026: Áp dụng khi TS hết hạn sử dụng,
          hư hỏng không sửa được, hoặc chi phí sửa chữa &gt; 30% nguyên giá.
        </template>
      </el-alert>
    </div>

    <el-form ref="formRef" :model="formData" :rules="rules" label-width="170px" style="margin-top:12px">
      <!-- Loại xử lý -->
      <el-form-item label="Loại xử lý" prop="disposal_type">
        <el-radio-group v-model="formData.disposal_type">
          <el-radio-button value="liquidation">Thanh lý (Điều 23)</el-radio-button>
          <el-radio-button value="destruction">Tiêu hủy (Điều 24)</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- Hình thức tiêu hủy -->
      <el-form-item v-if="formData.disposal_type === 'destruction'" label="Hình thức tiêu hủy" prop="destruction_method">
        <el-select v-model="formData.destruction_method" placeholder="Chọn hình thức" style="width:100%">
          <el-option label="Sử dụng hóa chất" value="chemical" />
          <el-option label="Biện pháp cơ học" value="mechanical" />
          <el-option label="Chôn lấp" value="burial" />
          <el-option label="Tháo gỡ / cài đặt lại phần mềm" value="software" />
          <el-option label="Hình thức khác" value="other" />
        </el-select>
      </el-form-item>

      <!-- Hình thức thanh lý -->
      <el-form-item v-else label="Hình thức thanh lý" prop="disposal_method">
        <el-select v-model="formData.disposal_method" placeholder="Chọn hình thức" style="width:100%">
          <el-option label="Bán đấu giá (≥50 triệu/TS)" value="sell_auction" />
          <el-option label="Bán niêm yết (10–50 triệu/TS)" value="sell_listed" />
          <el-option label="Bán chỉ định (&lt;10 triệu/TS)" value="sell_direct" />
          <el-option label="Phá dỡ / hủy bỏ" value="demolish" />
        </el-select>
      </el-form-item>

      <!-- Danh sách tài sản chờ thanh lý nhóm theo đơn vị -->
      <el-form-item label="Danh sách tài sản" prop="asset_ids">
        <div style="width:100%">
          <div class="asset-summary-bar">
            <el-checkbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="toggleSelectAll"
            >
              Chọn tất cả
            </el-checkbox>
            <el-tag type="info" size="small">Đã chọn: {{ selectedAssetIds.size }} tài sản</el-tag>
            <el-button size="small" text type="primary" :loading="groupedLoading" @click="loadGroupedAssets">
              <el-icon><Refresh /></el-icon> Tải lại
            </el-button>
          </div>

          <div v-loading="groupedLoading" class="grouped-assets-container">
            <el-empty v-if="!groupedLoading && groupedData.length === 0" description="Không có tài sản nào đang chờ thanh lý" />

            <el-collapse v-model="expandedDepts" v-if="groupedData.length > 0">
              <el-collapse-item
                v-for="group in groupedData"
                :key="group.department_id ?? 'none'"
                :name="String(group.department_id ?? 'none')"
              >
                <template #title>
                  <div class="dept-collapse-title">
                    <el-checkbox
                      :model-value="isDeptAllSelected(group)"
                      :indeterminate="isDeptIndeterminate(group)"
                      @change="toggleDeptAll(group)"
                      @click.stop
                    />
                    <span class="dept-name">{{ group.department_name }}</span>
                    <el-tag size="small" type="warning">{{ group.assets.length }} tài sản</el-tag>
                    <el-tag size="small" type="info">Chọn: {{ countDeptSelected(group) }}</el-tag>
                  </div>
                </template>

                <el-table :data="group.assets" size="small" border style="width:100%" max-height="250">
                  <el-table-column width="45" align="center">
                    <template #default="{ row }">
                      <el-checkbox
                        :model-value="selectedAssetIds.has(row.id)"
                        @change="toggleAsset(row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column prop="asset_code" label="Mã TS" width="130" />
                  <el-table-column prop="name" label="Tên tài sản" min-width="220" />
                  <el-table-column label="Nguyên giá" width="150" align="right">
                    <template #default="{ row }">{{ formatVND(row.purchase_price) }}</template>
                  </el-table-column>
                  <el-table-column label="Giá trị còn lại" width="150" align="right">
                    <template #default="{ row }">{{ formatVND(row.current_value) }}</template>
                  </el-table-column>
                </el-table>
              </el-collapse-item>
            </el-collapse>
          </div>

          <!-- Tìm kiếm thêm tài sản -->
          <div class="extra-search-section">
            <el-divider content-position="left">Thêm tài sản thủ công</el-divider>
            <el-input v-model="assetSearch" placeholder="Tìm mã hoặc tên tài sản để thêm..." clearable
                      @input="searchAssets" :prefix-icon="Search" />
            <div v-if="searchResults.length > 0" class="search-results">
              <div v-for="a in searchResults" :key="a.id" class="search-item" @click="addManualAsset(a)">
                <span class="code">{{ a.asset_code }}</span>
                <span class="name">{{ a.name }}</span>
                <span class="dept">{{ a.department?.name || '' }}</span>
                <span class="price">{{ formatVND(a.purchase_price) }}</span>
              </div>
            </div>
            <div v-else-if="assetSearch && !searchLoading" class="no-results">Không tìm thấy tài sản phù hợp</div>
          </div>

          <!-- Tài sản thêm thủ công -->
          <div v-if="manualAssets.length > 0" class="manual-assets-section">
            <div class="manual-label">Tài sản thêm thủ công:</div>
            <el-table :data="manualAssets" size="small" border style="width:100%" max-height="150">
              <el-table-column prop="asset_code" label="Mã TS" width="130" />
              <el-table-column prop="name" label="Tên tài sản" min-width="200" />
              <el-table-column label="Đơn vị" width="160">
                <template #default="{ row }">{{ row._dept_name || '—' }}</template>
              </el-table-column>
              <el-table-column label="Nguyên giá" width="140" align="right">
                <template #default="{ row }">{{ formatVND(row.purchase_price) }}</template>
              </el-table-column>
              <el-table-column label="" width="50">
                <template #default="{ row }">
                  <el-button size="small" type="danger" text :icon="Delete" @click="removeManualAsset(row.id)" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-form-item>

      <!-- Ghi chú / lý do -->
      <el-form-item label="Lý do / ghi chú" prop="notes">
        <el-input v-model="formData.notes" type="textarea" :rows="3"
                  placeholder="Ghi rõ lý do đề nghị xử lý (hư hỏng, hết hạn, bí mật nhà nước...)" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Hủy</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">
        Tạo hồ sơ {{ formData.disposal_type === 'destruction' ? 'tiêu hủy' : 'thanh lý' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Delete, Refresh, Search } from '@element-plus/icons-vue';
import assetDisposalService from '@/services/assetDisposal.service';
import api from '@/services/api';

const emit = defineEmits(['created']);
const visible = defineModel<boolean>();

const formRef = ref();
const submitting = ref(false);

const formData = reactive({
  disposal_type: 'liquidation' as 'liquidation' | 'destruction',
  destruction_method: '' as string,
  disposal_method: '' as string,
  notes: '',
});

const rules = {
  disposal_type: [{ required: true, message: 'Chọn loại xử lý' }],
  notes: [{ required: true, max: 1000, message: 'Nhập lý do xử lý' }],
};

// --- Grouped pending disposal assets ---
const groupedData = ref<any[]>([]);
const groupedLoading = ref(false);
const expandedDepts = ref<string[]>([]);
const selectedAssetIds = ref<Set<number>>(new Set());

const loadGroupedAssets = async () => {
  groupedLoading.value = true;
  try {
    const data = await assetDisposalService.getPendingDisposalGrouped();
    groupedData.value = Array.isArray(data) ? data : [];
    expandedDepts.value = groupedData.value.map((g: any) => String(g.department_id ?? 'none'));
    // Auto-select all
    const allIds = new Set<number>();
    for (const g of groupedData.value) {
      for (const a of g.assets) allIds.add(a.id);
    }
    selectedAssetIds.value = allIds;
  } catch {
    groupedData.value = [];
  } finally {
    groupedLoading.value = false;
  }
};

watch(visible, (open) => {
  if (open) loadGroupedAssets();
});

const allGroupAssetIds = computed(() => {
  const ids = new Set<number>();
  for (const g of groupedData.value) {
    for (const a of g.assets) ids.add(a.id);
  }
  return ids;
});

const isAllSelected = computed(() => {
  if (allGroupAssetIds.value.size === 0) return false;
  for (const id of allGroupAssetIds.value) {
    if (!selectedAssetIds.value.has(id)) return false;
  }
  return true;
});

const isIndeterminate = computed(() => {
  if (allGroupAssetIds.value.size === 0) return false;
  let some = false, all = true;
  for (const id of allGroupAssetIds.value) {
    if (selectedAssetIds.value.has(id)) some = true;
    else all = false;
  }
  return some && !all;
});

const toggleSelectAll = (val: any) => {
  const next = new Set(selectedAssetIds.value);
  if (val) {
    for (const id of allGroupAssetIds.value) next.add(id);
  } else {
    for (const id of allGroupAssetIds.value) next.delete(id);
  }
  // Keep manual assets
  for (const a of manualAssets.value) next.add(a.id);
  selectedAssetIds.value = next;
};

const isDeptAllSelected = (group: any) => {
  return group.assets.length > 0 && group.assets.every((a: any) => selectedAssetIds.value.has(a.id));
};

const isDeptIndeterminate = (group: any) => {
  const some = group.assets.some((a: any) => selectedAssetIds.value.has(a.id));
  const all = group.assets.every((a: any) => selectedAssetIds.value.has(a.id));
  return some && !all;
};

const countDeptSelected = (group: any) => {
  return group.assets.filter((a: any) => selectedAssetIds.value.has(a.id)).length;
};

const toggleDeptAll = (group: any) => {
  const next = new Set(selectedAssetIds.value);
  const allSelected = isDeptAllSelected(group);
  for (const a of group.assets) {
    if (allSelected) next.delete(a.id);
    else next.add(a.id);
  }
  selectedAssetIds.value = next;
};

const toggleAsset = (asset: any) => {
  const next = new Set(selectedAssetIds.value);
  if (next.has(asset.id)) next.delete(asset.id);
  else next.add(asset.id);
  selectedAssetIds.value = next;
};

// --- Manual asset search ---
const assetSearch = ref('');
const searchResults = ref<any[]>([]);
const searchLoading = ref(false);
const manualAssets = ref<any[]>([]);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const searchAssets = () => {
  if (searchTimer) clearTimeout(searchTimer);
  if (!assetSearch.value.trim()) { searchResults.value = []; return; }
  searchTimer = setTimeout(async () => {
    searchLoading.value = true;
    try {
      const params: any = { search: assetSearch.value, status: 'active,inactive,damaged,pending_disposal', limit: 20 };
      const res: any = await api.get('/assets', { params });
      const list = res?.data?.data || res?.data?.items || res?.data || [];
      const existingIds = new Set([...selectedAssetIds.value, ...manualAssets.value.map((a: any) => a.id)]);
      // Also exclude assets already in grouped data
      for (const g of groupedData.value) {
        for (const a of g.assets) existingIds.add(a.id);
      }
      searchResults.value = list.filter((a: any) => !existingIds.has(a.id));
    } catch {
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  }, 300);
};

const addManualAsset = (asset: any) => {
  if (!manualAssets.value.find((a) => a.id === asset.id)) {
    manualAssets.value.push({
      ...asset,
      _dept_name: asset.department?.name || '',
    });
    selectedAssetIds.value = new Set([...selectedAssetIds.value, asset.id]);
  }
  assetSearch.value = '';
  searchResults.value = [];
};

const removeManualAsset = (id: number) => {
  manualAssets.value = manualAssets.value.filter((a) => a.id !== id);
  const next = new Set(selectedAssetIds.value);
  next.delete(id);
  selectedAssetIds.value = next;
};

// --- Submit ---
const submit = async () => {
  await formRef.value?.validate();
  const totalIds = [...selectedAssetIds.value];
  if (totalIds.length === 0) {
    ElMessage.warning('Vui lòng chọn ít nhất một tài sản');
    return;
  }
  submitting.value = true;
  try {
    await assetDisposalService.createManualCase({
      disposal_type: formData.disposal_type,
      destruction_method: formData.disposal_type === 'destruction' ? formData.destruction_method || undefined : undefined,
      disposal_method: formData.disposal_type === 'liquidation' ? formData.disposal_method || undefined : undefined,
      notes: formData.notes || undefined,
      asset_ids: totalIds,
    });
    ElMessage.success('Tạo hồ sơ thành công');
    visible.value = false;
    emit('created');
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || err?.message || 'Lỗi tạo hồ sơ');
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  formData.disposal_type = 'liquidation';
  formData.destruction_method = '';
  formData.disposal_method = '';
  formData.notes = '';
  selectedAssetIds.value = new Set();
  groupedData.value = [];
  manualAssets.value = [];
  searchResults.value = [];
  assetSearch.value = '';
  formRef.value?.clearValidate();
};

const formatVND = (v: any) =>
  v ? Number(v).toLocaleString('vi-VN') + ' ₫' : '—';
</script>

<style scoped>
.dialog-hint {
  margin-bottom: 4px;
}

.asset-summary-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.grouped-assets-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 8px;
}

.dept-collapse-title {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.dept-name {
  font-weight: 600;
  color: #303133;
}

.extra-search-section {
  margin-top: 4px;
}

.search-results {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  max-height: 160px;
  overflow-y: auto;
  margin-top: 4px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,.1);
}

.search-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  gap: 10px;
  font-size: 13px;
}

.search-item:hover { background: #f0f7ff; }
.search-item .code { color: #409eff; min-width: 100px; font-weight: 600; }
.search-item .name { flex: 1; }
.search-item .dept { color: #909399; font-size: 12px; min-width: 100px; }
.search-item .price { color: #666; font-size: 12px; }
.no-results { font-size: 12px; color: #999; margin-top: 4px; padding: 4px 8px; }

.manual-assets-section {
  margin-top: 8px;
}

.manual-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
  font-weight: 500;
}
</style>
