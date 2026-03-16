<template>
  <el-dialog
    :model-value="visible"
    title="Hoàn tất mua sắm & tạo tài sản"
    width="900px"
    @close="emit('update:visible', false)"
  >
    <div v-if="!request">
      <el-empty description="Không có dữ liệu đề nghị" />
    </div>

    <div v-else>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      >
        <div>
          <div><b>Đề nghị:</b> {{ request.device_name }} (SL: {{ request.quantity }})</div>
          <div><b>Trạng thái:</b> {{ request.status }}</div>
        </div>
      </el-alert>

      <el-form
        :model="form"
        label-width="160px"
      >
        <el-form-item label="Phòng ban nhận">
          <el-select
            v-model="form.department_id"
            filterable
            placeholder="Chọn phòng ban nhận"
            style="width: 100%"
          >
            <el-option
              v-for="d in departments"
              :key="d.id"
              :label="d.name"
              :value="d.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Ngày mua">
          <el-date-picker
            v-model="form.purchase_date"
            type="date"
            placeholder="Chọn ngày mua"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-divider content-position="left">
          Danh sách tài sản sẽ tạo
        </el-divider>

        <div style="display:flex; gap:8px; margin-bottom: 10px;">
          <el-button
            type="primary"
            @click="addLine"
          >
            Thêm dòng
          </el-button>
          <el-button @click="resetFromRequest">
            Tự điền theo đề nghị
          </el-button>
        </div>

        <div class="responsive-table">
          <el-table
            :data="form.assets"
            border
            stripe
            size="small"
          >
            <el-table-column
              label="Mã (prefix)"
              min-width="180"
            >
              <template #default="{ row }">
                <el-input
                  v-model="row.asset_code_prefix"
                  placeholder="VD: MS-2026-0001"
                />
              </template>
            </el-table-column>
            <el-table-column
              label="Tên tài sản"
              min-width="240"
            >
              <template #default="{ row }">
                <el-input
                  v-model="row.name"
                  placeholder="Tên tài sản"
                />
              </template>
            </el-table-column>
            <el-table-column
              label="Mã loại (category_code)"
              min-width="160"
            >
              <template #default="{ row }">
                <el-input
                  v-model="row.category_code"
                  placeholder="VD: 7523"
                />
              </template>
            </el-table-column>
            <el-table-column
              label="SL"
              width="90"
              align="center"
            >
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :max="500"
                />
              </template>
            </el-table-column>
            <el-table-column
              label="Đơn giá (VND)"
              width="160"
              align="right"
            >
              <template #default="{ row }">
                <el-input-number
                  v-model="row.purchase_price"
                  :min="0"
                  :step="100000"
                  :controls="false"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column
              label="Đơn vị"
              width="120"
              align="center"
            >
              <template #default="{ row }">
                <el-input
                  v-model="row.unit"
                  placeholder="cái"
                />
              </template>
            </el-table-column>
            <el-table-column
              label=""
              width="70"
              fixed="right"
              align="center"
            >
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  link
                  @click="removeLine($index)"
                >
                  Xóa
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="emit('update:visible', false)">
        Hủy
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="submit"
      >
        Hoàn tất & tạo tài sản
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/services/api';
import { useDepartmentStore } from '@/stores/department.store';

const props = defineProps<{
  visible: boolean;
  request: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'success'): void;
}>();

const departmentStore = useDepartmentStore();
const loading = ref(false);

const departments = computed(() => departmentStore.departments);

const form = reactive<any>({
  department_id: null as number | null,
  purchase_date: null as string | null,
  assets: [] as any[],
});

const resetFromRequest = () => {
  if (!props.request) return;
  const year = new Date().getFullYear();
  form.department_id = props.request.department_id || null;
  form.purchase_date = null;
  form.assets = [
    {
      asset_code_prefix: `MS-${year}-${props.request.id}`,
      name: props.request.device_name || 'Tài sản mua sắm',
      category_code: props.request.category_code || null,
      quantity: Number(props.request.quantity || 1),
      purchase_price: props.request.unit_price != null ? Number(props.request.unit_price) : null,
      unit: props.request.unit || 'Cái',
    },
  ];
};

const addLine = () => {
  const year = new Date().getFullYear();
  form.assets.push({
    asset_code_prefix: props.request ? `MS-${year}-${props.request.id}-${form.assets.length + 1}` : `MS-${year}`,
    name: '',
    category_code: null,
    quantity: 1,
    purchase_price: null,
    unit: 'Cái',
  });
};

const removeLine = (idx: number) => {
  form.assets.splice(idx, 1);
};

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      await departmentStore.fetchDepartments();
      resetFromRequest();
    }
  }
);

const submit = async () => {
  if (!props.request) return;
  if (!form.department_id) {
    ElMessage.error('Vui lòng chọn phòng ban nhận');
    return;
  }
  if (!form.assets.length) {
    ElMessage.error('Vui lòng nhập ít nhất 1 dòng tài sản');
    return;
  }
  const invalid = form.assets.find((a: any) => !a.name || !String(a.name).trim());
  if (invalid) {
    ElMessage.error('Tên tài sản là bắt buộc');
    return;
  }

  loading.value = true;
  try {
    const payload = {
      department_id: form.department_id,
      purchase_date: form.purchase_date,
      assets: form.assets.map((a: any) => ({
        asset_code_prefix: a.asset_code_prefix,
        name: a.name,
        category_code: a.category_code,
        quantity: a.quantity,
        purchase_price: a.purchase_price,
        unit: a.unit,
      })),
    };
    const res: any = await api.post(`/maintenance/${props.request.id}/fulfill-procurement`, payload);
    const createdAssets = Array.isArray(res?.data?.created_assets)
      ? res.data.created_assets
      : (Array.isArray(res?.created_assets) ? res.created_assets : (Array.isArray(res?.data) ? res.data : []));
    const createdCount = createdAssets.length;
    ElMessage.success(`Đã tạo ${createdCount} tài sản`);

    // Help user immediately verify created assets in AssetList by applying department filter.
    // (AssetList locks department for non-admin users, so this makes the created assets visible if backend saved department correctly.)
    const deptId = Number(form.department_id);
    if (!Number.isNaN(deptId)) {
      window.location.href = `/assets?current_department_id=${deptId}`;
      return;
    }

    emit('success');
    emit('update:visible', false);
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'Không thể hoàn tất mua sắm';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};
</script>

