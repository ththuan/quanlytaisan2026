<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="formData"
    :rules="rules"
    label-position="top"
  >
    <!-- Phân loại tài sản -->
    <el-divider content-position="left">
      <el-icon><Files /></el-icon> Phân loại tài sản
    </el-divider>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item
          label="Loại tài sản"
          prop="category_id"
        >
          <el-cascader
            v-model="selectedCategory"
            v-loading="loadingCategories"
            :options="categoryTree"
            :props="cascaderProps"
            placeholder="Chọn loại tài sản (ví dụ: Nhà cấp I, Máy vi tính, Xe ô tô...)"
            style="width: 100%"
            filterable
            clearable
            @change="handleCategoryChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="Mã loại tài sản">
          <el-input
            v-model="formData.category_code"
            disabled
            placeholder="Tự động"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="Đơn vị tính">
          <el-input
            v-model="formData.unit"
            disabled
            placeholder="Tự động"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Hiển thị thông tin hao mòn ngay khi chọn loại tài sản -->
    <el-row
      v-if="formData.category_id"
      :gutter="20"
    >
      <el-col :span="8">
        <el-form-item label="Thời gian sử dụng (năm)">
          <el-input
            :value="formData.useful_life ? `${formData.useful_life} năm` : 'Chưa có'"
            disabled
            placeholder="Tự động từ loại tài sản"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('assets.depreciationRateLabel')">
          <el-input
            :value="formData.depreciation_rate != null ? `${formData.depreciation_rate}%` : 'Chưa có'"
            disabled
            placeholder="Tự động từ loại tài sản"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="$t('assets.hasDepreciation')">
          <el-input
            :value="formData.is_depreciable ? 'Có' : 'Không'"
            disabled
            placeholder="Tự động từ loại tài sản"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Thông tin cơ bản -->
    <el-divider content-position="left">
      <el-icon><Document /></el-icon> Thông tin tài sản
    </el-divider>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item
          :label="$t('assets.assetCode')"
          prop="asset_code"
        >
          <el-input
            :model-value="'Tự động'"
            disabled
          />
        </el-form-item>
      </el-col>
      <el-col :span="16">
        <el-form-item
          :label="$t('assets.assetName')"
          prop="name"
        >
          <el-input
            v-model="formData.name"
            :placeholder="$t('assets.assetName')"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item
          label="Ngày mua"
          prop="purchase_date"
        >
          <el-date-picker
            v-model="formData.purchase_date"
            type="date"
            placeholder="Chọn ngày mua"
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            @change="handlePurchaseDateChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item
          label="Năm đưa vào sử dụng"
          prop="year_in_use"
        >
          <el-tooltip
            :content="formData.purchase_date ? 'Tự động từ ngày mua' : 'Nhập năm hoặc chọn ngày mua để tự động'"
            placement="top"
          >
            <el-input-number
              v-model="formData.year_in_use"
              :min="1990"
              :max="2100"
              :placeholder="formData.purchase_date ? 'Tự động từ ngày mua' : 'VD: 2024'"
              :disabled="!!formData.purchase_date"
              style="width: 100%"
              controls-position="right"
              @change="calculateResidualValue"
            />
          </el-tooltip>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item
          label="Số lượng"
          prop="quantity"
        >
          <el-input-number
            v-model="formData.quantity"
            :min="1"
            :max="isAreaUnit ? 1000000 : 1"
            :disabled="!isAreaUnit"
            :placeholder="isAreaUnit ? 'Nhập số lượng (m²)' : '1'"
            style="width: 100%"
            controls-position="right"
          />
          <div
            v-if="isAreaUnit"
            style="margin-top: 4px; font-size: 12px; color: #909399;"
          >
            Đơn vị tính là m², vui lòng nhập diện tích cụ thể.
          </div>
          <div
            v-else
            style="margin-top: 4px; font-size: 12px; color: #909399;"
          >
            Đơn vị tính theo cái/bộ, số lượng mặc định là 1.
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item
          :label="$t('common.status')"
          prop="status"
        >
          <el-select
            v-model="formData.status"
            :placeholder="$t('common.status')"
            style="width: 100%"
          >
            <el-option
              v-for="s in statuses"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item
          :label="$t('assets.department')"
          prop="current_department_id"
        >
          <DepartmentTreeSelect
            v-model="formData.current_department_id"
            :placeholder="$t('assets.department')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item
          :label="$t('assets.location')"
          prop="location"
        >
          <el-input
            v-model="formData.location"
            :placeholder="$t('assets.locationPlaceholder')"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Giá trị tài sản -->
    <el-divider content-position="left">
      <el-icon><Money /></el-icon> Chỉ tiêu về giá trị
    </el-divider>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="Nguyên giá (đồng)">
          <el-input-number
            v-model="formData.purchase_price"
            :min="0"
            :precision="0"
            :formatter="(value: any) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
            :parser="(value: any) => value.replace(/\$\s?|(,*)/g, '')"
            placeholder="0"
            style="width: 100%"
            :controls="false"
            @change="handlePurchasePriceChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Giá trị còn lại (đồng)">
          <el-tooltip
            content="Tự động tính từ nguyên giá"
            placement="top"
          >
            <el-input-number
              v-model="formData.residual_value"
              :min="0"
              :precision="0"
              placeholder="Tự động tính"
              style="width: 100%"
              :controls="false"
              disabled
            />
          </el-tooltip>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item
          label="Tình trạng tài sản"
          prop="asset_condition"
        >
          <el-select
            v-model="formData.asset_condition"
            placeholder="Chọn tình trạng"
            style="width: 100%"
          >
            <el-option
              v-for="opt in assetConditionOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item
          :label="$t('assets.serialNumber')"
          prop="serial_number"
        >
          <el-input
            v-model="formData.serial_number"
            :placeholder="$t('assets.serialNumber')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item
          label="Tài sản trên đất (số lô)"
          prop="land_parcel_id"
        >
          <el-input-number
            v-model="formData.land_parcel_id"
            :min="0"
            placeholder="VD: 1, 2, 3..."
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item
      label="Ghi chú"
      prop="description"
    >
      <el-input
        v-model="formData.description"
        type="textarea"
        :rows="2"
        placeholder="Ghi chú thêm về tài sản..."
      />
    </el-form-item>

    <div
      v-if="showActions"
      class="inline-actions"
    >
      <el-button @click="handleCancel">
        Hủy
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="handleSave"
      >
        Lưu tài sản
      </el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules, CascaderProps } from '@/types/element-plus';
import { ElMessage } from 'element-plus';
import { Files, Document, Money } from '@element-plus/icons-vue';
import { assetCategoryService, type AssetCategory } from '@/services/assetCategory.service';
import { useDepartments } from '@/composables/useDepartments';
import DepartmentTreeSelect from '@/components/Departments/DepartmentTreeSelect.vue';
import { useAssetConditionOptions } from '@/composables/useAssetConditions';

const props = defineProps<{
  modelValue: any;
  loading?: boolean;
  showActions?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: any): void;
  (e: 'save', v: any): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();

const formRef = ref<FormInstance>();
const loading = computed(() => !!props.loading);

useDepartments();
const { assetConditionOptions } = useAssetConditionOptions();

const categories = ref<AssetCategory[]>([]);
const categoryTree = ref<any[]>([]);
const selectedCategory = ref<string[]>([]);
const loadingCategories = ref(false);

const formData = reactive({
  asset_code: '',
  name: '',
  category: '',
  category_id: null as number | null,
  category_code: '',
  unit: '',
  asset_type: '',
  status: 'active',
  current_department_id: null as number | null,
  location: '',
  purchase_date: '',
  purchase_price: null as number | null,
  residual_value: null as number | null,
  serial_number: '',
  warranty_date: '',
  description: '',
  year_in_use: null as number | null,
  quantity: 1,
  asset_condition: 'good',
  land_parcel_id: null as number | null,
  is_depreciable: true,
  depreciation_rate: null as number | null,
  useful_life: null as number | null,
});

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(formData, {
      asset_code: '',
      name: val?.name || '',
      category: val?.category || '',
      category_id: val?.category_id ?? null,
      category_code: val?.category_code || '',
      unit: val?.unit || '',
      asset_type: val?.asset_type || '',
      status: val?.status || 'active',
      current_department_id: val?.current_department_id ?? null,
      location: val?.location || '',
      purchase_date: val?.purchase_date || '',
      purchase_price: val?.purchase_price ?? null,
      residual_value: val?.residual_value ?? null,
      serial_number: val?.serial_number || '',
      warranty_date: val?.warranty_date || '',
      description: val?.description || '',
      year_in_use: val?.year_in_use ?? null,
      quantity: val?.quantity ?? 1,
      asset_condition: val?.asset_condition || 'good',
      land_parcel_id: val?.land_parcel_id ?? null,
      is_depreciable: val?.is_depreciable ?? true,
      depreciation_rate: val?.depreciation_rate ?? null,
      useful_life: val?.useful_life ?? null,
    });

    if (val?.category_code) selectedCategory.value = [val.category_code];
    else selectedCategory.value = [];
  },
  { immediate: true, deep: true }
);

watch(
  () => ({ ...formData }),
  () => {
    emit('update:modelValue', { ...formData });
  },
  { deep: true }
);

const isAreaUnit = computed(() => {
  if (!formData.unit) return false;
  const normalized = String(formData.unit).toLowerCase();
  return normalized.includes('m2') || normalized.includes('m\u00b2');
});

const cascaderProps: CascaderProps = {
  value: 'code',
  label: 'name',
  children: 'children',
  emitPath: true,
  checkStrictly: true,
  expandTrigger: 'hover',
};

const statuses = computed(() => [
  { value: 'active', label: t('assets.status.active') },
  { value: 'inactive', label: t('assets.status.inactive') },
  { value: 'damaged', label: t('assets.status.damaged') },
  { value: 'lost', label: t('assets.status.lost') },
  { value: 'disposed', label: t('assets.status.disposed') },
]);

const rules = computed<FormRules>(() => ({
  // In tăng tài sản (Option B), asset_code is auto and not editable
  name: [{ required: true, message: t('validation.required'), trigger: 'blur' }],
  category_id: [{ required: true, message: 'Vui lòng chọn loại tài sản', trigger: 'change' }],
  status: [{ required: true, message: t('validation.required'), trigger: 'change' }],
  current_department_id: [{ required: true, message: 'Vui lòng chọn phòng ban', trigger: 'change' }],
  purchase_date: [{ required: true, message: 'Vui lòng chọn ngày mua', trigger: 'change' }],
  quantity: [
    {
      required: isAreaUnit.value,
      message: 'Vui lòng nhập số lượng khi đơn vị tính là m²',
      trigger: 'change',
    },
    {
      type: 'number',
      min: 1,
      message: 'Số lượng phải lớn hơn hoặc bằng 1',
      trigger: 'change',
    },
  ],
}));

const flattenTree = (nodes: any[]): AssetCategory[] => {
  const result: AssetCategory[] = [];
  const traverse = (nodeList: any[]) => {
    nodeList.forEach((node) => {
      result.push({
        id: node.id,
        code: node.code,
        name: node.name,
        parent_code: node.parent_code,
        unit: node.unit,
        category_group: node.category_group,
        is_depreciable: node.is_depreciable,
        depreciation_rate: node.depreciation_rate,
        useful_life_years: node.useful_life_years,
        description: node.description,
        is_active: node.is_active ?? true,
        sort_order: node.sort_order ?? 0,
      } as any);
      if (node.children && node.children.length > 0) traverse(node.children);
    });
  };
  traverse(nodes);
  return result;
};

const buildCategoryTree = (items: AssetCategory[]): any[] => {
  const map = new Map<string, any>();
  const roots: any[] = [];

  items.forEach((item) => {
    map.set(item.code, {
      ...item,
      value: item.code,
      label: `${item.code} - ${item.name}`,
      children: [],
    });
  });

  items.forEach((item) => {
    const node = map.get(item.code);
    if (item.parent_code && map.has(item.parent_code)) {
      const parent = map.get(item.parent_code);
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortTree = (nodes: any[]) => {
    nodes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    nodes.forEach((n) => {
      if (n.children && n.children.length > 0) sortTree(n.children);
      else delete n.children;
    });
  };
  sortTree(roots);

  return roots;
};

const findCategoryByCode = (code: string): AssetCategory | undefined => categories.value.find((c) => c.code === code);

const handleCategoryChange = async (value: string[]) => {
  if (!value || value.length === 0) {
    formData.category_id = null;
    formData.category_code = '';
    formData.unit = '';
    formData.is_depreciable = true;
    formData.depreciation_rate = null;
    formData.useful_life = null;
    return;
  }

  const selectedCode = value[value.length - 1];
  const category = findCategoryByCode(selectedCode);
  if (category) {
    formData.category_id = category.id;
    formData.category_code = category.code;
    formData.category = category.name;
    formData.unit = category.unit;
    formData.is_depreciable = category.is_depreciable;

    if (category.is_depreciable) {
      formData.depreciation_rate = category.depreciation_rate ?? null;
      formData.useful_life = category.useful_life_years ?? null;
    } else {
      formData.depreciation_rate = null;
      formData.useful_life = null;
    }

    await nextTick();
    calculateResidualValue();
  }
};

const calculateResidualValue = () => {
  const purchasePrice = formData.purchase_price;
  const yearInUse = formData.year_in_use;
  const usefulLife = formData.useful_life;

  if (!purchasePrice || purchasePrice <= 0) {
    formData.residual_value = null;
    return;
  }

  if (!yearInUse || !usefulLife || usefulLife <= 0) {
    formData.residual_value = purchasePrice;
    return;
  }

  const currentYear = new Date().getFullYear();
  const yearsUsed = Math.max(0, currentYear - yearInUse);

  if (yearsUsed <= 0) {
    formData.residual_value = purchasePrice;
    return;
  }

  const annualDepreciation = Math.round(purchasePrice / usefulLife);
  const accumulatedDepreciation = Math.min(annualDepreciation * yearsUsed, purchasePrice);
  const residualValue = Math.max(0, purchasePrice - accumulatedDepreciation);

  formData.residual_value = Math.round(residualValue);
};

const handlePurchasePriceChange = () => {
  calculateResidualValue();
};

const handlePurchaseDateChange = (value: string | null) => {
  if (value) {
    const year = new Date(value).getFullYear();
    formData.year_in_use = year;
  }
  calculateResidualValue();
};

const fetchCategories = async () => {
  loadingCategories.value = true;
  try {
    try {
      const treeResponse = await assetCategoryService.getTree();
      if (treeResponse.data && treeResponse.data.length > 0) {
        categories.value = flattenTree(treeResponse.data);
        const transformTree = (nodes: any[]): any[] =>
          nodes.map((node) => ({
            ...node,
            value: node.code,
            label: `${node.code} - ${node.name}`,
            children: node.children && node.children.length > 0 ? transformTree(node.children) : undefined,
          }));
        categoryTree.value = transformTree(treeResponse.data);
      } else {
        throw new Error('Tree API returned empty');
      }
    } catch {
      const response = await assetCategoryService.getAll();
      categories.value = response.data;
      categoryTree.value = buildCategoryTree(response.data);
    }
  } catch {
    ElMessage.error('Không thể tải danh mục tài sản');
  } finally {
    loadingCategories.value = false;
  }
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid: boolean) => {
    if (!valid) return;
    emit('save', { ...formData });
  });
};

const handleCancel = () => {
  formRef.value?.resetFields();
  emit('cancel');
};

watch(
  () => formData.year_in_use,
  () => calculateResidualValue()
);
watch(
  () => formData.depreciation_rate,
  () => calculateResidualValue()
);

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.inline-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

:deep(.el-divider__text) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
}

:deep(.el-cascader) {
  width: 100%;
}
</style>
