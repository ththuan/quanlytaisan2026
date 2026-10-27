<template>
  <div class="inventory-report-detail">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button
          :icon="ArrowLeft"
          @click="goBack"
        >
          Quay lại
        </el-button>
        <h2>Chi tiết báo cáo kiểm kê</h2>
      </div>
      <div class="header-right">
        <el-button
          v-if="report"
          :loading="printingMinutes"
          @click="printMinutes"
        >
          <el-icon><Document /></el-icon>
          In biên bản
        </el-button>
        <el-button
          v-if="report"
          :loading="printingDiscrepancy"
          @click="printDiscrepancyMinutes"
        >
          <el-icon><Warning /></el-icon>
          In biên bản thừa/thiếu
        </el-button>
        <!-- Nút chỉnh sửa và gửi lại khi báo cáo bị từ chối -->
        <el-button 
          v-if="canResubmit"
          type="primary" 
          @click="goToEdit"
        >
          <el-icon><Edit /></el-icon>
          Chỉnh sửa và gửi lại
        </el-button>
        <!-- Nút duyệt báo cáo cho admin/head -->
        <el-button 
          v-if="canApprove"
          type="warning" 
          :disabled="report?.status !== 'pending' && report?.status !== 'approved_by_head'"
          @click="openApproveDialog"
        >
          <el-icon><Select /></el-icon>
          Duyệt báo cáo
        </el-button>
      </div>
    </div>

    <div
      v-if="report"
      v-loading="loading"
    >
      <!-- Report Info -->
      <el-card class="report-info-card">
        <div class="report-header">
          <div class="report-title-section">
            <h3>{{ report.department?.name || 'Chưa xác định' }}</h3>
            <div class="report-meta">
              <el-tag
                :type="getStatusType(report.status)"
                size="large"
              >
                {{ getStatusLabel(report.status) }}
              </el-tag>
              <span
                v-if="report.rejection_count && report.rejection_count > 0"
                class="rejection-badge"
              >
                Đã bị từ chối {{ report.rejection_count }} lần
              </span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Rejection Info Alert -->
      <el-alert 
        v-if="report.status === 'rejected_by_head' || report.status === 'rejected_by_admin'"
        type="error" 
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        <template #title>
          <strong>Báo cáo đã bị từ chối</strong>
        </template>
        <div class="rejection-details">
          <p v-if="report.head_approved_at && report.status === 'rejected_by_head'">
            <strong>Thời gian từ chối:</strong> {{ formatDateTime(report.head_approved_at) }}
          </p>
          <p v-if="report.admin_approved_at && report.status === 'rejected_by_admin'">
            <strong>Thời gian từ chối:</strong> {{ formatDateTime(report.admin_approved_at) }}
          </p>
          <p v-if="report.rejection_reason">
            <strong>Lý do từ chối:</strong> {{ report.rejection_reason }}
          </p>
          <p v-if="report.head_notes && report.status === 'rejected_by_head'">
            <strong>Ghi chú của Trưởng Đơn vị:</strong> {{ report.head_notes }}
          </p>
          <p v-if="report.admin_notes && report.status === 'rejected_by_admin'">
            <strong>Ghi chú của Quản trị viên:</strong> {{ report.admin_notes }}
          </p>
          <p v-if="report.rejection_count && report.rejection_count > 0">
            <strong>Số lần từ chối:</strong> {{ report.rejection_count }} lần
          </p>
        </div>
      </el-alert>

      <!-- Dashboard Stats -->
      <div class="summary-stats">
        <el-card class="stat-card">
          <div class="stat-value">
            {{ report.total_assets || 0 }}
          </div>
          <div class="stat-label">
            Tổng tài sản
          </div>
        </el-card>
        <el-card class="stat-card success">
          <div class="stat-value">
            {{ report.matched_assets || 0 }}
          </div>
          <div class="stat-label">
            Khớp (Còn tồn tại)
          </div>
          <div class="stat-percentage">
            {{ report.total_assets > 0 ? Math.round(((report.matched_assets || 0) / report.total_assets) * 100) : 0 }}%
          </div>
        </el-card>
        <el-card class="stat-card danger">
          <div class="stat-value">
            {{ report.missing_assets || 0 }}
          </div>
          <div class="stat-label">
            Thiếu (Mất)
          </div>
          <div class="stat-percentage">
            {{ report.total_assets > 0 ? Math.round(((report.missing_assets || 0) / report.total_assets) * 100) : 0 }}%
          </div>
        </el-card>
        <el-card class="stat-card warning">
          <div class="stat-value">
            {{ report.needs_repair_assets || 0 }}
          </div>
          <div class="stat-label">
            Cần sửa chữa
          </div>
          <div class="stat-percentage">
            {{ report.total_assets > 0 ? Math.round(((report.needs_repair_assets || 0) / report.total_assets) * 100) : 0 }}%
          </div>
        </el-card>
        <el-card class="stat-card danger">
          <div class="stat-value">
            {{ report.damaged_assets || 0 }}
          </div>
          <div class="stat-label">
            Hỏng/Thanh lý
          </div>
          <div class="stat-percentage">
            {{ report.total_assets > 0 ? Math.round(((report.damaged_assets || 0) / report.total_assets) * 100) : 0 }}%
          </div>
        </el-card>
      </div>

      <!-- Alerts -->
      <div class="alerts-section">
        <el-alert 
          v-if="report.missing_assets > 0" 
          type="warning" 
          :closable="false"
          show-icon
        >
          <template #title>
            <strong>Có {{ report.missing_assets }} tài sản bị mất</strong>
          </template>
          <p>Bạn cần giải trình với giám hiệu về việc mất các tài sản này.</p>
        </el-alert>

        <el-alert 
          v-if="(report.needs_repair_assets || 0) > 0" 
          :type="report.status === 'completed' ? 'success' : 'warning'" 
          :closable="false"
          show-icon
        >
          <template #title>
            <strong>Có {{ report.needs_repair_assets }} tài sản cần sửa chữa</strong>
            <span v-if="report.status === 'completed'"> – đề nghị sửa chữa đã được tạo tự động</span>
          </template>
          <p v-if="report.status !== 'completed'">
            Sau khi admin phê duyệt, hệ thống sẽ tự động tạo đề nghị sửa chữa và chuyển sang quy trình xử lý.
          </p>
          <p v-else>
            Đề nghị sửa chữa đã được tạo tự động trong module <strong>Sửa chữa / Bảo dưỡng</strong>. 
            Admin cần phê duyệt trước khi kỹ thuật tiến hành sửa chữa.
            <el-link
              type="primary"
              :underline="false"
              style="margin-left:8px"
              @click="$router.push('/maintenance?request_type=repair&source=inventory')"
            >
              Xem đề nghị sửa chữa →
            </el-link>
          </p>
        </el-alert>

        <el-alert 
          v-if="report.damaged_assets > 0" 
          type="error" 
          :closable="false"
          show-icon
        >
          <template #title>
            <strong>Có {{ report.damaged_assets }} tài sản hỏng/cần thanh lý</strong>
          </template>
          <p>Bạn cần giải trình với giám hiệu về việc thanh lý các tài sản này.</p>
        </el-alert>

        <el-alert 
          v-if="report.missing_assets === 0 && report.damaged_assets === 0" 
          type="success" 
          :closable="false"
          show-icon
        >
          <template #title>
            <strong>Tất cả tài sản đều khớp với sổ sách</strong>
          </template>
          <p>Không có tài sản nào bị mất hoặc cần thanh lý.</p>
        </el-alert>
      </div>

      <!-- Ảnh tổng thể đơn vị -->
      <el-card
        v-if="report.image_urls && report.image_urls.length"
        class="details-card"
        style="margin-bottom: 16px;"
      >
        <template #header>
          <div class="card-title">
            Ảnh tổng thể đơn vị
          </div>
        </template>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <el-image
            v-for="url in report.image_urls"
            :key="url"
            :src="url"
            :preview-src-list="report.image_urls"
            preview-teleported
            fit="cover"
            style="width:110px;height:110px;border-radius:8px;border:1px solid #e4e7ed;"
          />
        </div>
      </el-card>

      <!-- Asset Details Table -->
      <el-card class="details-card">
        <template #header>
          <div class="card-header">
            <span>Danh sách tài sản kiểm kê</span>
            <div class="filter-actions">
              <el-input
                v-model="searchText"
                placeholder="Tìm kiếm tài sản..."
                :prefix-icon="Search"
                clearable
                style="width: 250px"
              />
              <el-select
                v-model="filterStatus"
                placeholder="Lọc kết quả"
                clearable
                style="width: 150px"
              >
                <el-option
                  label="Khớp"
                  value="matched"
                />
                <el-option
                  label="Thiếu"
                  value="missing"
                />
                <el-option
                  label="Hỏng - đề nghị thanh lý"
                  value="damaged"
                />
                <el-option
                  label="Hỏng"
                  value="damaged"
                />
              </el-select>
            </div>
          </div>
        </template>

        <div class="responsive-table">
          <el-table
            :data="filteredDetails"
            stripe
          >
            <el-table-column
              type="index"
              label="STT"
              width="60"
              align="center"
            />
            <el-table-column
              prop="asset.asset_code"
              label="Mã tài sản"
              width="120"
            />
            <el-table-column
              label="Mã loại TS"
              width="100"
            >
              <template #default="{ row }">
                {{ row.asset?.category_code || row.asset?.category || '-' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="asset.name"
              label="Tên tài sản"
              min-width="200"
            />
            <el-table-column
              label="ĐVT"
              width="80"
              align="center"
            >
              <template #default="{ row }">
                {{ row.asset?.unit || '-' }}
              </template>
            </el-table-column>
            <el-table-column
              label="SL sổ sách"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                {{ row.book_quantity ?? row.asset?.quantity ?? 1 }}
              </template>
            </el-table-column>
            <el-table-column
              label="SL thực tế"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <span :class="getQuantityClass(row)">
                  {{ row.actual_quantity ?? 0 }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              label="Chênh lệch"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <span :class="getDifferenceClass(row)">
                  {{ formatDifference(row.quantity_difference) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              label="Nguyên giá (đồng)"
              width="160"
              align="right"
            >
              <template #default="{ row }">
                {{ formatCurrency(row.asset?.original_value ?? row.asset?.purchase_price ?? 0) }}
              </template>
            </el-table-column>
            <el-table-column
              label="Giá trị còn lại (đồng)"
              width="170"
              align="right"
            >
              <template #default="{ row }">
                {{ formatCurrency(row.asset?.current_value ?? 0) }}
              </template>
            </el-table-column>
            <el-table-column
              label="Tình trạng"
              width="150"
              align="center"
            >
              <template #default="{ row }">
                <el-tag
                  :type="getConditionType(row.asset_condition)"
                  size="small"
                >
                  {{ getConditionLabel(row.asset_condition) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="Kết quả"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <el-tag
                  :type="getCheckStatusType(row.check_status)"
                  size="small"
                >
                  {{ getCheckStatusLabel(row.check_status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="Ảnh"
              width="120"
              align="center"
            >
              <template #default="{ row }">
                <div
                  v-if="row.image_urls && row.image_urls.length"
                  style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;"
                >
                  <el-image
                    v-for="url in row.image_urls.slice(0, 3)"
                    :key="url"
                    :src="url"
                    :preview-src-list="row.image_urls"
                    preview-teleported
                    fit="cover"
                    style="width:32px;height:32px;border-radius:4px;"
                  />
                  <span
                    v-if="row.image_urls.length > 3"
                    style="font-size:11px;color:#909399;"
                  >+{{ row.image_urls.length - 3 }}</span>
                </div>
                <span
                  v-else
                  class="text-muted"
                >-</span>
              </template>
            </el-table-column>
            <el-table-column
              label="Ghi chú"
              min-width="200"
            >
              <template #default="{ row }">
                <span v-if="row.notes">{{ row.notes }}</span>
                <span
                  v-else
                  class="text-muted"
                >-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>

    <!-- Approve Dialog -->
    <el-dialog
      v-model="showApproveDialog"
      title="Duyệt báo cáo kiểm kê"
      width="800"
    >
      <div v-if="report">
        <div class="approve-header">
          <h3>Phòng ban: <strong>{{ report.department?.name }}</strong></h3>
          <div class="approve-stats">
            <el-row :gutter="16">
              <el-col
                :xs="12"
                :sm="6"
              >
                <div class="stat-box success">
                  <div class="stat-number">
                    {{ report.matched_assets || 0 }}
                  </div>
                  <div class="stat-text">
                    Khớp (Còn tồn tại)
                  </div>
                </div>
              </el-col>
              <el-col
                :xs="12"
                :sm="6"
              >
                <div class="stat-box danger">
                  <div class="stat-number">
                    {{ report.missing_assets || 0 }}
                  </div>
                  <div class="stat-text">
                    Thiếu (Mất)
                  </div>
                </div>
              </el-col>
              <el-col
                :xs="12"
                :sm="6"
              >
                <div class="stat-box danger">
                  <div class="stat-number">
                    {{ report.damaged_assets || 0 }}
                  </div>
                  <div class="stat-text">
                    Hỏng/Thanh lý
                  </div>
                </div>
              </el-col>
              <el-col
                v-if="(report.needs_repair_assets || 0) > 0"
                :xs="12"
                :sm="6"
              >
                <div class="stat-box warning">
                  <div class="stat-number">
                    {{ report.needs_repair_assets || 0 }}
                  </div>
                  <div class="stat-text">
                    Cần sửa chữa
                  </div>
                </div>
              </el-col>
              <el-col
                :xs="12"
                :sm="6"
              >
                <div class="stat-box">
                  <div class="stat-number">
                    {{ report.total_assets || 0 }}
                  </div>
                  <div class="stat-text">
                    Tổng tài sản
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>

        <el-divider>Tóm tắt báo cáo</el-divider>

        <div class="report-summary">
          <el-alert 
            v-if="report.missing_assets > 0" 
            type="warning" 
            :closable="false"
            style="margin-bottom: 16px"
          >
            <template #title>
              <strong>Có {{ report.missing_assets }} tài sản bị mất</strong>
            </template>
            <p>Bạn cần giải trình với giám hiệu về việc mất các tài sản này. Vui lòng xem chi tiết báo cáo để biết danh sách tài sản mất.</p>
          </el-alert>

          <el-alert 
            v-if="report.damaged_assets > 0" 
            type="error" 
            :closable="false"
            style="margin-bottom: 16px"
          >
            <template #title>
              <strong>Có {{ report.damaged_assets }} tài sản hỏng/cần xử lý</strong>
            </template>
            <p>Bạn cần giải trình với giám hiệu về việc thanh lý hoặc sửa chữa các tài sản này. Vui lòng xem chi tiết báo cáo để biết danh sách tài sản cần xử lý.</p>
          </el-alert>
        </div>

        <el-form
          :model="approveData"
          label-width="100px"
          class="approve-form"
        >
          <el-form-item label="Quyết định">
            <el-radio-group v-model="approveData.approved">
              <el-radio :value="true">
                Phê duyệt
              </el-radio>
              <el-radio :value="false">
                Từ chối
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="!approveData.approved"
            label="Lý do"
          >
            <el-input
              v-model="approveData.rejection_reason"
              type="textarea"
              :rows="3"
              placeholder="Nhập lý do từ chối..."
            />
          </el-form-item>
          <el-form-item
            v-if="false"
            label="Đề nghị sửa chữa"
          >
            <el-alert
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 12px"
            >
              <template #title>
                <strong>Quyết định sửa chữa hay thanh lý</strong>
              </template>
              <p style="margin: 8px 0 0 0; line-height: 1.6;">
                Các tài sản dưới đây được đánh dấu <strong>"Cần sửa chữa"</strong> (còn sửa được).<br>
                • <strong>Chọn</strong> tài sản → Duyệt sửa chữa → Hệ thống <b>tự động tạo đề nghị sửa chữa</b> trong module Sửa chữa/Bảo dưỡng<br>
                • <strong>Không chọn</strong> → Từ chối sửa chữa → Chuyển sang thanh lý (coi như hỏng nặng, sửa không được)
              </p>
            </el-alert>
            <el-checkbox-group
              v-model="approveData.repair_approved_asset_ids"
              class="repair-approval-list"
            >
              <div
                v-for="d in repairItems"
                :key="d.id"
                class="repair-item"
              >
                <el-checkbox :value="d.asset_id">
                  <strong>{{ d.asset?.asset_code }}</strong> - {{ d.asset?.name }}
                  <span style="color: #909399; font-size: 12px; margin-left: 8px">
                    ({{ d.disposal_reason || d.notes || 'Cần sửa chữa' }})
                  </span>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showApproveDialog = false">
          Hủy
        </el-button>
        <el-button
          :type="approveData.approved ? 'success' : 'danger'"
          :loading="approving"
          @click="approveReport"
        >
          {{ approveData.approved ? 'Phê duyệt' : 'Từ chối' }}
        </el-button>
      </template>
    </el-dialog>

    <SignaturePad
      v-model="showSignDialog"
      :title="signTitle"
      :signer-name="signerName"
      @confirm="onSignConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Select, Search, Edit, Document, Warning } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth.store';
import inventoryService, { type InventoryReport } from '@/services/inventory.service';
import SignaturePad from '@/components/Common/SignaturePad.vue';
import api from '@/services/api';
import { openPrintWindow, escapeHtml, signatureCell } from '@/utils/print';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Chữ ký sống
const showSignDialog = ref(false);
const signTitle = ref('Ký xác nhận');
let signResolve: ((sig: string | null) => void) | null = null;
const signerName = computed(() => authStore.user?.fullname || authStore.user?.username || '');
const requestSignature = (title: string): Promise<string | null> => {
  signTitle.value = title;
  showSignDialog.value = true;
  return new Promise((resolve) => { signResolve = resolve; });
};
const onSignConfirm = (sig: string) => {
  signResolve?.(sig);
  signResolve = null;
};
watch(showSignDialog, (open) => {
  if (!open && signResolve) {
    signResolve(null);
    signResolve = null;
  }
});

const printingMinutes = ref(false);
const CONDITION_TEXT: Record<string, string> = { good: 'Tốt', fair: 'Trung bình', poor: 'Kém' };

const printMinutes = async () => {
  if (!report.value) return;
  printingMinutes.value = true;
  try {
    let signatures: any[] = [];
    try {
      const res: any = await api.get('/signatures', {
        params: { entity_type: 'inventory_report', entity_id: report.value.id },
      });
      signatures = res?.data || [];
    } catch { signatures = []; }

    const r = report.value as any;
    const details = r.details || [];
    const rows = details.map((d: any, idx: number) => {
      const diff = d.quantity_discrepancy ?? ((d.actual_quantity ?? 0) - (d.assigned_quantity ?? 0));
      const diffText = diff === 0 ? '0' : (diff > 0 ? `+${diff}` : `${diff}`);
      return `<tr>
        <td class="num">${idx + 1}</td>
        <td>${escapeHtml(d.asset?.asset_code || '')}</td>
        <td>${escapeHtml(d.asset?.name || '')}</td>
        <td class="num">${escapeHtml(d.asset?.unit || '')}</td>
        <td class="num">${escapeHtml(d.assigned_quantity ?? 0)}</td>
        <td class="num">${escapeHtml(d.actual_quantity ?? 0)}</td>
        <td class="num">${escapeHtml(diffText)}</td>
        <td>${escapeHtml(CONDITION_TEXT[d.condition] || d.condition || '')}</td>
        <td>${escapeHtml(d.notes || '')}</td>
      </tr>`;
    }).join('');

    const submitSig = signatures.find((s) => s.action === 'submit');
    const headSig = signatures.find((s) => s.action === 'approve' && s.signer_role === 'department_head')
      || signatures.find((s) => s.action === 'reject' && s.signer_role === 'department_head');
    const adminSig = signatures.find((s) => s.action === 'approve' && s.signer_role === 'admin')
      || signatures.find((s) => s.action === 'reject' && s.signer_role === 'admin');

    const body = `
      <div class="doc-header">
        <div class="org">${escapeHtml(r.department?.name || '')}</div>
      </div>
      <div class="doc-title">Biên bản kiểm kê tài sản</div>
      <div class="doc-sub">${r.inventory_round?.round_name ? `Đợt kiểm kê: ${escapeHtml(r.inventory_round.round_name)}` : ''}</div>
      <div class="doc-meta">Mã báo cáo: <b>${escapeHtml(r.report_code || '')}</b></div>
      <table class="data">
        <thead>
          <tr>
            <th>STT</th><th>Mã tài sản</th><th>Tên tài sản</th><th>ĐVT</th>
            <th>SL sổ sách</th><th>SL thực tế</th><th>Chênh lệch</th><th>Tình trạng</th><th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        Tổng số dòng: <b>${details.length}</b> —
        Khớp: <b>${r.matched_assets || 0}</b> —
        Thiếu: <b>${r.missing_assets || 0}</b> —
        Thừa: <b>${r.surplus_assets || 0}</b> —
        Hỏng: <b>${r.damaged_assets || 0}</b>
      </div>
      <div class="signatures">
        ${signatureCell('Người kiểm kê', submitSig)}
        ${signatureCell('Trưởng đơn vị', headSig)}
        ${signatureCell('Quản trị hệ thống', adminSig)}
      </div>`;

    if (!openPrintWindow('Biên bản kiểm kê', body)) {
      ElMessage.error('Trình duyệt chặn popup, vui lòng cho phép popup để in biên bản');
    }
  } finally {
    printingMinutes.value = false;
  }
};

const printingDiscrepancy = ref(false);
const printDiscrepancyMinutes = async () => {
  if (!report.value) return;
  printingDiscrepancy.value = true;
  try {
    let signatures: any[] = [];
    try {
      const res: any = await api.get('/signatures', {
        params: { entity_type: 'inventory_report', entity_id: report.value.id },
      });
      signatures = res?.data || [];
    } catch { signatures = []; }

    const r = report.value as any;
    const details = (r.details || []).filter(
      (d: any) => Number(d.quantity_difference ?? d.quantity_discrepancy ?? 0) !== 0
    );
    if (!details.length) {
      ElMessage.info('Báo cáo không có tài sản thừa/thiếu');
      return;
    }

    const rows = details.map((d: any, idx: number) => {
      const book = d.book_quantity ?? d.assigned_quantity ?? d.asset?.quantity ?? 0;
      const actual = d.actual_quantity ?? 0;
      const diff = d.quantity_difference ?? d.quantity_discrepancy ?? (actual - book);
      const diffText = diff === 0 ? '0' : (diff > 0 ? `+${diff}` : `${diff}`);
      const comp = Number(d.compensation_amount || 0);
      return `<tr>
        <td class="num">${idx + 1}</td>
        <td>${escapeHtml(d.asset?.asset_code || '')}</td>
        <td>${escapeHtml(d.asset?.name || '')}</td>
        <td class="num">${escapeHtml(book)}</td>
        <td class="num">${escapeHtml(actual)}</td>
        <td class="num">${escapeHtml(diffText)}</td>
        <td>${escapeHtml(d.discrepancy_reason || '')}</td>
        <td>${escapeHtml(d.responsibility || '')}</td>
        <td class="num">${comp ? comp.toLocaleString('vi-VN') : '-'}</td>
      </tr>`;
    }).join('');

    const totalComp = details.reduce((s: number, d: any) => s + Number(d.compensation_amount || 0), 0);
    const submitSig = signatures.find((s) => s.action === 'submit');
    const headSig = signatures.find((s) => s.action === 'approve' && s.signer_role === 'department_head');
    const adminSig = signatures.find((s) => s.action === 'approve' && s.signer_role === 'admin');

    const body = `
      <div class="doc-header"><div class="org">${escapeHtml(r.department?.name || '')}</div></div>
      <div class="doc-title">Biên bản kiểm kê thừa/thiếu tài sản</div>
      <div class="doc-sub">Mã báo cáo: ${escapeHtml(r.report_code || '')}</div>
      <table class="data">
        <thead>
          <tr>
            <th>STT</th><th>Mã TS</th><th>Tên tài sản</th><th>SL sổ sách</th><th>SL thực tế</th>
            <th>Chênh lệch</th><th>Nguyên nhân</th><th>Trách nhiệm</th><th>Bồi thường (đồng)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        Tổng số tài sản thừa/thiếu: <b>${details.length}</b> —
        Tổng bồi thường: <b>${totalComp.toLocaleString('vi-VN')} đồng</b>
      </div>
      <div class="signatures">
        ${signatureCell('Người kiểm kê', submitSig)}
        ${signatureCell('Trưởng đơn vị', headSig)}
        ${signatureCell('Quản trị hệ thống', adminSig)}
      </div>`;

    if (!openPrintWindow('Biên bản thừa/thiếu', body)) {
      ElMessage.error('Trình duyệt chặn popup, vui lòng cho phép popup để in biên bản');
    }
  } finally {
    printingDiscrepancy.value = false;
  }
};

const loading = ref(false);
const approving = ref(false);
const report = ref<InventoryReport | null>(null);
const searchText = ref('');
const filterStatus = ref('');
const showApproveDialog = ref(false);
const approveData = ref({
  approved: true,
  rejection_reason: '',
  repair_approved_asset_ids: [] as number[],
});

const canApprove = computed(() => {
  const user = authStore.user;
  if (!user || !report.value) return false;
  
  // Department head can approve pending reports
  if (user.role === 'department_head' && report.value.status === 'pending') {
    return true;
  }
  // Admin can approve approved_by_head reports
  if (user.role === 'admin' && report.value.status === 'approved_by_head') {
    return true;
  }
  return false;
});

const canResubmit = computed(() => {
  const user = authStore.user;
  if (!user || !report.value) return false;
  
  // Chỉ người tạo báo cáo mới có thể gửi lại khi bị từ chối
  const isCreator = report.value.created_by === user.id;
  const isRejected = report.value.status === 'rejected_by_head' || report.value.status === 'rejected_by_admin';
  
  return isCreator && isRejected;
});

const filteredDetails = computed(() => {
  if (!report.value?.details) return [];
  
  let result = report.value.details;

  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter((d: any) => 
      d.asset?.name?.toLowerCase().includes(search) ||
      d.asset?.asset_code?.toLowerCase().includes(search) ||
      d.asset?.category_code?.toLowerCase().includes(search)
    );
  }

  if (filterStatus.value) {
    result = result.filter((d: any) => d.check_status === filterStatus.value);
  }

  return result;
});

const fetchReport = async () => {
  const reportId = route.params.id as string;
  if (!reportId) {
    ElMessage.error('Không tìm thấy mã báo cáo');
    router.push('/inventory');
    return;
  }

  loading.value = true;
  try {
    const parsedId = parseInt(reportId);
    if (isNaN(parsedId)) {
      ElMessage.error('Mã báo cáo không hợp lệ');
      router.push('/inventory');
      return;
    }

    report.value = await inventoryService.getReportById(parsedId);
    
    // Tính toán số liệu từ details để đảm bảo chính xác
    if (report.value.details && report.value.details.length > 0) {
      const details = report.value.details;
      
      // Tính số lượng theo check_status
      report.value.matched_assets = details.filter((d: any) => d.check_status === 'matched').length;
      report.value.missing_assets = details.filter((d: any) => d.check_status === 'missing').length;
      report.value.damaged_assets = details.filter((d: any) => d.check_status === 'damaged').length;
      report.value.surplus_assets = details.filter((d: any) => d.check_status === 'surplus').length;
      (report.value as any).needs_repair_assets = details.filter((d: any) => d.check_status === 'needs_repair').length;
      report.value.total_assets = details.length;
      
      // Tính tổng giá trị dựa trên số lượng thực tế
      let totalOriginal = 0;
      let totalCurrent = 0;
      details.forEach((d: any) => {
        if (d.asset) {
          const originalValue = d.asset.original_value ?? d.asset.purchase_price ?? 0;
          const currentValue = d.asset.current_value ?? 0;
          const actualQty = d.actual_quantity ?? 0;
          
          // Tính giá trị dựa trên số lượng thực tế
          totalOriginal += originalValue * actualQty;
          totalCurrent += currentValue * actualQty;
        }
      });
      report.value.total_original_value = totalOriginal;
      report.value.total_current_value = totalCurrent;
    }
  } catch (error: any) {
    console.error('Error fetching report:', error);
    ElMessage.error(error.response?.data?.message || 'Không thể tải chi tiết báo cáo');
    router.push('/inventory');
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/inventory');
};

const goToEdit = () => {
  if (!report.value) return;
  // Điều hướng đến trang chỉnh sửa báo cáo với query parameter
  // Backend trả về inventory_round_id, nhưng frontend type có round_id
  // Sử dụng cả hai để đảm bảo tương thích
  const roundId = (report.value as any).inventory_round_id || 
                  (report.value as any).round_id || 
                  (report.value as any).inventory_round?.id;
  
  router.push({
    path: '/inventory/conduct',
    query: {
      report_id: report.value.id,
      ...(roundId && { round_id: roundId })
    }
  });
};

const repairItems = computed(() => {
  if (!report.value?.details) return [];
  // CHỈ lấy tài sản có suggest_repair = true (cần sửa chữa, còn sửa được)
  // KHÔNG lấy tài sản có suggest_disposal = true (hỏng nặng, sửa không được)
  return report.value.details.filter((d: any) => 
    d.suggest_repair === true && d.suggest_disposal !== true
  );
});

const openApproveDialog = () => {
  approveData.value = {
    approved: true,
    rejection_reason: '',
    repair_approved_asset_ids: [],
  };
  showApproveDialog.value = true;
};

const approveReport = async () => {
  if (!report.value) return;
  
  approving.value = true;
  try {
    const signature = await requestSignature(
      approveData.value.approved ? 'Ký xác nhận phê duyệt báo cáo' : 'Ký xác nhận từ chối báo cáo'
    );
    if (!signature) {
      approving.value = false;
      return;
    }
    await inventoryService.approveReport(
      report.value.id,
      approveData.value.approved,
      approveData.value.rejection_reason,
      approveData.value.repair_approved_asset_ids,
      signature
    );
    ElMessage.success(approveData.value.approved ? 'Đã phê duyệt báo cáo' : 'Đã từ chối báo cáo');
    showApproveDialog.value = false;
    await fetchReport();
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra');
  } finally {
    approving.value = false;
  }
};

// Helpers
const formatDateTime = (date: string | Date) => {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'N/A';
  }
};

const formatCurrency = (value: number) => {
  return Number(value || 0).toLocaleString('vi-VN');
};

const getQuantityClass = (row: any) => {
  const diff = row.quantity_difference ?? 0;
  const actualQty = row.actual_quantity ?? 0;
  const bookQty = row.book_quantity ?? 0;
  
  // Nếu không có chênh lệch, hiển thị màu xanh
  if (diff === 0 && actualQty === bookQty) return 'text-success';
  // Nếu thiếu (actual < book), hiển thị màu đỏ
  if (diff < 0) return 'text-danger';
  // Nếu thừa (actual > book), hiển thị màu vàng
  if (diff > 0) return 'text-warning';
  return '';
};

const getDifferenceClass = (row: any) => {
  const diff = row.quantity_difference ?? 0;
  if (diff === 0) return 'text-success';
  return diff > 0 ? 'text-warning' : 'text-danger';
};

const formatDifference = (diff: number | null | undefined) => {
  if (diff === null || diff === undefined) return '0';
  if (diff === 0) return '0';
  return diff > 0 ? `+${diff}` : `${diff}`;
};

const getConditionType = (condition: string) => {
  const types: Record<string, string> = {
    good: 'success',
    usable: 'primary',
    needs_repair: 'warning',
    damaged: 'danger',
    disposed: 'info',
  };
  return types[condition] || 'info';
};

const getConditionLabel = (condition: string) => {
  const labels: Record<string, string> = {
    good: 'Tốt',
    usable: 'Sử dụng được',
    needs_repair: 'Cần sửa',
    damaged: 'Hỏng',
    disposed: 'Đã thanh lý',
  };
  return labels[condition] || condition;
};

const getCheckStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    matched: 'Khớp',
    missing: 'Thiếu',
    surplus: 'Thừa',
    damaged: 'Hỏng',
    needs_repair: 'Cần sửa',
  };
  return labels[status] || status;
};

const getCheckStatusType = (status: string) => {
  const types: Record<string, string> = {
    matched: 'success',
    missing: 'danger',
    surplus: 'warning',
    damaged: 'danger',
    needs_repair: 'warning',
  };
  return types[status] || 'info';
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    draft: 'info',
    pending: 'warning',
    approved_by_head: 'primary',
    approved_by_admin: 'success',
    completed: 'success',
    rejected_by_head: 'danger',
    rejected_by_admin: 'danger',
  };
  return types[status] || 'info';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Bản nháp',
    pending: 'Chờ duyệt',
    approved_by_head: 'Trưởng Đơn vị đã duyệt',
    approved_by_admin: 'Quản trị viên đã duyệt',
    completed: 'Hoàn thành',
    rejected_by_head: 'Trưởng Đơn vị từ chối',
    rejected_by_admin: 'Quản trị viên từ chối',
  };
  return labels[status] || status;
};

onMounted(() => {
  fetchReport();
});
</script>

<style scoped>
.inventory-report-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.report-info-card {
  margin-bottom: 20px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.report-title-section h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #303133;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rejection-badge {
  padding: 4px 12px;
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #f56c6c;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.rejection-details {
  margin-top: 8px;
}

.rejection-details p {
  margin: 8px 0;
  line-height: 1.6;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-card .stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-card.success .stat-value {
  color: #67c23a;
}

.stat-card.warning .stat-value {
  color: #e6a23c;
}

.stat-card.danger .stat-value {
  color: #f56c6c;
}

.stat-card .stat-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-card .stat-percentage {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.alerts-section {
  margin-bottom: 20px;
}

.details-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.text-muted {
  color: #c0c4cc;
}

.text-success {
  color: #67c23a;
  font-weight: bold;
}

.text-warning {
  color: #e6a23c;
  font-weight: bold;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.approve-header {
  margin-bottom: 20px;
}

.approve-header h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #303133;
}

.approve-stats {
  margin-bottom: 20px;
}

.stat-box {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.stat-box.success {
  background: #f0f9ff;
  border-color: #67c23a;
}

.stat-box.danger {
  background: #fef0f0;
  border-color: #f56c6c;
}

.stat-box .stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-box.success .stat-number {
  color: #67c23a;
}

.stat-box.danger .stat-number {
  color: #f56c6c;
}

.stat-box.warning .stat-number {
  color: #e6a23c;
}

.stat-box .stat-text {
  font-size: 12px;
  color: #606266;
}

.report-summary {
  margin-bottom: 20px;
}

.approve-form {
  margin-top: 20px;
}

.repair-approval-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.repair-item {
  padding: 6px 0;
}

.repair-item .el-checkbox {
  display: block;
}

/* Responsive cho Report Detail */
@media (max-width: 992px) {
  .page-header .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    flex: 1 1 calc(50% - 6px);
  }

  .summary-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header h2 {
    font-size: 20px;
  }

  .header-right .el-button {
    flex: 1 1 100%;
    width: 100%;
  }

  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stat-card {
    padding: 16px 12px;
  }

  .stat-card .stat-value {
    font-size: 24px;
  }

  .stat-card .stat-label {
    font-size: 12px;
  }

  .report-info-card .report-header {
    flex-direction: column;
    gap: 12px;
  }

  .stat-box {
    padding: 12px;
  }

  .stat-box .stat-number {
    font-size: 24px;
  }
}
</style>
