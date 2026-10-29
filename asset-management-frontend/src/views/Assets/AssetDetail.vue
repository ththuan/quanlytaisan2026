<template>
  <div class="asset-detail-page">
    <div class="page-header">
      <div class="header-left">
        <el-button
          :icon="ArrowLeft"
          class="back-btn"
          @click="$router.back()"
        >
          {{ $t('common.back') }}
        </el-button>
      </div>
      <div class="header-center">
        <h2 class="page-title">
          {{ $t('assets.assetDetail') }}
        </h2>
      </div>
      <div class="header-right">
        <el-tooltip
          v-if="canManageAssets"
          content="Chỉ xóa khi nhập liệu sai, chưa qua quy trình nào"
          placement="bottom"
        >
          <el-button 
            type="danger" 
            :icon="Delete" 
            plain
            @click="handleDelete"
          >
            Xóa (lỗi nhập liệu)
          </el-button>
        </el-tooltip>
        <el-button 
          v-if="canManageAssets" 
          type="primary" 
          :icon="Edit" 
          @click="handleEdit"
        >
          {{ $t('common.edit') }}
        </el-button>
      </div>
    </div>

    <div
      v-if="assetStore.currentAsset"
      v-loading="assetStore.loading"
      class="content-wrapper"
    >
      <!-- Asset Header Card -->
      <el-card
        class="asset-header-card"
        shadow="never"
      >
        <div class="asset-header">
          <div class="asset-icon">
            <el-icon :size="48">
              <Box />
            </el-icon>
          </div>
          <div class="asset-main-info">
            <div class="asset-code">
              {{ assetStore.currentAsset.asset_code }}
            </div>
            <h1 class="asset-name">
              {{ assetStore.currentAsset.name }}
            </h1>
            <div class="asset-meta">
              <el-tag
                :type="getStatusType(assetStore.currentAsset.status)"
                size="large"
                effect="dark"
              >
                {{ assetStatusLabel(assetStore.currentAsset.status) }}
              </el-tag>
              <!-- chỉ giữ một tag hiển thị mã loại + tên -->
              <el-tag
                v-if="assetStore.currentAsset.category_code"
                type="warning"
                size="large"
              >
                {{ assetStore.currentAsset.category_code }}
                <span v-if="assetStore.currentAsset.assetCategory?.name"> - {{ assetStore.currentAsset.assetCategory.name }}</span>
              </el-tag>
              <span
                v-if="assetStore.currentAsset.asset_type"
                class="asset-type"
              >
                {{ assetStore.currentAsset.asset_type }}
              </span>
            </div>
          </div>
        </div>
      </el-card>

      <el-row
        :gutter="20"
        class="detail-cards"
      >
        <!-- Left Column -->
        <el-col
          :xs="24"
          :md="12"
        >
          <!-- Thông tin cơ bản -->
          <el-card
            class="info-card"
            shadow="never"
          >
            <template #header>
              <div class="card-title">
                <el-icon><Document /></el-icon>
                <span>{{ $t('assets.basicInfo') }}</span>
              </div>
            </template>
            <div class="info-grid">
              <div class="info-row">
                <div class="info-label">
                  {{ $t('assets.serialNumber') }}
                </div>
                <div class="info-value">
                  {{ assetStore.currentAsset.serial_number || '-' }}
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">
                  Ngày mua
                </div>
                <div class="info-value">
                  {{ formatDate(assetStore.currentAsset.purchase_date) }}
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">
                  Năm đưa vào sử dụng
                </div>
                <div class="info-value">
                  {{ assetStore.currentAsset.year_in_use || '-' }}
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">
                  Đơn vị tính
                </div>
                <div class="info-value">
                  {{ assetStore.currentAsset.unit || '-' }}
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">
                  Số lượng
                </div>
                <div class="info-value">
                  {{ assetStore.currentAsset.quantity || 1 }}
                  <span v-if="assetStore.currentAsset.unit"> {{ assetStore.currentAsset.unit }}</span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">
                  {{ $t('assets.purchasePrice') }}
                </div>
                <div class="info-value">
                  {{ formatCurrency(assetStore.currentAsset.purchase_price) }}
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">
                  {{ $t('assets.description') }}
                </div>
                <div class="info-value">
                  {{ assetStore.currentAsset.description || '-' }}
                </div>
              </div>
            </div>
          </el-card>

          <!-- Vị trí & Phòng ban -->
          <el-card
            class="info-card"
            shadow="never"
          >
            <template #header>
              <div class="card-title">
                <el-icon><Location /></el-icon>
                <span>{{ $t('assets.locationInfo') }}</span>
              </div>
            </template>
            <div class="info-grid">
              <div class="info-row highlight-row">
                <div class="info-label">
                  {{ $t('assets.department') }}
                </div>
                <div class="info-value">
                  <el-tag
                    type="primary"
                    size="large"
                  >
                    {{ assetStore.currentAsset.current_department?.name || '-' }}
                  </el-tag>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">
                  Người sử dụng
                </div>
                <div class="info-value">
                  <template v-if="assetStore.currentAsset.assigned_user">
                    <span>{{ assetStore.currentAsset.assigned_user.fullname || assetStore.currentAsset.assigned_user.username }}</span>
                    <el-tag
                      v-if="assetStore.currentAsset.assigned_user.job_title"
                      size="small"
                      type="info"
                      style="margin-left: 6px"
                    >
                      {{ assetStore.currentAsset.assigned_user.job_title }}
                    </el-tag>
                  </template>
                  <el-tag
                    v-else
                    size="small"
                    type="info"
                  >
                    Dùng chung
                  </el-tag>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">
                  {{ $t('assets.detailLocation') }}
                </div>
                <div class="info-value">
                  {{ assetStore.currentAsset.location || '-' }}
                </div>
              </div>
            </div>
          </el-card>

          <!-- Lịch sử bàn giao người sử dụng -->
          <el-card
            class="info-card"
            shadow="never"
          >
            <template #header>
              <div class="card-title">
                <el-icon><User /></el-icon>
                <span>Lịch sử bàn giao</span>
              </div>
            </template>
            <div v-loading="loadingAssignmentHistory">
              <el-timeline v-if="assignmentHistory.length > 0">
                <el-timeline-item
                  v-for="item in assignmentHistory"
                  :key="item.id"
                  :timestamp="formatDateTime(item.assigned_at)"
                  type="primary"
                  placement="top"
                >
                  <div class="timeline-event">
                    <div class="timeline-title">
                      <strong>{{ item.to_user ? (item.to_user.fullname || item.to_user.username) : 'Thu hồi về đơn vị' }}</strong>
                      <span v-if="item.to_user?.job_title"> — {{ item.to_user.job_title }}</span>
                    </div>
                    <div class="timeline-description">
                      Từ: {{ item.from_user ? (item.from_user.fullname || item.from_user.username) : 'Chưa gán' }}
                      • Thực hiện: {{ item.assigner ? (item.assigner.fullname || item.assigner.username) : '-' }}
                      <span v-if="item.notes"> • {{ item.notes }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty
                v-else
                description="Chưa có lịch sử bàn giao"
                :image-size="60"
              />
            </div>
          </el-card>

          <!-- QR Code Card - CHỈ admin và tài sản không phải nhà cửa công trình -->
          <el-card
            v-if="authStore.isAdmin && !isBuildingAsset"
            class="info-card qrcode-card"
            shadow="never"
          >
            <template #header>
              <div class="card-title">
                <el-icon><Document /></el-icon>
                <span>Mã QR Code</span>
              </div>
            </template>
            <div
              v-loading="loadingQRCode"
              class="qrcode-content"
            >
              <div
                v-if="qrCodeImage"
                class="qrcode-display"
              >
                <img
                  :src="qrCodeImage"
                  alt="QR Code"
                  class="qrcode-image"
                >
                <div class="qrcode-actions">
                  <el-button
                    type="success"
                    :icon="Download"
                    block
                    @click="downloadQRCode"
                  >
                    Tải QR Code
                  </el-button>
                  <el-button 
                    v-if="canRegenerateQRCode" 
                    type="primary" 
                    :icon="Refresh" 
                    :loading="generatingQR" 
                    :disabled="!canRegenerateQRCode"
                    block
                    @click="generateQRCode"
                  >
                    Tạo lại QR Code
                  </el-button>
                </div>
                <div class="qrcode-info">
                  <p><strong>Mã tài sản:</strong> {{ assetStore.currentAsset?.asset_code }}</p>
                  <p><strong>Tên:</strong> {{ assetStore.currentAsset?.name }}</p>
                  <p><strong>Loại:</strong> {{ assetStore.currentAsset?.category_code || 'Chưa phân loại' }}</p>
                  <p>
                    <strong>Số lượng:</strong>
                    {{ assetStore.currentAsset?.quantity || 1 }}{{ assetStore.currentAsset?.unit ? ` ${assetStore.currentAsset.unit}` : '' }}
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
                  v-if="canRegenerateQRCode" 
                  type="primary" 
                  :loading="generatingQR" 
                  :icon="Refresh"
                  :disabled="!canRegenerateQRCode"
                  @click="generateQRCode"
                >
                  Tạo QR Code
                </el-button>
                <el-alert
                  type="info"
                  :closable="false"
                  show-icon
                  style="margin-top: 12px"
                >
                  <template #default>
                    <div style="font-size: 12px">
                      QR code chứa thông tin tài sản để quét nhanh khi kiểm kê.
                    </div>
                  </template>
                </el-alert>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- Right Column -->
        <el-col
          :xs="24"
          :md="12"
        >
          <!-- Thông tin hao mòn -->
          <el-card
            class="info-card depreciation-card"
            shadow="never"
          >
            <template #header>
              <div class="card-title">
                <el-icon><TrendCharts /></el-icon>
                <span>{{ $t('assets.depreciationInfo') }}</span>
              </div>
            </template>
            <div
              v-if="assetStore.currentAsset.depreciation_info"
              class="depreciation-content"
            >
              <!-- Hiển thị khi tài sản KHÔNG tính hao mòn (công cụ dụng cụ) -->
              <div
                v-if="assetStore.currentAsset.depreciation_info.isDepreciable === false"
                class="non-depreciable-notice"
              >
                <div class="depreciation-values">
                  <div class="value-box primary">
                    <div class="value-label">
                      {{ $t('assets.currentValue') }}
                    </div>
                    <div class="value-amount">
                      {{
                        formatCurrency(
                          toolsRemainingValue(
                            assetStore.currentAsset.depreciation_info
                          )
                        )
                      }}
                    </div>
                  </div>
                  <div
                    v-if="
                      toolsRemainingValue(assetStore.currentAsset.depreciation_info) !==
                        Number(assetStore.currentAsset.depreciation_info?.originalValue)
                    "
                    class="value-box"
                    style="margin-top: 12px;"
                  >
                    <div class="value-label text-muted">
                      {{ $t('assets.purchasePrice') }}
                    </div>
                    <div class="value-amount">
                      {{ formatCurrency(assetStore.currentAsset.depreciation_info.originalValue) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Hiển thị khi tài sản CÓ tính hao mòn -->
              <template v-else>
                <div class="depreciation-summary">
                  <div class="depreciation-item">
                    <div class="dep-label">
                      {{ $t('assets.usefulLife') }}
                    </div>
                    <div class="dep-value">
                      {{ formatNumber(assetStore.currentAsset.depreciation_info.usefulLifeYears || assetStore.currentAsset.depreciation_info.usefulLife) }} {{ $t('common.years') }}
                    </div>
                  </div>
                  <div class="depreciation-item">
                    <div class="dep-label">
                      {{ $t('assets.annualDepreciationRate') }}
                    </div>
                    <div class="dep-value">
                      {{ formatNumber(assetStore.currentAsset.depreciation_info.depreciationRate || assetStore.currentAsset.depreciation_info.annualDepreciationRate) }}%
                    </div>
                  </div>
                  <div class="depreciation-item">
                    <div class="dep-label">
                      {{ $t('assets.yearsUsed') }}
                    </div>
                    <div class="dep-value">
                      {{ formatNumber(assetStore.currentAsset.depreciation_info.yearsUsed) }} {{ $t('common.years') }}
                    </div>
                  </div>
                  <div class="depreciation-item">
                    <div class="dep-label">
                      {{ $t('assets.remainingUsefulLife') }}
                    </div>
                    <div class="dep-value">
                      {{ formatNumber(assetStore.currentAsset.depreciation_info.remainingUsefulLife) }} {{ $t('common.years') }}
                    </div>
                  </div>
                </div>
                
                <div class="depreciation-progress">
                  <div class="progress-header">
                    <span>{{ $t('assets.depreciationProgress') }}</span>
                    <span class="progress-percent">{{ depreciationPercent }}%</span>
                  </div>
                  <el-progress 
                    :percentage="depreciationPercent" 
                    :color="depreciationPercent >= 100 ? '#F56C6C' : '#409EFF'"
                    :stroke-width="12"
                  />
                </div>

                <div class="depreciation-values">
                  <div class="value-box">
                    <div class="value-label">
                      {{ $t('assets.annualDepreciation') }}
                    </div>
                    <div class="value-amount warning">
                      {{ formatCurrency(assetStore.currentAsset.depreciation_info.annualDepreciationAmount) }}/{{ $t('common.year') }}
                    </div>
                  </div>
                  <div class="value-box">
                    <div class="value-label">
                      {{ $t('assets.accumulatedDepreciation') }}
                    </div>
                    <div class="value-amount danger">
                      {{ formatCurrency(assetStore.currentAsset.depreciation_info.accumulatedDepreciation) }}
                    </div>
                  </div>
                  <div class="value-box primary">
                    <div class="value-label">
                      {{ $t('assets.calculatedCurrentValue') }}
                    </div>
                    <div class="value-amount">
                      {{ formatCurrency(calculatedRemainingValue) }}
                    </div>
                  </div>
                </div>

                <el-tag
                  v-if="assetStore.currentAsset.depreciation_info.isFullyDepreciated"
                  type="warning"
                  size="large"
                  class="fully-depreciated-tag"
                >
                  {{ $t('assets.fullyDepreciated') }}
                </el-tag>
              </template>
            </div>
          </el-card>

          <!-- Lịch sử tài sản (hợp nhất: nhập → điều chuyển → kiểm kê → thanh lý) -->
          <el-card
            v-if="timeline.length > 0"
            class="info-card timeline-card"
            shadow="never"
          >
            <template #header>
              <div class="card-title">
                <el-icon><Clock /></el-icon>
                <span>Lịch sử tài sản</span>
              </div>
            </template>
            <div
              v-loading="loadingTimeline"
              class="timeline-content"
            >
              <el-timeline>
                <el-timeline-item
                  v-for="(ev, index) in timeline"
                  :key="index"
                  :timestamp="formatDate(ev.date)"
                  :type="getTimelineType(ev.type)"
                  placement="top"
                >
                  <div class="timeline-event">
                    <div class="timeline-title">
                      <el-icon><component :is="getTimelineIcon(ev.type)" /></el-icon>
                      <span>{{ ev.title }}</span>
                      <el-tag
                        v-if="ev.status"
                        :type="getTimelineStatusType(ev.type, ev.status)"
                        size="small"
                        style="margin-left:8px"
                      >
                        {{ getTimelineStatusText(ev.type, ev.status) }}
                      </el-tag>
                    </div>
                    <div
                      v-if="ev.description"
                      class="timeline-desc"
                    >
                      {{ ev.description }}
                    </div>
                    <div
                      v-if="ev.actor"
                      class="timeline-desc"
                    >
                      Người thực hiện: {{ ev.actor }}
                    </div>
                    <div
                      v-if="ev.reason"
                      class="timeline-desc"
                    >
                      Lý do: {{ ev.reason }}
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-card>

          <!-- Hình ảnh tài sản -->
          <el-card
            class="info-card image-card"
            shadow="never"
            style="margin-top: 20px;"
          >
            <template #header>
              <div class="card-title">
                <el-icon><Picture /></el-icon>
                <span>Hình ảnh tài sản</span>
              </div>
            </template>
            <div class="image-content">
              <ImageZoom
                v-if="assetStore.currentAsset.image_url"
                :zoom-scale="2.2"
                :zoom-on-click="false"
                width="160px"
                height="160px"
                class="asset-image-zoom"
              >
                <el-image
                  :src="getImageUrl(assetStore.currentAsset.image_url)"
                  fit="cover"
                  :preview-src-list="[getImageUrl(assetStore.currentAsset.image_url)]"
                  :preview-teleported="true"
                  hide-on-click-modal
                  class="asset-image-preview"
                />
              </ImageZoom>
              <div
                v-else
                class="image-placeholder-box"
              >
                <el-icon class="image-icon-placeholder">
                  <Picture />
                </el-icon>
                <p>Chưa có hình ảnh</p>
              </div>
              
              <div
                v-if="canManageAssets"
                class="image-actions"
                style="margin-top: 15px;"
              >
                <el-button
                  type="primary"
                  :icon="Camera"
                  :loading="uploadingImage"
                  @click="openCamera"
                >
                  Chụp ảnh
                </el-button>
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="handleImageChange"
                >
                  <el-button
                    :icon="Upload"
                    :loading="uploadingImage"
                  >
                    {{ assetStore.currentAsset.image_url ? 'Cập nhật từ thiết bị' : 'Tải ảnh từ thiết bị' }}
                  </el-button>
                </el-upload>
                <input
                  ref="cameraInputRef"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style="display: none"
                  @change="handleCameraImageSelected"
                >
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Edit Dialog -->
    <AssetFormDialog
      v-model:visible="showEditDialog"
      :asset="assetStore.currentAsset"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAssetStore } from '@/stores/asset.store';
import { useAuthStore } from '@/stores/auth.store';
import { ArrowLeft, Edit, Delete, Document, Location, Box, TrendCharts, Download, Refresh, Picture, Upload, Clock, User, Camera } from '@element-plus/icons-vue';
import AssetFormDialog from '@/components/Assets/AssetFormDialog.vue';
import ImageZoom from '@/components/animate/ImageZoom.vue';
import { assetService } from '@/services/asset.service';
import { ElMessage, ElMessageBox } from 'element-plus';
import moment from 'moment';
import { formatI18nOrRaw } from '@/utils/assetDisplay';

const route = useRoute();
const { t, te } = useI18n();

const assetStatusLabel = (status: string | null | undefined) =>
  formatI18nOrRaw('assets.status', status, t, te);
const router = useRouter();
const assetStore = useAssetStore();
const authStore = useAuthStore();

const showEditDialog = ref(false);
const timeline = ref<any[]>([]);
const loadingTimeline = ref(false);
const assignmentHistory = ref<any[]>([]);
const loadingAssignmentHistory = ref(false);
const qrCodeImage = ref<string | null>(null);
const loadingQRCode = ref(false);
const generatingQR = ref(false);
const uploadingImage = ref(false);

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  // Trả về relative URL nếu là đường dẫn nội bộ (/storage/...)
  // Điều này cho phép đi qua proxy của Vite (giải quyết Mixed Content & CORS)
  if (url.startsWith('/storage/')) {
    return url;
  }
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
  return `${baseUrl}${url}`;
};

const cameraInputRef = ref<HTMLInputElement | null>(null);

const uploadAssetImageFile = async (file: File) => {
  if (!assetStore.currentAsset) return;
  if (!file.type.startsWith('image/')) {
    ElMessage.error('Chỉ hỗ trợ upload file định dạng hình ảnh!');
    return;
  }
  if (file.size / 1024 / 1024 >= 10) {
    ElMessage.error('Dung lượng ảnh không được vượt quá 10MB!');
    return;
  }

  try {
    uploadingImage.value = true;
    await assetService.uploadImage(assetStore.currentAsset.id, file);
    ElMessage.success('Cập nhật hình ảnh thành công');
    await assetStore.fetchAssetById(assetStore.currentAsset.id);
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Lỗi khi cập nhật hình ảnh');
  } finally {
    uploadingImage.value = false;
  }
};

const handleImageChange = async (file: any) => {
  if (!file?.raw) return;
  await uploadAssetImageFile(file.raw);
};

const openCamera = () => cameraInputRef.value?.click();

const handleCameraImageSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    input.value = '';
    return;
  }
  try {
    await uploadAssetImageFile(file);
  } finally {
    // Xóa sau khi upload xong để iOS không làm mất File trước khi gửi.
    input.value = '';
  }
};

// Computed properties
const canManageAssets = computed(() => authStore.isAdmin || authStore.user?.role === 'department_head');

// Kiểm tra xem tài sản có phải là nhà cửa công trình không
const isBuildingAsset = computed(() => {
  if (!assetStore.currentAsset) return false;
  const categoryGroup = assetStore.currentAsset.assetCategory?.category_group;
  return categoryGroup === 'nha_cua';
});

// QR chỉ dành cho admin (xem/tải/tạo lại)
const canRegenerateQRCode = computed(() => {
  return authStore.isAdmin;
});

/** Công cụ dụng cụ: hiển thị remainingValue (GTCL), không nhầm với originalValue (nguyên giá). */
function toolsRemainingValue(info: Record<string, unknown> | null | undefined): number {
  if (!info) return 0;
  const rv = info.remainingValue;
  if (rv !== undefined && rv !== null) return Number(rv);
  return Number(info.originalValue ?? 0);
}

const depreciationPercent = computed(() => {
  const info = assetStore.currentAsset?.depreciation_info;
  if (!info) return 0;
  // Backend returns usefulLifeYears, not usefulLife
  const usefulLife = info.usefulLifeYears || info.usefulLife || 0;
  if (!usefulLife || usefulLife <= 0) return 0;
  if (!info.yearsUsed || isNaN(info.yearsUsed)) return 0;
  const percent = (info.yearsUsed / usefulLife) * 100;
  const result = Math.min(100, Math.round(percent));
  return isNaN(result) ? 0 : result;
});

const calculatedRemainingValue = computed(() => {
  const asset = assetStore.currentAsset;
  if (!asset) return null;

  const info = asset.depreciation_info;
  if (info) {
    if (info.remainingValue !== undefined && info.remainingValue !== null) {
      return Number(info.remainingValue);
    }
    if (info.currentValue !== undefined && info.currentValue !== null) {
      return Number(info.currentValue);
    }
  }

  if (asset.residual_value !== undefined && asset.residual_value !== null) {
    return Number(asset.residual_value);
  }
  if (asset.current_value !== undefined && asset.current_value !== null) {
    return Number(asset.current_value);
  }

  return null;
});

onMounted(async () => {
  const id = parseInt(route.params.id as string);
  const asset = await assetStore.fetchAssetById(id);
  if (!asset) return;
  await Promise.all([loadTimeline(id), loadAssignmentHistory(id)]);
  const categoryGroup = assetStore.currentAsset?.assetCategory?.category_group;
  if (authStore.isAdmin && categoryGroup !== 'nha_cua') {
    await loadQRCode(id);
  }
});

const loadAssignmentHistory = async (assetId: number) => {
  loadingAssignmentHistory.value = true;
  try {
    const response: any = await assetService.getAssignmentHistory(assetId);
    assignmentHistory.value = response?.data || [];
  } catch {
    assignmentHistory.value = [];
  } finally {
    loadingAssignmentHistory.value = false;
  }
};

const loadTimeline = async (assetId: number) => {
  loadingTimeline.value = true;
  try {
    const response: any = await assetService.getTimeline(assetId);
    timeline.value = response?.data || [];
  } catch (error) {
    console.error('Error loading asset timeline:', error);
    timeline.value = [];
  } finally {
    loadingTimeline.value = false;
  }
};

const getTimelineType = (type: string) => {
  const map: Record<string, string> = {
    created: 'info',
    transfer: 'primary',
    inventory: 'warning',
    disposal: 'danger',
  };
  return (map[type] || 'info') as any;
};

const getTimelineStatusType = (type: string, status: string) => {
  const map: Record<string, Record<string, string>> = {
    transfer: { pending: 'warning', approved: 'success', completed: 'success', rejected: 'danger', approved_by_head: 'success', rejected_by_head: 'danger' },
    inventory: { draft: 'info', pending: 'warning', approved_by_head: 'primary', approved_by_admin: 'success', completed: 'success', rejected_by_head: 'danger', rejected_by_admin: 'danger' },
    disposal: { pending: 'warning', completed: 'success', cancelled: 'info' },
  };
  return (map[type]?.[status] || 'info') as any;
};

const getTimelineStatusText = (type: string, status: string) => {
  const map: Record<string, Record<string, string>> = {
    transfer: { pending: 'Chờ xử lý', approved: 'Đã duyệt', completed: 'Hoàn thành', rejected: 'Từ chối', approved_by_head: 'Trưởng đơn vị duyệt', rejected_by_head: 'Trưởng đơn vị từ chối' },
    inventory: { draft: 'Nháp', pending: 'Chờ duyệt', approved_by_head: 'Trưởng đơn vị duyệt', approved_by_admin: 'Admin duyệt', completed: 'Hoàn thành', rejected_by_head: 'Trưởng đơn vị từ chối', rejected_by_admin: 'Admin từ chối' },
    disposal: { pending: 'Chờ xử lý', completed: 'Hoàn thành', cancelled: 'Đã hủy' },
  };
  return map[type]?.[status] || status;
};

const getTimelineIcon = (type: string) => {
  const map: Record<string, any> = {
    created: Upload,
    transfer: Refresh,
    inventory: Box,
    disposal: Delete,
  };
  return map[type] || Document;
};

const handleEdit = () => {
  showEditDialog.value = true;
};

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const handleDelete = async () => {
  if (!assetStore.currentAsset?.id) return;

  const asset = assetStore.currentAsset;
  try {
    await ElMessageBox.confirm(
      `<b>Chỉ xóa khi nhập sai thông tin và chưa qua bất kỳ quy trình nào.</b><br/><br/>` +
      `• Tài sản đã điều chuyển, bảo trì, kiểm kê hoặc thanh lý <b>không thể xóa</b>.<br/>` +
      `• Để loại bỏ tài sản khỏi đơn vị, hãy dùng module <b>Thanh lý / Tiêu hủy</b>.<br/><br/>` +
      `Bạn chắc chắn muốn xóa <b>${escapeHtml(asset.name)}</b> (${escapeHtml(asset.asset_code)})?`,
      'Xóa tài sản – Đọc kỹ trước khi xác nhận',
      {
        confirmButtonText: 'Xác nhận xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonClass: 'el-button--danger',
      }
    );

    await assetStore.deleteAsset(asset.id);
    ElMessage.success('Xóa tài sản thành công');
    router.push('/assets');
  } catch (error: any) {
    if (error && error !== 'cancel' && typeof error === 'object' && error?.response) {
      const msg = error?.response?.data?.message || error?.message || 'Lỗi không xác định';
      ElMessage.error(msg);
    }
    // càncél dialog: im lặng
  }
};

const handleSaved = async () => {
  // Reload asset data after saving
  const id = parseInt(route.params.id as string);
  await assetStore.fetchAssetById(id);
  // Chỉ load QR code nếu không phải nhà cửa công trình
  const categoryGroup = assetStore.currentAsset?.assetCategory?.category_group;
  if (categoryGroup !== 'nha_cua') {
    await loadQRCode(id);
  }
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    damaged: 'warning',
    lost: 'danger',
    disposed: '',
  };
  return types[status] || '';
};

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined) return '-';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '-';
  return numericValue.toLocaleString('vi-VN');
};

const formatDate = (date?: string) => {
  if (!date) return '-';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (date?: string) => {
  if (!date) return '-';
  return moment(date).format('DD/MM/YYYY HH:mm');
};

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return Number(value).toLocaleString('vi-VN');
};

// QR Code Functions
const loadQRCode = async (assetId: number) => {
  loadingQRCode.value = true;
  try {
    const response = await assetService.getQRCode(assetId);
    qrCodeImage.value = response.data?.qr_code_image || null;
  } catch (error) {
    console.error('Error loading QR code:', error);
    qrCodeImage.value = null;
  } finally {
    loadingQRCode.value = false;
  }
};

const generateQRCode = async () => {
  if (!assetStore.currentAsset?.id) {
    ElMessage.warning('Không tìm thấy tài sản');
    return;
  }

  generatingQR.value = true;
  try {
    const response = await assetService.generateQRCode(assetStore.currentAsset.id);
    qrCodeImage.value = response.data?.qr_code_image || null;
    ElMessage.success('Đã tạo QR code thành công');
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Không thể tạo QR code');
  } finally {
    generatingQR.value = false;
  }
};

const downloadQRCode = () => {
  if (!qrCodeImage.value) {
    ElMessage.warning('Chưa có QR code để tải');
    return;
  }

  try {
    const asset = assetStore.currentAsset;
    const qrSize = 300;
    const padding = 16;
    const lineHeight = 22;
    const lines = [
      `Mã TS: ${asset?.asset_code || ''}`,
      `Tên: ${asset?.name || ''}`,
      `SL: ${asset?.quantity || 1}${asset?.unit ? ' ' + asset.unit : ''}`,
      ...(asset?.year_in_use ? [`Năm SD: ${asset.year_in_use}`] : []),
    ];

    const canvas = document.createElement('canvas');
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding + lines.length * lineHeight + padding;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.src = qrCodeImage.value;
    img.onload = () => {
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      ctx.fillStyle = '#000000';
      lines.forEach((line, idx) => {
        ctx.font = idx === 0 ? 'bold 14px Arial, sans-serif' : '13px Arial, sans-serif';
        ctx.fillText(line, padding, qrSize + padding + (idx + 1) * lineHeight);
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `QR_${asset?.asset_code || 'asset'}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      ElMessage.success('Đã tải QR code');
    };
    img.onerror = () => ElMessage.error('Không thể tải QR code');
  } catch (error) {
    ElMessage.error('Không thể tải QR code');
  }
};
</script>

<style scoped>
.asset-detail-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
  min-height: calc(100dvh - 60px);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-left, .header-right {
  flex: 1;
}

.header-right {
  text-align: right;
}

.header-center {
  flex: 2;
  text-align: center;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.back-btn {
  font-weight: 500;
}

.content-wrapper {
  max-width: min(1600px, 100%);
  margin: 0 auto;
}

/* Asset Header Card */
.asset-header-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
}

.asset-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.asset-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.asset-main-info {
  flex: 1;
}

.asset-code {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 4px;
}

.asset-name {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.asset-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.asset-type {
  color: #6b7280;
  font-size: 14px;
}

.asset-value-box {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 20px 32px;
  border-radius: 12px;
  text-align: center;
  color: #fff;
}

.value-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.value-amount {
  font-size: 24px;
  font-weight: 700;
}

/* Info Cards */
.detail-cards {
  margin-top: 20px;
}

.info-card {
  border-radius: 12px;
  border: none;
  margin-bottom: 20px;
}

.info-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.info-card :deep(.el-card__body) {
  padding: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.card-title .el-icon {
  color: #6366f1;
  font-size: 20px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.highlight-row {
  background: #f0f9ff;
  margin: -8px -12px;
  padding: 16px 12px;
  border-radius: 8px;
  border-bottom: none !important;
}

.info-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
}

.warranty-tag {
  margin-left: 8px;
}

/* Finance Card */
.finance-grid {
  display: flex;
  gap: 16px;
}

.finance-item {
  flex: 1;
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.finance-item.primary {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.finance-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.finance-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.finance-value.danger {
  color: #ef4444;
}

.finance-item.primary .finance-value {
  color: #059669;
}

/* Depreciation Card */
.value-label.text-muted {
  color: #909399;
  font-size: 12px;
}

.depreciation-card {
  margin-top: 20px;
}

.depreciation-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.depreciation-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.depreciation-item {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
}

.dep-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.dep-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.depreciation-progress {
  background: #f0f9ff;
  padding: 16px;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
}

.progress-percent {
  color: #6366f1;
  font-weight: 700;
}

.depreciation-values {
  display: flex;
  gap: 12px;
}

.value-box {
  flex: 1;
  background: #f9fafb;
  padding: 14px;
  border-radius: 8px;
  text-align: center;
}

.value-box.primary {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.value-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 6px;
}

.value-amount {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.value-amount.warning {
  color: #f59e0b;
}

.value-amount.danger {
  color: #ef4444;
}

.value-box.primary .value-amount {
  color: #059669;
}

.fully-depreciated-tag {
  align-self: center;
}

/* Transfer History Card */
.transfer-history-card {
  margin-bottom: 20px;
}

.transfer-history-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transfer-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #e5e7eb;
  transition: all 0.3s ease;
}

.transfer-item.latest-transfer {
  background: #f0f9ff;
  border-left-color: #409eff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.transfer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.transfer-date {
  font-size: 12px;
  color: #6b7280;
}

.transfer-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.transfer-path {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.transfer-from {
  color: #ef4444;
  font-size: 14px;
}

.transfer-arrow {
  color: #6b7280;
  font-size: 16px;
}

.transfer-to {
  color: #10b981;
  font-size: 14px;
}

.transfer-reason,
.transfer-requester {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.reason-label,
.requester-label {
  font-weight: 500;
  margin-right: 4px;
}

.reason-text,
.requester-text {
  color: #1f2937;
}

/* Repair History Card */
.repair-history-card {
  margin-bottom: 20px;
}

.timeline-card {
  margin-bottom: 20px;
}

.timeline-content {
  padding: 4px 0;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1e293b;
}

.timeline-desc {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.repair-history-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.repair-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #e5e7eb;
  transition: all 0.3s ease;
}

.repair-item:hover {
  background: #f0f9ff;
  border-left-color: #409eff;
}

.repair-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.repair-date {
  font-size: 12px;
  color: #6b7280;
}

.repair-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-right: 4px;
}

.detail-text {
  font-size: 13px;
  color: #1f2937;
}

.cost-value {
  font-weight: 600;
  color: #e65100;
}

.approval-steps {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.approval-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.approval-text {
  color: #374151;
}

.approval-date {
  color: #9ca3af;
  font-size: 11px;
}

/* QR Code Card */
.qrcode-card {
  margin-bottom: 20px;
}

.qrcode-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.qrcode-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.qrcode-image {
  width: 200px;
  height: 200px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  padding: 10px;
  background: white;
}

.qrcode-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 250px;
}

.qrcode-info {
  width: 100%;
  text-align: left;
  font-size: 13px;
  color: #606266;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
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
  width: 100%;
}

.qrcode-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

/* ─── RESPONSIVE: iPad & Mobile ─────────────────────────── */

/* iPad (landscape ≤ 1279px, portrait ≤ 1024px) */
@media (max-width: 1024px) {
  .asset-detail-page {
    padding: 16px;
  }

  .content-wrapper {
    max-width: 100%;
  }

  .page-header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 16px;
  }

  .header-center {
    flex: 1 1 100%;
    order: -1;
  }

  .header-left, .header-right {
    flex: 0 0 auto;
  }

  .page-title {
    font-size: 17px;
  }

  .finance-grid {
    flex-wrap: wrap;
  }

  .finance-item {
    flex: 1 1 calc(50% - 8px);
    min-width: 120px;
  }
}

/* Mobile (≤ 768px) */
@media (max-width: 768px) {
  .asset-detail-page {
    padding: 12px;
  }

  /* Page header: stack vertically */
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
  }

  .header-center {
    order: 0;
    text-align: left;
    flex: 1 1 100%;
  }

  .header-right {
    text-align: left;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex: 1 1 100%;
  }

  .header-right .el-button {
    flex: 1 1 auto;
  }

  .page-title {
    font-size: 16px;
  }

  /* Asset header: icon + info stack vertically */
  .asset-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  /* Info rows: label/value full width */
  .info-value {
    max-width: 70%;
  }

  /* Finance grid: single column */
  .finance-grid {
    flex-direction: column;
  }

  .finance-item {
    flex: 1 1 100%;
  }

  /* Depreciation summary: single column */
  .depreciation-summary {
    grid-template-columns: 1fr;
  }

  /* Depreciation values: stack vertically */
  .depreciation-values {
    flex-direction: column;
  }

  .value-box {
    flex: 1 1 100%;
  }

  /* Transfer / repair items */
  .transfer-header, .repair-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  /* QR code: smaller */
  .qrcode-image {
    width: 150px;
    height: 150px;
  }
}

.qrcode-placeholder p {
  color: #909399;
  margin-bottom: 16px;
}

/* Asset Image Section */
.image-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
}

.asset-image-zoom {
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

.asset-image-preview {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  cursor: pointer;
}

.image-placeholder-box {
  width: 160px;
  height: 160px;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background: #fafafa;
}

.image-icon-placeholder {
  font-size: 40px;
  color: #dcdfe6;
  margin-bottom: 8px;
}

.image-placeholder-box p {
  color: #909399;
  margin: 0;
  font-size: 13px;
}

.image-actions {
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
