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
          v-if="authStore.isAdmin"
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
          v-if="(authStore.isStaff || authStore.isDepartmentHead) && (assetStore.currentAsset?.status === 'active' || assetStore.currentAsset?.status === 'inactive')" 
          type="danger" 
          :icon="Warning" 
          @click="handleReportDamage"
        >
          Báo hỏng
        </el-button>
        <el-button 
          v-if="authStore.isAdmin" 
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
                  {{ $t('assets.detailLocation') }}
                </div>
                <div class="info-value">
                  {{ assetStore.currentAsset.location || '-' }}
                </div>
              </div>
            </div>
          </el-card>

          <!-- QR Code Card - Chỉ hiển thị cho tài sản không phải nhà cửa công trình -->
          <el-card
            v-if="!isBuildingAsset"
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

          <!-- Lịch sử điều chuyển -->
          <el-card
            v-if="transferHistory.length > 0"
            class="info-card transfer-history-card"
            shadow="never"
          >
            <template #header>
              <div class="card-title">
                <el-icon><Switch /></el-icon>
                <span>Lịch sử điều chuyển</span>
              </div>
            </template>
            <div
              v-loading="loadingHistory"
              class="transfer-history-content"
            >
              <div 
                v-for="(transfer, index) in transferHistory" 
                :key="transfer.id"
                class="transfer-item"
                :class="{ 'latest-transfer': index === 0 }"
              >
                <div class="transfer-header">
                  <el-tag
                    :type="getTransferStatusType(transfer.status)"
                    size="small"
                  >
                    {{ getTransferStatusText(transfer.status) }}
                  </el-tag>
                  <span class="transfer-date">{{ formatDate(transfer.transfer_date || transfer.created_at) }}</span>
                </div>
                <div class="transfer-details">
                  <div class="transfer-path">
                    <span class="transfer-from">{{ transfer.from_department?.name || 'Chưa xác định' }}</span>
                    <el-icon class="transfer-arrow">
                      <ArrowRight />
                    </el-icon>
                    <span class="transfer-to">{{ transfer.to_department?.name || 'Chưa xác định' }}</span>
                  </div>
                  <div
                    v-if="transfer.reason"
                    class="transfer-reason"
                  >
                    <span class="reason-label">Lý do:</span>
                    <span class="reason-text">{{ transfer.reason }}</span>
                  </div>
                  <div
                    v-if="transfer.requester"
                    class="transfer-requester"
                  >
                    <span class="requester-label">Người đề nghị:</span>
                    <span class="requester-text">{{ transfer.requester?.fullname || transfer.requester?.username }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- Lịch sử sửa chữa -->
          <el-card
            v-if="repairHistory.length > 0"
            class="info-card repair-history-card"
            shadow="never"
          >
            <template #header>
              <div class="card-title">
                <el-icon><SetUp /></el-icon>
                <span>Lịch sử sửa chữa</span>
              </div>
            </template>
            <div
              v-loading="loadingRepairHistory"
              class="repair-history-content"
            >
              <div
                v-for="repair in repairHistory"
                :key="repair.id"
                class="repair-item"
              >
                <div class="repair-header">
                  <el-tag
                    :type="getRepairStatusType(repair.status)"
                    size="small"
                  >
                    {{ getRepairStatusText(repair.status) }}
                  </el-tag>
                  <span class="repair-date">{{ formatDate(repair.created_at) }}</span>
                </div>
                <div class="repair-details">
                  <div
                    v-if="repair.description"
                    class="repair-description"
                  >
                    <span class="detail-label">Mô tả hư hỏng:</span>
                    <span class="detail-text">{{ repair.description }}</span>
                  </div>
                  <div
                    v-if="repair.estimated_cost"
                    class="repair-cost"
                  >
                    <span class="detail-label">Chi phí dự kiến:</span>
                    <span class="detail-text cost-value">{{ formatCurrency(Number(repair.estimated_cost)) }}</span>
                  </div>
                  <div
                    v-if="repair.requester"
                    class="repair-requester"
                  >
                    <span class="detail-label">Người đề nghị:</span>
                    <span class="detail-text">{{ repair.requester?.fullname || repair.requester?.username }}</span>
                  </div>
                  <div
                    v-if="repair.assignee"
                    class="repair-assignee"
                  >
                    <span class="detail-label">Người thực hiện:</span>
                    <span class="detail-text">{{ repair.assignee?.fullname || repair.assignee?.username }}</span>
                  </div>
                  <div
                    v-if="repair.start_date || repair.completion_date"
                    class="repair-dates"
                  >
                    <span class="detail-label">Thời gian:</span>
                    <span class="detail-text">
                      <template v-if="repair.start_date">{{ formatDate(repair.start_date) }}</template>
                      <template v-if="repair.start_date && repair.completion_date"> → </template>
                      <template v-if="repair.completion_date">{{ formatDate(repair.completion_date) }}</template>
                    </span>
                  </div>
                  <!-- Tiến trình phê duyệt -->
                  <div
                    v-if="repair.approvals && repair.approvals.length > 0"
                    class="repair-approvals"
                  >
                    <span class="detail-label">Phê duyệt:</span>
                    <div class="approval-steps">
                      <div
                        v-for="(approval, idx) in repair.approvals"
                        :key="idx"
                        class="approval-step"
                      >
                        <el-icon :style="{ color: approval.decision === 'approved' ? '#67c23a' : '#f56c6c' }">
                          <SuccessFilled v-if="approval.decision === 'approved'" />
                          <CircleCloseFilled v-else />
                        </el-icon>
                        <span class="approval-text">
                          {{ getApprovalRoleName(approval.approval_level) }} - {{ approval.approver_name }}
                          <span class="approval-date">({{ formatDate(approval.decided_at) }})</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- Lịch sử thanh lý -->
          <el-card
            v-if="disposalHistory.length > 0"
            class="info-card disposal-history-card"
            shadow="never"
          >
            <template #header>
              <div class="card-title">
                <el-icon><Delete /></el-icon>
                <span>Lịch sử thanh lý / tiêu hủy</span>
              </div>
            </template>
            <div v-loading="loadingDisposalHistory" class="repair-history-content">
              <div
                v-for="dc in disposalHistory"
                :key="dc.id"
                class="repair-item"
              >
                <div class="repair-header">
                  <el-tag :type="getDisposalStatusType(dc.status)" size="small">
                    {{ getDisposalStatusText(dc.status) }}
                  </el-tag>
                  <el-tag type="info" size="small" style="margin-left:6px">
                    {{ dc.disposal_type === 'liquidation' ? 'Thanh lý' : 'Tiêu hủy' }}
                  </el-tag>
                  <span class="repair-date">{{ formatDate(dc.created_at) }}</span>
                </div>
                <div class="repair-details">
                  <div v-if="dc.code" class="repair-description">
                    <span class="detail-label">Mã hồ sơ:</span>
                    <span class="detail-text">{{ dc.code }}</span>
                  </div>
                  <div v-if="dc.decision_no" class="repair-description">
                    <span class="detail-label">Số quyết định:</span>
                    <span class="detail-text">{{ dc.decision_no }}</span>
                  </div>
                  <div v-if="dc.decision_date" class="repair-description">
                    <span class="detail-label">Ngày quyết định:</span>
                    <span class="detail-text">{{ formatDate(dc.decision_date) }}</span>
                  </div>
                  <div v-if="dc.creator" class="repair-requester">
                    <span class="detail-label">Người lập hồ sơ:</span>
                    <span class="detail-text">{{ dc.creator?.fullname || dc.creator?.username }}</span>
                  </div>
                  <div v-if="dc.notes" class="repair-description">
                    <span class="detail-label">Ghi chú:</span>
                    <span class="detail-text">{{ dc.notes }}</span>
                  </div>
                </div>
              </div>
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
              <el-image 
                v-if="assetStore.currentAsset.image_url" 
                :src="getImageUrl(assetStore.currentAsset.image_url)" 
                fit="cover" 
                :preview-src-list="[getImageUrl(assetStore.currentAsset.image_url)]"
                :preview-teleported="true"
                hide-on-click-modal
                class="asset-image-preview"
              />
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
                class="image-actions"
                style="margin-top: 15px;"
              >
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="handleImageChange"
                >
                  <el-button
                    type="primary"
                    :icon="Upload"
                    :loading="uploadingImage"
                  >
                    {{ assetStore.currentAsset.image_url ? 'Cập nhật hình ảnh' : 'Tải lên hình ảnh' }}
                  </el-button>
                </el-upload>
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

    <!-- Report Damage Dialog -->
    <ReportDamageDialog
      v-model:visible="showReportDialog"
      :asset="assetStore.currentAsset"
      @submitted="handleReportSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAssetStore } from '@/stores/asset.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTransferStore } from '@/stores/transfer.store';
import { ArrowLeft, Edit, Delete, Document, Location, Box, TrendCharts, Switch, ArrowRight, Download, Refresh, Warning, Picture, Upload, SetUp, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue';
import AssetFormDialog from '@/components/Assets/AssetFormDialog.vue';
import ReportDamageDialog from '@/components/Assets/ReportDamageDialog.vue';
import { assetService } from '@/services/asset.service';
import assetDisposalService from '@/services/assetDisposal.service';
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
const transferStore = useTransferStore();

const showEditDialog = ref(false);
const showReportDialog = ref(false);
const transferHistory = ref<any[]>([]);
const loadingHistory = ref(false);
const repairHistory = ref<any[]>([]);
const loadingRepairHistory = ref(false);
const disposalHistory = ref<any[]>([]);
const loadingDisposalHistory = ref(false);
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

const handleImageChange = async (file: any) => {
  if (!file || !file.raw) return;
  
  const isImage = file.raw.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('Chỉ hỗ trợ upload file định dạng hình ảnh!');
    return;
  }
  
  const isLt10M = file.raw.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error('Dung lượng ảnh không được vượt quá 10MB!');
    return;
  }

  try {
    uploadingImage.value = true;
    await assetService.uploadImage(assetStore.currentAsset!.id, file.raw);
    ElMessage.success('Cập nhật hình ảnh thành công');
    await assetStore.fetchAssetById(assetStore.currentAsset!.id);
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Lỗi khi cập nhật hình ảnh');
  } finally {
    uploadingImage.value = false;
  }
};

// Computed properties
// Kiểm tra xem tài sản có phải là nhà cửa công trình không
const isBuildingAsset = computed(() => {
  if (!assetStore.currentAsset) return false;
  const categoryGroup = assetStore.currentAsset.assetCategory?.category_group;
  return categoryGroup === 'nha_cua';
});

// Kiểm tra quyền tạo lại QR code (chỉ admin và director)
const canRegenerateQRCode = computed(() => {
  return authStore.isAdmin || authStore.isDirector;
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
  await assetStore.fetchAssetById(id);
  await Promise.all([
    loadTransferHistory(id),
    loadRepairHistory(id),
    loadDisposalHistory(id),
  ]);
  const categoryGroup = assetStore.currentAsset?.assetCategory?.category_group;
  if (categoryGroup !== 'nha_cua') {
    await loadQRCode(id);
  }
});

const loadTransferHistory = async (assetId: number) => {
  loadingHistory.value = true;
  try {
    const history = await transferStore.fetchTransferHistory(assetId);
    transferHistory.value = history || [];
  } catch (error) {
    console.error('Error loading transfer history:', error);
    transferHistory.value = [];
  } finally {
    loadingHistory.value = false;
  }
};

const loadRepairHistory = async (assetId: number) => {
  loadingRepairHistory.value = true;
  try {
    const response: any = await assetService.getRepairHistory(assetId);
    repairHistory.value = response.data || [];
  } catch (error) {
    console.error('Error loading repair history:', error);
    repairHistory.value = [];
  } finally {
    loadingRepairHistory.value = false;
  }
};

const loadDisposalHistory = async (assetId: number) => {
  loadingDisposalHistory.value = true;
  try {
    disposalHistory.value = await assetDisposalService.listByAsset(assetId);
  } catch {
    disposalHistory.value = [];
  } finally {
    loadingDisposalHistory.value = false;
  }
};

const getDisposalStatusType = (status: string) => {
  const map: Record<string, string> = { pending: 'warning', completed: 'success', cancelled: 'info' };
  return (map[status] || 'info') as any;
};

const getDisposalStatusText = (status: string) => {
  const map: Record<string, string> = { pending: 'Chờ xử lý', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
  return map[status] || status;
};

const getRepairStatusType = (status: string) => {
  const map: Record<string, string> = {
    new: 'info',
    pending: 'warning',
    approved_by_head: 'primary',
    approved_by_admin: 'primary',
    approved_by_director: 'success',
    in_progress: 'warning',
    repair_completed: 'info',
    repair_approved: 'success',
    completed: 'success',
    done: 'success',
    rejected_by_head: 'danger',
    rejected_by_admin: 'danger',
    rejected_by_director: 'danger',
  };
  return (map[status] || 'info') as any;
};

const getRepairStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: 'Nháp',
    new: 'Chờ phê duyệt',
    pending: 'Chờ phê duyệt',
    approved_by_head: 'Trưởng Đơn vị đã duyệt',
    approved_by_admin: 'Quản trị viên đã duyệt',
    approved_by_director: 'Giám hiệu đã duyệt',
    in_progress: 'Đang sửa chữa',
    repair_completed: 'Đã sửa xong - Chờ xác nhận',
    repair_approved: 'Xác nhận hoàn thành',
    completed: 'Hoàn thành',
    done: 'Hoàn thành',
    rejected_by_head: 'Trưởng Đơn vị từ chối',
    rejected_by_admin: 'Quản trị viên từ chối',
    rejected_by_director: 'Giám hiệu từ chối',
    rejected_due_to_high_cost: 'Từ chối (chi phí cao)',
  };
  return map[status] || status;
};

const getApprovalRoleName = (level: number) => {
  const map: Record<number, string> = {
    1: 'Trưởng Đơn vị',
    2: 'Quản trị viên',
    3: 'Giám hiệu',
    4: 'Bắt đầu sửa chữa',
    5: 'Báo hoàn thành',
    6: 'Xác nhận hoàn thành',
  };
  return map[level] || `Cấp ${level}`;
};

const handleEdit = () => {
  showEditDialog.value = true;
};

const handleReportDamage = () => {
  showReportDialog.value = true;
};

const handleReportSubmitted = async () => {
  // Reload sau khi báo hỏng
  if (assetStore.currentAsset?.id) {
    await assetStore.fetchAssetById(assetStore.currentAsset.id);
  }
  router.push('/maintenance');
};

const handleDelete = async () => {
  if (!assetStore.currentAsset?.id) return;

  const asset = assetStore.currentAsset;
  try {
    await ElMessageBox.confirm(
      `<b>Chỉ xóa khi nhập sai thông tin và chưa qua bất kỳ quy trình nào.</b><br/><br/>` +
      `• Tài sản đã điều chuyển, bảo trì, kiểm kê hoặc thanh lý <b>không thể xóa</b>.<br/>` +
      `• Để loại bỏ tài sản khỏi đơn vị, hãy dùng module <b>Thanh lý / Tiêu hủy</b>.<br/><br/>` +
      `Bạn chắc chắn muốn xóa <b>${asset.name}</b> (${asset.asset_code})?`,
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
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numericValue);
};

const formatDate = (date?: string) => {
  if (!date) return '-';
  return moment(date).format('DD/MM/YYYY');
};

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return Number(value).toLocaleString('vi-VN');
};

const getTransferStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'info',
    approved_by_head: 'success',
    rejected: 'danger',
    rejected_by_head: 'danger',
    completed: 'success',
  };
  return types[status] || 'info';
};

const getTransferStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: 'Chờ phê duyệt',
    approved: 'Đã phê duyệt',
    approved_by_head: 'Đã phê duyệt',
    rejected: 'Đã từ chối',
    rejected_by_head: 'Đã từ chối',
    completed: 'Hoàn thành',
  };
  return texts[status] || status;
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
    const link = document.createElement('a');
    link.href = qrCodeImage.value;
    link.download = `QR_${assetStore.currentAsset?.asset_code || 'asset'}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success('Đã tải QR code');
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
  max-width: 1200px;
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

.asset-image-preview {
  width: 160px;
  height: 160px;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
  transition: transform 0.3s ease;
}

.asset-image-preview:hover {
  transform: scale(1.02);
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
