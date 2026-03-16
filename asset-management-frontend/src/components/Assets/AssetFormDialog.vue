<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? $t('assets.editAsset') : $t('assets.addAsset')"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
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
              v-model="formData.asset_code"
              placeholder="Tự động sinh hoặc nhập tay"
            >
              <template #append>
                <el-button
                  :icon="Refresh"
                  :disabled="!formData.category_code"
                  title="Sinh mã tự động"
                  @click="generateAssetCode"
                />
              </template>
            </el-input>
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
            <el-select 
              v-model="formData.current_department_id" 
              v-loading="departmentsLoading" 
              :placeholder="$t('assets.department')" 
              style="width: 100%"
              clearable
              filterable
            >
              <el-option
                v-for="dept in departments"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
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

      <!-- QR Code Section (chỉ hiển thị khi edit) -->
      <el-divider
        v-if="isEdit && props.asset?.id"
        content-position="left"
      >
        <el-icon><Document /></el-icon> Mã QR Code
      </el-divider>

      <div
        v-if="isEdit && props.asset?.id"
        class="qrcode-section"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="qrcode-display">
              <div
                v-if="qrCodeImage"
                class="qrcode-image-container"
              >
                <img
                  :src="qrCodeImage"
                  alt="QR Code"
                  class="qrcode-image"
                >
                <div class="qrcode-info">
                  <p><strong>Mã tài sản:</strong> {{ formData.asset_code }}</p>
                  <p><strong>Tên:</strong> {{ formData.name }}</p>
                  <p><strong>Loại:</strong> {{ formData.category_code || 'Chưa phân loại' }}</p>
                  <p>
                    <strong>Số lượng:</strong>
                    {{ formData.quantity || 1 }}{{ formData.unit ? ` ${formData.unit}` : '' }}
                  </p>
                </div>
              </div>
              <div
                v-else
                class="qrcode-placeholder"
              >
                <el-icon class="qrcode-icon">
                  <Document />
                </el-icon>
                <p>Chưa có QR code</p>
                <el-button
                  type="primary"
                  :loading="generatingQR"
                  size="small"
                  @click="generateQRCode"
                >
                  <el-icon><Refresh /></el-icon>
                  Tạo QR Code
                </el-button>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="qrcode-actions">
              <el-button
                v-if="qrCodeImage"
                type="success"
                :icon="Download"
                block
                @click="downloadQRCode"
              >
                Tải QR Code
              </el-button>
              <el-button
                type="primary"
                :loading="generatingQR"
                :icon="Refresh"
                block
                @click="generateQRCode"
              >
                {{ qrCodeImage ? 'Tạo lại QR Code' : 'Tạo QR Code' }}
              </el-button>
              <el-alert
                type="info"
                :closable="false"
                show-icon
                style="margin-top: 12px"
              >
                <template #default>
                  <div style="font-size: 12px">
                    QR code chứa thông tin: mã tài sản, tên, loại, đơn vị tính và số lượng.
                    Sử dụng để quét nhanh khi kiểm kê.
                  </div>
                </template>
              </el-alert>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ $t('common.save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules, CascaderProps } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Files, Document, Money, Refresh, Download } from '@element-plus/icons-vue';
import api from '@/services/api';
import { assetCategoryService, type AssetCategory } from '@/services/assetCategory.service';
import { useDepartments } from '@/composables/useDepartments';
import { assetService } from '@/services/asset.service';
import { useAssetConditionOptions } from '@/composables/useAssetConditions';

const props = defineProps<{
  visible: boolean;
  asset?: any;
  isEmbedded?: boolean; // If true, emits 'save' with data instead of calling API
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void; // For standalone mode
  (e: 'save', data: any): void; // For embedded mode
}>();

const { t } = useI18n();
const formRef = ref<FormInstance>();
const loading = ref(false);

// Sử dụng composable cho departments - tự động load và cache
const { activeDepartments: departments, isLoading: departmentsLoading } = useDepartments();

// Debug: Log departments để kiểm tra
watch(departments, (newVal) => {
  console.log('🏢 Departments loaded:', newVal?.length || 0, newVal);
}, { immediate: true });

const categories = ref<AssetCategory[]>([]);
const { assetConditionOptions } = useAssetConditionOptions();
const categoryTree = ref<any[]>([]);
const selectedCategory = ref<string[]>([]);
const loadingCategories = ref(false);
const generatingQR = ref(false);
const qrCodeImage = ref<string | null>(null);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isEdit = computed(() => !!props.asset?.id);

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

// Xác định tài sản có đơn vị tính là m2/m² không
const isAreaUnit = computed(() => {
  if (!formData.unit) return false;
  const normalized = formData.unit.toLowerCase();
  return normalized.includes('m2') || normalized.includes('m\u00b2');
});

// Cascader props for category tree
const cascaderProps: CascaderProps = {
  value: 'code',
  label: 'name',
  children: 'children',
  emitPath: true,
  checkStrictly: true, // Cho phép chọn bất kỳ cấp nào (parent hoặc leaf)
  expandTrigger: 'hover', // Mở rộng khi hover
};

const statuses = computed(() => [
  { value: 'active', label: t('assets.status.active') },
  { value: 'inactive', label: t('assets.status.inactive') },
  { value: 'damaged', label: t('assets.status.damaged') },
  { value: 'lost', label: t('assets.status.lost') },
  { value: 'disposed', label: t('assets.status.disposed') },
]);

const rules = computed<FormRules>(() => ({
  asset_code: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
  ],
  name: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
  ],
  category_id: [
    { required: true, message: 'Vui lòng chọn loại tài sản', trigger: 'change' },
  ],
  status: [
    { required: true, message: t('validation.required'), trigger: 'change' },
  ],
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
  // Nguyên giá và giá trị còn lại không bắt buộc
  // Giá trị còn lại sẽ tự động tính từ nguyên giá
}));

// Flatten tree để lấy tất cả categories
const flattenTree = (nodes: any[]): AssetCategory[] => {
  const result: AssetCategory[] = [];
  const traverse = (nodeList: any[]) => {
    nodeList.forEach(node => {
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
      });
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return result;
};

// Build category tree from flat list (fallback nếu API tree không hoạt động)
const buildCategoryTree = (items: AssetCategory[]): any[] => {
  const map = new Map<string, any>();
  const roots: any[] = [];

  // Create nodes với label hiển thị mã và tên
  items.forEach(item => {
    map.set(item.code, {
      ...item,
      value: item.code,
      label: `${item.code} - ${item.name}`,
      children: [],
    });
  });

  // Build tree
  items.forEach(item => {
    const node = map.get(item.code);
    if (item.parent_code && map.has(item.parent_code)) {
      const parent = map.get(item.parent_code);
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sắp xếp theo sort_order
  const sortTree = (nodes: any[]) => {
    nodes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children);
      } else {
        delete node.children; // Xóa children rỗng
      }
    });
  };
  sortTree(roots);

  return roots;
};

// Tìm category từ tree hoặc flat list
const findCategoryByCode = (code: string): AssetCategory | undefined => {
  // Tìm trong danh sách phẳng trước
  let category = categories.value.find(c => c.code === code);
  
  // Nếu không tìm thấy, tìm trong tree
  if (!category && categoryTree.value.length > 0) {
    const findInTree = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node.code === code) {
          return node;
        }
        if (node.children && node.children.length > 0) {
          const found = findInTree(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    const treeNode = findInTree(categoryTree.value);
    if (treeNode) {
      category = {
        id: treeNode.id,
        code: treeNode.code,
        name: treeNode.name,
        parent_code: treeNode.parent_code,
        unit: treeNode.unit,
        category_group: treeNode.category_group,
        is_depreciable: treeNode.is_depreciable,
        depreciation_rate: treeNode.depreciation_rate,
        useful_life_years: treeNode.useful_life_years,
        description: treeNode.description,
        is_active: treeNode.is_active ?? true,
        sort_order: treeNode.sort_order ?? 0,
      };
    }
  }
  
  return category;
};

// Handle category selection
const handleCategoryChange = async (value: string[]) => {
  console.log('🔄 Category change triggered:', value);
  
  if (!value || value.length === 0) {
    formData.category_id = null;
    formData.category_code = '';
    formData.unit = '';
    formData.is_depreciable = true;
    formData.depreciation_rate = null;
    formData.useful_life = null;
    console.log('❌ Category cleared');
    return;
  }

  const selectedCode = value[value.length - 1];
  console.log('🔍 Looking for category with code:', selectedCode);
  console.log('📚 Available categories:', categories.value.length);
  
  const category = findCategoryByCode(selectedCode);
  
  if (category) {
    console.log('✅ Found category:', {
      id: category.id,
      code: category.code,
      name: category.name,
      depreciation_rate: category.depreciation_rate,
      useful_life_years: category.useful_life_years,
      is_depreciable: category.is_depreciable,
    });
    
    // Cập nhật formData
    formData.category_id = category.id;
    formData.category_code = category.code;
    formData.category = category.name;
    formData.unit = category.unit;
    formData.is_depreciable = category.is_depreciable;

    // Chỉ auto-fill thông tin hao mòn khi loại tài sản có hao mòn.
    // Với nhóm không hao mòn (ví dụ: Công cụ dụng cụ), giữ rate/useful_life = null để UI không bị “mặc định cách tính hao mòn”.
    if (category.is_depreciable) {
      formData.depreciation_rate = category.depreciation_rate ?? null;
      formData.useful_life = category.useful_life_years ?? null;
    } else {
      formData.depreciation_rate = null;
      formData.useful_life = null;
    }
    
    console.log('💰 FormData updated:', {
      category_id: formData.category_id,
      depreciation_rate: formData.depreciation_rate,
      useful_life: formData.useful_life,
      is_depreciable: formData.is_depreciable,
    });
    
    // Force reactivity - trigger update
    await nextTick();
    
    // Tự động tính lại giá trị còn lại khi thay đổi loại tài sản
    calculateResidualValue();
  } else {
    console.error('❌ Category not found for code:', selectedCode);
    console.log('Available category codes:', categories.value.map(c => c.code).slice(0, 10));
  }
};

// Tự động tính giá trị còn lại dựa trên hao mòn
// Công thức theo Thông tư 141/2025/TT-BTC:
// - Mức hao mòn hằng năm = Nguyên giá / Thời gian sử dụng (năm)
// - Số hao mòn lũy kế = Mức hao mòn hằng năm × Số năm đã sử dụng
// - Giá trị còn lại = Nguyên giá - Số hao mòn lũy kế
const calculateResidualValue = () => {
  const purchasePrice = formData.purchase_price;
  const yearInUse = formData.year_in_use;
  const usefulLife = formData.useful_life; // Thời gian sử dụng (năm)
  
  if (!purchasePrice || purchasePrice <= 0) {
    formData.residual_value = null;
    return;
  }
  
  // Nếu không có năm đưa vào sử dụng hoặc thời gian sử dụng, giá trị còn lại = nguyên giá
  if (!yearInUse || !usefulLife || usefulLife <= 0) {
    formData.residual_value = purchasePrice;
    return;
  }
  
  const currentYear = new Date().getFullYear();
  const yearsUsed = Math.max(0, currentYear - yearInUse);
  
  // Nếu chưa sử dụng (năm đưa vào sử dụng > năm hiện tại), giá trị còn lại = nguyên giá
  if (yearsUsed <= 0) {
    formData.residual_value = purchasePrice;
    return;
  }
  
  // Tính mức hao mòn hằng năm = Nguyên giá / Thời gian sử dụng
  const annualDepreciation = Math.round(purchasePrice / usefulLife);
  
  // Số hao mòn lũy kế = Mức hao mòn hằng năm × Số năm đã sử dụng (không vượt quá nguyên giá)
  const accumulatedDepreciation = Math.min(annualDepreciation * yearsUsed, purchasePrice);
  
  // Giá trị còn lại = Nguyên giá - Số hao mòn lũy kế (không được âm)
  const residualValue = Math.max(0, purchasePrice - accumulatedDepreciation);
  
  formData.residual_value = Math.round(residualValue);
};

// Tự động tính giá trị còn lại từ nguyên giá
const handlePurchasePriceChange = (_value: number | null) => {
  calculateResidualValue();
};

// Tự động lấy năm đưa vào sử dụng từ ngày mua
const handlePurchaseDateChange = (value: string | null) => {
  if (value) {
    const year = new Date(value).getFullYear();
    formData.year_in_use = year;
    console.log('📅 Purchase date changed:', value, '→ Year:', year);
  } else {
    // Nếu xóa ngày mua, cho phép nhập năm thủ công
    // Không tự động xóa năm đã nhập
  }
  calculateResidualValue();
};

// Generate asset code automatically
const generateAssetCode = async () => {
  if (!formData.category_code) {
    ElMessage.warning('Vui lòng chọn loại tài sản trước');
    return;
  }

  try {
    // Backend sẽ tự động tìm số thứ tự tiếp theo chưa được sử dụng
    const response = await assetCategoryService.generateCode(formData.category_code);
    formData.asset_code = response.data.assetCode;
    ElMessage.success('Đã sinh mã tài sản tự động');
  } catch (error) {
    console.error('Error generating asset code:', error);
    ElMessage.error('Không thể sinh mã tài sản');
  }
};

const fetchCategories = async () => {
  loadingCategories.value = true;
  try {
    // Ưu tiên sử dụng API tree để có cấu trúc đúng
    try {
      const treeResponse = await assetCategoryService.getTree();
      if (treeResponse.data && treeResponse.data.length > 0) {
        console.log('🌳 Tree API response:', treeResponse.data);
        
        // Flatten tree để lưu vào categories.value
        categories.value = flattenTree(treeResponse.data);
        console.log('📋 Flattened categories:', categories.value.length, 'items');
        
        // Chuyển đổi format từ API tree sang format của cascader
        const transformTree = (nodes: any[]): any[] => {
          return nodes.map(node => ({
            ...node,
            value: node.code,
            label: `${node.code} - ${node.name}`,
            children: node.children && node.children.length > 0 ? transformTree(node.children) : undefined,
          }));
        };
        categoryTree.value = transformTree(treeResponse.data);
      } else {
        throw new Error('Tree API returned empty');
      }
    } catch (treeError) {
      // Fallback: sử dụng danh sách phẳng và tự build tree
      console.warn('Tree API failed, using flat list:', treeError);
      const response = await assetCategoryService.getAll();
      categories.value = response.data;
      categoryTree.value = buildCategoryTree(response.data);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    ElMessage.error('Không thể tải danh mục tài sản');
  } finally {
    loadingCategories.value = false;
  }
};

const resetForm = () => {
  formData.asset_code = '';
  formData.name = '';
  formData.category = '';
  formData.category_id = null;
  formData.category_code = '';
  formData.unit = '';
  formData.asset_type = '';
  formData.status = 'active';
  formData.current_department_id = null;
  formData.location = '';
  formData.purchase_date = '';
  formData.purchase_price = null;
  formData.residual_value = null;
  formData.serial_number = '';
  formData.warranty_date = '';
  formData.description = '';
  formData.year_in_use = null;
  formData.quantity = 1;
  formData.asset_condition = 'good';
  formData.land_parcel_id = null;
  formData.is_depreciable = true;
  formData.depreciation_rate = null;
  formData.useful_life = null;
  selectedCategory.value = [];
  qrCodeImage.value = null;
};

const handleClose = () => {
  resetForm();
  formRef.value?.resetFields();
  emit('update:visible', false);
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      const submitData = { ...formData };
      // Remove null values
      Object.keys(submitData).forEach((key) => {
        if (submitData[key as keyof typeof submitData] === null || submitData[key as keyof typeof submitData] === '') {
          delete submitData[key as keyof typeof submitData];
        }
      });

      if (props.isEmbedded) {
        emit('save', submitData);
        handleClose();
        return;
      }

      if (isEdit.value) {
        await api.put(`/assets/${props.asset.id}`, submitData);
        ElMessage.success(t('assets.updateSuccess'));
      } else {
        await api.post('/assets', submitData);
        ElMessage.success(t('assets.createSuccess'));
      }

      emit('success');
      // Reload QR code sau khi update
      if (isEdit.value && props.asset?.id) {
        await loadQRCode();
      }
      handleClose();
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || t('common.error'));
    } finally {
      loading.value = false;
    }
  });
};

// Load QR code khi mở dialog edit
const loadQRCode = async () => {
  if (!props.asset?.id) {
    qrCodeImage.value = null;
    return;
  }

  try {
    const response = await assetService.getQRCode(props.asset.id);
    qrCodeImage.value = response.data.qr_code_image || null;
  } catch (error) {
    console.error('Error loading QR code:', error);
    qrCodeImage.value = null;
  }
};

// Generate QR code
const generateQRCode = async () => {
  if (!props.asset?.id) {
    ElMessage.warning('Vui lòng lưu tài sản trước khi tạo QR code');
    return;
  }

  generatingQR.value = true;
  try {
    const response = await assetService.generateQRCode(props.asset.id);
    qrCodeImage.value = response.data.qr_code_image;
    ElMessage.success('Đã tạo QR code thành công');
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Không thể tạo QR code');
  } finally {
    generatingQR.value = false;
  }
};

// Download QR code (bao gồm thông tin tài sản bên dưới)
const downloadQRCode = async () => {
  if (!qrCodeImage.value) {
    ElMessage.warning('Chưa có QR code để tải');
    return;
  }

  try {
    const qrSize = 300;
    const padding = 16;
    const lineHeight = 22;
    const lines = [
      `Mã TS: ${formData.asset_code || ''}`,
      `Tên: ${formData.name || ''}`,
      `Loại: ${formData.category_code || formData.category || 'Chưa phân loại'}`,
      `Số lượng: ${formData.quantity || 1}${formData.unit ? ' ' + formData.unit : ''}`,
    ];

    const canvas = document.createElement('canvas');
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding + lines.length * lineHeight + padding;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw QR code
    const img = new Image();
    img.src = qrCodeImage.value;
    await new Promise<void>(resolve => { img.onload = () => resolve(); });
    ctx.drawImage(img, padding, padding, qrSize, qrSize);

    // Draw info text below QR
    ctx.fillStyle = '#000000';
    lines.forEach((line, idx) => {
      ctx.font = idx === 0 ? 'bold 15px Arial, sans-serif' : '14px Arial, sans-serif';
      ctx.fillText(line, padding, qrSize + padding + (idx + 1) * lineHeight);
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `QR_${formData.asset_code || 'asset'}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success('Đã tải QR code');
  } catch (error) {
    ElMessage.error('Không thể tải QR code');
  }
};

watch(() => props.visible, async (val) => {
  if (val) {
    // Departments tự động load qua composable
    await fetchCategories();
    
    // Load QR code nếu đang edit
    if (props.asset?.id) {
      await loadQRCode();
    } else {
      qrCodeImage.value = null;
    }
    
    if (props.asset) {
      Object.assign(formData, {
        asset_code: props.asset.asset_code || '',
        name: props.asset.name || '',
        category: props.asset.category || '',
        category_id: props.asset.category_id || null,
        category_code: props.asset.category_code || '',
        unit: props.asset.unit || '',
        asset_type: props.asset.asset_type || '',
        status: props.asset.status || 'active',
        current_department_id: props.asset.current_department_id ?? null,
        location: props.asset.location || '',
        purchase_date: props.asset.purchase_date || '',
        purchase_price: props.asset.purchase_price !== undefined && props.asset.purchase_price !== null ? Number(props.asset.purchase_price) : null,
        residual_value: props.asset.residual_value !== undefined && props.asset.residual_value !== null ? Number(props.asset.residual_value) : null,
        serial_number: props.asset.serial_number || '',
        warranty_date: props.asset.warranty_date || '',
        description: props.asset.description || '',
        year_in_use: props.asset.year_in_use ?? null,
        quantity: props.asset.quantity ?? 1,
        asset_condition: props.asset.asset_condition || 'good',
        land_parcel_id: props.asset.land_parcel_id || null,
        // Load depreciation data từ asset hoặc từ category
        depreciation_rate: props.asset.depreciation_rate !== undefined && props.asset.depreciation_rate !== null ? Number(props.asset.depreciation_rate) : null,
        useful_life: props.asset.useful_life !== undefined && props.asset.useful_life !== null ? Number(props.asset.useful_life) : null,
        is_depreciable: props.asset.is_depreciable !== undefined ? props.asset.is_depreciable : true,
      });
      
      // Set selected category for cascader
      if (props.asset.category_code) {
        selectedCategory.value = [props.asset.category_code];
        
        // Nếu không có depreciation data từ asset, load từ category
        if (!formData.depreciation_rate && !formData.useful_life && props.asset.category_id) {
          const category = findCategoryByCode(props.asset.category_code);
          if (category) {
            formData.depreciation_rate = category.depreciation_rate ?? null;
            formData.useful_life = category.useful_life_years ?? null;
            formData.is_depreciable = category.is_depreciable;
          }
        }
      }
    }
  }
});

// Watch để tự động tính lại giá trị còn lại khi thay đổi năm đưa vào sử dụng
watch(() => formData.year_in_use, () => {
  calculateResidualValue();
});

// Watch để tự động tính lại khi thay đổi tỷ lệ hao mòn (từ category)
watch(() => formData.depreciation_rate, () => {
  calculateResidualValue();
});

onMounted(() => {
  // Departments tự động load qua composable
  fetchCategories();
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

.qrcode-section {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.qrcode-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.qrcode-image-container {
  text-align: center;
}

.qrcode-image {
  width: 200px;
  height: 200px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  padding: 10px;
  background: white;
}

.qrcode-info {
  margin-top: 12px;
  text-align: left;
  font-size: 13px;
  color: #606266;
}

.qrcode-info p {
  margin: 4px 0;
}

.qrcode-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: white;
}

.qrcode-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.qrcode-placeholder p {
  color: #909399;
  margin-bottom: 16px;
}

.qrcode-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
