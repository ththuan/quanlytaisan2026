<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? 'Cập nhật công trình' : 'Tạo công trình'"
    width="760px"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
    >
      <el-form-item
        label="Tên hạng mục / công trình"
        prop="name"
      >
        <el-input
          v-model="form.name"
          placeholder="VD: Lót gạch nền phòng A101"
          maxlength="255"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col
          :xs="24"
          :sm="12"
        >
          <el-form-item label="Tài sản / công trình">
            <el-select
              v-model="form.asset_id"
              filterable
              remote
              clearable
              :remote-method="loadAssets"
              :loading="assetLoading"
              placeholder="Chọn nhà, công trình hoặc khu vực"
              style="width: 100%"
              @focus="loadAssets('')"
            >
              <el-option
                v-for="asset in assetOptions"
                :key="asset.id"
                :label="`${asset.asset_code} - ${asset.name}`"
                :value="asset.id"
              >
                <div class="asset-option">
                  <span>{{ asset.asset_code }} - {{ asset.name }}</span>
                  <small>{{ asset.location || asset.current_department?.name || '' }}</small>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col
          :xs="24"
          :sm="12"
        >
          <el-form-item label="Đơn vị phụ trách">
            <DepartmentTreeSelect
              v-model="form.department_id"
              :disabled="!canChooseDepartment"
              placeholder="Chọn đơn vị"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Vị trí / phòng / khu vực">
        <el-input
          v-model="form.location"
          placeholder="VD: Phòng A101, Tầng 1, Nhà A"
          maxlength="255"
        />
      </el-form-item>

      <el-form-item label="Nội dung sửa chữa / xây dựng">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="Mô tả khối lượng, vật liệu, phạm vi thực hiện..."
        />
      </el-form-item>

      <el-form-item label="Nhà thầu / đơn vị thi công">
        <el-input
          v-model="form.contractor"
          placeholder="Tên nhà thầu hoặc đơn vị thực hiện"
          maxlength="255"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col
          :xs="24"
          :sm="12"
        >
          <el-form-item label="Ngày bắt đầu">
            <el-date-picker
              v-model="form.start_date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="Chọn ngày"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col
          :xs="24"
          :sm="12"
        >
          <el-form-item label="Ngày hoàn thành">
            <el-date-picker
              v-model="form.end_date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="Chọn ngày"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col
          :xs="24"
          :sm="12"
        >
          <el-form-item label="Chi phí dự toán (đồng)">
            <el-input-number
              v-model="form.estimated_cost"
              :min="0"
              :step="100000"
              :controls="false"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col
          :xs="24"
          :sm="12"
        >
          <el-form-item label="Chi phí thực tế (đồng)">
            <el-input-number
              v-model="form.actual_cost"
              :min="0"
              :step="100000"
              :controls="false"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Trạng thái">
        <el-select
          v-model="form.status"
          style="width: 100%"
        >
          <el-option
            v-for="status in statusOptions"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Ghi chú">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          placeholder="Ghi chú thêm (nếu có)"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">
        Hủy
      </el-button>
      <el-button
        type="primary"
        :loading="saving"
        @click="handleSubmit"
      >
        Lưu
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from '@/types/element-plus';
import { useAuthStore } from '@/stores/auth.store';
import { assetService } from '@/services/asset.service';
import constructionWorkService, {
  type ConstructionStatus,
  type ConstructionWork,
} from '@/services/constructionWork.service';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';

const props = defineProps<{
  visible: boolean;
  work?: ConstructionWork | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  saved: [];
}>();

const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const saving = ref(false);
const assetLoading = ref(false);
const assetOptions = ref<any[]>([]);

const canChooseDepartment = computed(() => authStore.isAdmin || authStore.isDirector);
const isEdit = computed(() => Boolean(props.work?.id));

const statusOptions: Array<{ value: ConstructionStatus; label: string }> = [
  { value: 'planned', label: 'Kế hoạch' },
  { value: 'in_progress', label: 'Đang thực hiện' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const form = reactive<any>({
  name: '',
  asset_id: null,
  department_id: null,
  location: '',
  description: '',
  contractor: '',
  start_date: '',
  end_date: '',
  estimated_cost: null,
  actual_cost: null,
  status: 'planned',
  notes: '',
});

const rules: FormRules = {
  name: [{ required: true, message: 'Nhập tên hạng mục/công trình', trigger: 'blur' }],
};

const resetForm = () => {
  form.name = '';
  form.asset_id = null;
  form.department_id = authStore.userDepartmentId || null;
  form.location = '';
  form.description = '';
  form.contractor = '';
  form.start_date = '';
  form.end_date = '';
  form.estimated_cost = null;
  form.actual_cost = null;
  form.status = 'planned';
  form.notes = '';
  assetOptions.value = [];
};

const loadAssets = async (query: string) => {
  assetLoading.value = true;
  try {
    const response: any = await assetService.getAssets({
      search: query || undefined,
      page: 1,
      limit: 50,
      sortBy: 'asset_code',
      sortOrder: 'ASC',
    });
    assetOptions.value = response?.data || [];
  } catch {
    assetOptions.value = [];
  } finally {
    assetLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    saving.value = true;
    try {
      const payload = {
        ...form,
        asset_id: form.asset_id || null,
        department_id: form.department_id || null,
      };
      if (isEdit.value && props.work) {
        await constructionWorkService.update(props.work.id, payload);
        ElMessage.success('Đã cập nhật công trình');
      } else {
        await constructionWorkService.create(payload);
        ElMessage.success('Đã tạo công trình');
      }
      emit('saved');
      emit('update:visible', false);
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || 'Không lưu được công trình');
    } finally {
      saving.value = false;
    }
  });
};

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    resetForm();
    if (props.work) {
      Object.assign(form, {
        name: props.work.name || '',
        asset_id: props.work.asset_id ?? null,
        department_id: props.work.department_id ?? authStore.userDepartmentId ?? null,
        location: props.work.location || '',
        description: props.work.description || '',
        contractor: props.work.contractor || '',
        start_date: props.work.start_date || '',
        end_date: props.work.end_date || '',
        estimated_cost: props.work.estimated_cost ?? null,
        actual_cost: props.work.actual_cost ?? null,
        status: props.work.status || 'planned',
        notes: props.work.notes || '',
      });
      if (props.work.asset) {
        assetOptions.value = [props.work.asset];
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.asset-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.asset-option small {
  color: #94a3b8;
}
</style>
