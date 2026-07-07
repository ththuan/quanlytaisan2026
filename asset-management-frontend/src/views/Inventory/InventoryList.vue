<template>
  <div class="inventory-container">
    <!-- Header -->
    <div class="page-header">
      <h2>Kiểm kê tài sản</h2>
      <el-button
        v-if="isAdmin"
        type="primary"
        @click="showCreateRoundDialog = true"
      >
        <el-icon><Plus /></el-icon>
        Tạo đợt kiểm kê mới
      </el-button>
    </div>

    <!-- Active Round Alert - Improved for Staff Users -->
    <el-card
      v-if="activeRound"
      class="active-round-card"
      :class="{ 'has-report': hasMyReport }"
    >
      <div class="round-header">
        <div class="round-title-section">
          <el-icon
            class="round-icon"
            :class="hasMyReport ? 'success' : 'warning'"
          >
            <InfoFilled v-if="!hasMyReport" />
            <Check v-else />
          </el-icon>
          <div class="round-info-section">
            <h3 class="round-title">
              Đang có đợt kiểm kê: {{ activeRound.round_name }}
            </h3>
            <div class="round-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(activeRound.start_date) }} - {{ formatDate(activeRound.end_date) }}
              </span>
              <span
                v-if="isAdminOrDirector"
                class="meta-item"
              >
                <el-icon><TrendCharts /></el-icon>
                Tiến độ: {{ (activeRound as any).completed_reports || activeRound.completed_departments || 0 }}/{{ activeRound.total_departments || 0 }} phòng ban
              </span>
            </div>
          </div>
        </div>
        <div class="round-actions">
          <el-button
            v-if="isAdminOrDirector"
            type="primary"
            @click="goToActiveRound"
          >
            <el-icon><View /></el-icon>
            Xem chi tiết
          </el-button>
          <el-button 
            v-if="canStartInventory && !hasMyReport && activeRound" 
            type="success" 
            size="large"
            class="start-inventory-btn"
            @click="startInventory"
          >
            <el-icon><Plus /></el-icon>
            Bắt đầu kiểm kê đơn vị
          </el-button>
          <el-button 
            v-if="canStartInventory && hasMyReport" 
            type="primary" 
            size="large"
            class="continue-inventory-btn"
            @click="goToMyReport"
          >
            <el-icon><Document /></el-icon>
            Tiếp tục kiểm kê
          </el-button>
        </div>
      </div>
      
      <!-- Instructions for Staff Users -->
      <div
        v-if="canStartInventory && !hasMyReport"
        class="instructions-section"
      >
        <el-divider>
          <el-icon><QuestionFilled /></el-icon>
          Hướng dẫn thực hiện kiểm kê
        </el-divider>
        <el-steps
          :active="0"
          finish-status="success"
          align-center
          class="inventory-steps"
        >
          <el-step
            title="Bắt đầu kiểm kê"
            description="Nhấn nút 'Bắt đầu kiểm kê đơn vị' ở trên"
          />
          <el-step
            title="Quét mã tài sản"
            description="Sử dụng camera hoặc nhập mã tài sản để kiểm kê"
          />
          <el-step
            title="Nhập kết quả"
            description="Điền số lượng thực tế và tình trạng tài sản"
          />
          <el-step
            title="Nộp báo cáo"
            description="Kiểm tra lại và nộp báo cáo cho trưởng phòng duyệt"
          />
        </el-steps>
        <div class="instruction-tips">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template #title>
              <strong>Lưu ý quan trọng:</strong>
            </template>
            <ul class="tips-list">
              <li>Bạn có thể lưu nháp bất cứ lúc nào và tiếp tục sau</li>
              <li>Quét mã QR/Barcode trên tài sản để kiểm kê nhanh hơn</li>
              <li>Kiểm tra kỹ số lượng và tình trạng tài sản trước khi nộp báo cáo</li>
              <li>Sau khi nộp báo cáo, bạn sẽ không thể chỉnh sửa</li>
            </ul>
          </el-alert>
        </div>
      </div>
      
      <!-- Status for users who already have report -->
      <div
        v-if="canStartInventory && hasMyReport"
        class="report-status-section"
      >
        <el-alert
          type="success"
          :closable="false"
          show-icon
        >
          <template #title>
            <strong>Bạn đã bắt đầu kiểm kê</strong>
          </template>
          <p>Nhấn nút "Tiếp tục kiểm kê" ở trên để tiếp tục thực hiện kiểm kê tài sản của đơn vị.</p>
        </el-alert>
      </div>
    </el-card>

    <!-- Hướng dẫn cho cán bộ/trưởng đơn vị khi chưa có đợt kiểm kê -->
    <el-alert
      v-if="!activeRound && !isAdminOrDirector"
      title="Chưa có đợt kiểm kê nào đang hoạt động"
      type="info"
      description="Vui lòng chờ Admin tạo đợt kiểm kê mới. Khi có đợt kiểm kê, bạn sẽ thấy thông báo tại đây."
      show-icon
      :closable="false"
      class="no-round-alert"
    />

    <!-- Tabs -->
    <el-tabs
      v-model="activeTab"
      class="inventory-tabs"
    >
      <!-- Tab: Danh sách đợt kiểm kê -->
      <el-tab-pane
        label="Đợt kiểm kê"
        name="rounds"
      >
        <div class="responsive-table">
          <el-table
            v-loading="loadingRounds"
            :data="rounds"
            stripe
          >
            <el-table-column
              prop="round_year"
              label="Năm"
              width="80"
              align="center"
            />
            <el-table-column
              prop="round_name"
              label="Tên đợt kiểm kê"
              min-width="200"
            />
            <el-table-column
              label="Thời gian"
              width="220"
            >
              <template #default="{ row }">
                {{ formatDate(row.start_date) }} - {{ formatDate(row.end_date) }}
              </template>
            </el-table-column>
            <el-table-column
              label="Tiến độ"
              width="150"
              align="center"
            >
              <template #default="{ row }">
                <el-progress 
                  :percentage="calculateProgress(row)" 
                  :status="row.status === 'completed' ? 'success' : ''"
                />
                <span class="progress-text">{{ getCompletedCount(row) }}/{{ getTotalCount(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="status"
              label="Trạng thái"
              width="120"
              align="center"
            >
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row)">
                  {{ getRoundStatusLabel(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="Thao tác"
              width="150"
              align="center"
            >
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  @click="viewRoundDetail(row)"
                >
                  Chi tiết
                </el-button>
                <el-button 
                  v-if="isAdmin && row.status === 'in_progress'" 
                  type="success" 
                  link
                  @click="completeRound(row)"
                >
                  Hoàn tất
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-pagination
          v-model:current-page="roundsPage"
          v-model:page-size="roundsLimit"
          :total="roundsTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          class="pagination"
          @size-change="fetchRounds"
          @current-change="fetchRounds"
        />
      </el-tab-pane>

      <!-- Tab: Báo cáo kiểm kê -->
      <el-tab-pane
        label="Báo cáo kiểm kê"
        name="reports"
        lazy
      >
        <!-- Filters -->
        <div class="filters">
          <el-select
            v-model="reportFilters.round_id"
            placeholder="Chọn đợt kiểm kê"
            clearable
            @change="fetchReports"
          >
            <el-option
              v-for="round in rounds"
              :key="round.id"
              :label="`${round.round_name} (${round.round_year})`"
              :value="round.id"
            />
          </el-select>
          <el-select
            v-model="reportFilters.status"
            placeholder="Trạng thái"
            clearable
            @change="fetchReports"
          >
            <el-option
              label="Bản nháp"
              value="draft"
            />
            <el-option
              label="Chờ duyệt"
              value="pending"
            />
            <el-option
              label="Trưởng Đơn vị đã duyệt"
              value="approved_by_head"
            />
            <el-option
              label="Hoàn thành"
              value="completed"
            />
            <el-option
              label="Trưởng Đơn vị từ chối"
              value="rejected_by_head"
            />
            <el-option
              label="Quản trị viên từ chối"
              value="rejected_by_admin"
            />
          </el-select>
        </div>

        <div class="responsive-table">
          <el-table 
            v-loading="loadingReports" 
            :data="reports" 
            stripe
            class="reports-table"
          >
            <el-table-column
              prop="department.name"
              label="Phòng ban"
              min-width="150"
            />
            <el-table-column
              label="Tổng TS"
              width="80"
              align="center"
            >
              <template #default="{ row }">
                {{ row.total_assets || 0 }}
              </template>
            </el-table-column>
            <el-table-column
              label="Khớp"
              width="70"
              align="center"
            >
              <template #default="{ row }">
                <span class="text-success">{{ row.matched_assets || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="Thiếu"
              width="70"
              align="center"
            >
              <template #default="{ row }">
                <span class="text-danger">{{ row.missing_assets || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="Hỏng"
              width="70"
              align="center"
            >
              <template #default="{ row }">
                <span class="text-danger">{{ row.damaged_assets || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="status"
              label="Trạng thái"
              width="130"
              align="center"
            >
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
                <div
                  v-if="row.rejection_count && row.rejection_count > 0"
                  class="rejection-info"
                >
                  <el-tag
                    type="danger"
                    size="small"
                    style="margin-top: 4px"
                  >
                    Đã từ chối {{ row.rejection_count }} lần
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isAdminOrDirector"
              label="Thông tin từ chối"
              width="200"
            >
              <template #default="{ row }">
                <div v-if="row.status === 'rejected_by_head' || row.status === 'rejected_by_admin'">
                  <div
                    v-if="row.rejection_reason"
                    class="rejection-reason"
                  >
                    <strong>Lý do:</strong> {{ row.rejection_reason }}
                  </div>
                  <div
                    v-if="row.head_approved_at && row.status === 'rejected_by_head'"
                    class="rejection-time"
                  >
                    <small>{{ formatDateTime(row.head_approved_at) }}</small>
                  </div>
                  <div
                    v-if="row.admin_approved_at && row.status === 'rejected_by_admin'"
                    class="rejection-time"
                  >
                    <small>{{ formatDateTime(row.admin_approved_at) }}</small>
                  </div>
                </div>
                <span
                  v-else
                  class="text-muted"
                >-</span>
              </template>
            </el-table-column>
            <el-table-column
              label="Thao tác"
              width="200"
              align="center"
            >
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  @click="viewReportDetail(row)"
                >
                  Chi tiết
                </el-button>
                <el-button 
                  v-if="row.status === 'draft'" 
                  type="success" 
                  link
                  @click="editReport(row)"
                >
                  Tiếp tục
                </el-button>
                <el-button 
                  v-if="canApprove(row)" 
                  type="warning" 
                  link
                  @click="openApproveDialog(row)"
                >
                  Duyệt
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-pagination
          v-model:current-page="reportsPage"
          v-model:page-size="reportsLimit"
          :total="reportsTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          class="pagination"
          @size-change="fetchReports"
          @current-change="fetchReports"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- Dialog: Tạo đợt kiểm kê -->
    <el-dialog
      v-model="showCreateRoundDialog"
      title="Tạo đợt kiểm kê mới"
      width="500"
    >
      <el-form
        ref="roundFormRef"
        :model="newRound"
        :rules="roundRules"
        label-width="140px"
      >
        <el-form-item
          label="Năm kiểm kê"
          prop="round_year"
        >
          <el-input-number
            v-model="newRound.round_year"
            :min="2020"
            :max="2100"
          />
        </el-form-item>
        <el-form-item
          label="Tên đợt kiểm kê"
          prop="round_name"
        >
          <el-input
            v-model="newRound.round_name"
            placeholder="VD: Kiểm kê tài sản năm 2026"
          />
        </el-form-item>
        <el-form-item
          label="Thời gian bắt đầu"
          prop="start_date"
        >
          <el-date-picker
            v-model="newRound.start_date"
            type="date"
            placeholder="Chọn ngày"
          />
        </el-form-item>
        <el-form-item
          label="Thời gian kết thúc"
          prop="end_date"
        >
          <el-date-picker
            v-model="newRound.end_date"
            type="date"
            placeholder="Chọn ngày"
          />
        </el-form-item>
        <el-form-item label="Mô tả">
          <el-input
            v-model="newRound.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateRoundDialog = false">
          Hủy
        </el-button>
        <el-button
          type="primary"
          :loading="creating"
          @click="createRound"
        >
          Tạo đợt kiểm kê
        </el-button>
      </template>
    </el-dialog>

    <!-- Dialog: Duyệt báo cáo -->
    <el-dialog
      v-model="showApproveDialog"
      title="Duyệt báo cáo kiểm kê"
      width="800"
    >
      <div v-if="selectedReport">
        <div class="approve-header">
          <h3>Phòng ban: <strong>{{ selectedReport.department?.name }}</strong></h3>
          <div class="approve-stats">
            <el-row :gutter="16">
              <el-col
                :xs="12"
                :sm="6"
              >
                <div class="stat-box success">
                  <div class="stat-number">
                    {{ selectedReport.matched_assets || 0 }}
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
                    {{ selectedReport.missing_assets || 0 }}
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
                    {{ selectedReport.damaged_assets || 0 }}
                  </div>
                  <div class="stat-text">
                    Hỏng/Cần xử lý
                  </div>
                </div>
              </el-col>
              <el-col
                :xs="12"
                :sm="6"
              >
                <div class="stat-box">
                  <div class="stat-number">
                    {{ selectedReport.total_assets || 0 }}
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
            v-if="selectedReport.missing_assets > 0" 
            type="warning" 
            :closable="false"
            style="margin-bottom: 16px"
          >
            <template #title>
              <strong>Có {{ selectedReport.missing_assets }} tài sản bị mất</strong>
            </template>
            <p>Bạn cần giải trình với giám hiệu về việc mất các tài sản này. Vui lòng xem chi tiết báo cáo để biết danh sách tài sản mất.</p>
          </el-alert>

          <el-alert 
            v-if="selectedReport.damaged_assets > 0" 
            type="error" 
            :closable="false"
            style="margin-bottom: 16px"
          >
            <template #title>
              <strong>Có {{ selectedReport.damaged_assets }} tài sản hỏng/cần xử lý</strong>
            </template>
            <p>Bạn cần giải trình với giám hiệu về việc thanh lý hoặc sửa chữa các tài sản này. Vui lòng xem chi tiết báo cáo để biết danh sách tài sản cần xử lý.</p>
          </el-alert>

          <el-alert 
            v-if="selectedReport.missing_assets === 0 && selectedReport.damaged_assets === 0" 
            type="success" 
            :closable="false"
            style="margin-bottom: 16px"
          >
            <template #title>
              <strong>Tất cả tài sản đều khớp với sổ sách</strong>
            </template>
            <p>Không có tài sản nào bị mất hoặc cần xử lý.</p>
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
        </el-form>

        <div class="approve-actions-hint">
          <el-button
            type="primary"
            link
            @click="viewReportDetail(selectedReport)"
          >
            <el-icon><View /></el-icon>
            Xem chi tiết báo cáo để biết danh sách tài sản mất và cần thanh lý
          </el-button>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Document, InfoFilled, Check, Calendar, TrendCharts, View, QuestionFilled } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth.store';
import inventoryService, { type InventoryRound, type InventoryReport } from '@/services/inventory.service';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const isAdmin = computed(() => authStore.user?.role === 'admin');
const isAdminOrDirector = computed(() => {
  const role = authStore.user?.role;
  return role === 'admin' || role === 'director';
});
const hasDepartment = computed(() => !!authStore.user?.department_id);
const canStartInventory = computed(() => hasDepartment.value && !isAdmin.value);
const activeTab = ref('rounds');

// Rounds
const rounds = ref<InventoryRound[]>([]);
const activeRound = ref<InventoryRound | null>(null);
const loadingRounds = ref(false);
const roundsPage = ref(1);
const roundsLimit = ref(10);
const roundsTotal = ref(0);
const hasMyReport = ref(false);

// Reports
const reports = ref<InventoryReport[]>([]);
const loadingReports = ref(false);
const reportsPage = ref(1);
const reportsLimit = ref(10);
const reportsTotal = ref(0);
const reportFilters = ref({
  round_id: null as number | null,
  status: '' as string,
});

// Create Round Dialog
const showCreateRoundDialog = ref(false);
const creating = ref(false);
const roundFormRef = ref();
const newRound = ref({
  round_name: '',
  round_year: new Date().getFullYear(),
  start_date: '',
  end_date: '',
  description: '',
});

const roundRules = {
  round_name: [{ required: true, message: 'Vui lòng nhập tên đợt kiểm kê', trigger: 'blur' }],
  round_year: [{ required: true, message: 'Vui lòng chọn năm', trigger: 'change' }],
  start_date: [{ required: true, message: 'Vui lòng chọn ngày bắt đầu', trigger: 'change' }],
  end_date: [{ required: true, message: 'Vui lòng chọn ngày kết thúc', trigger: 'change' }],
};

// Approve Dialog
const showApproveDialog = ref(false);
const approving = ref(false);
const selectedReport = ref<InventoryReport | null>(null);
const approveData = ref({
  approved: true,
  rejection_reason: '',
});

// Fetch data
const fetchActiveRound = async () => {
  try {
    const round = await inventoryService.getActiveRound();
    if (round) {
      activeRound.value = normalizeRound(round);
      // Kiểm tra xem user đã có báo cáo trong đợt kiểm kê này chưa
      if (hasDepartment.value) {
        await checkMyReport();
      }
    } else {
      activeRound.value = null;
    }
  } catch (error: any) {
    console.error('Error fetching active round:', error);
    activeRound.value = null;
    // Không hiển thị error nếu không có active round (đây là trường hợp bình thường)
    if (error.response?.status !== 404) {
      ElMessage.warning('Không thể tải thông tin đợt kiểm kê đang hoạt động');
    }
  }
};

const checkMyReport = async () => {
  if (!activeRound.value) return;
  try {
    const result = await inventoryService.getReports({
      round_id: activeRound.value.id,
      page: 1,
      limit: 1,
    });
    hasMyReport.value = (result.data || []).length > 0;
  } catch (error) {
    console.error('Error checking my report:', error);
  }
};

const normalizeRound = (round: any): InventoryRound => {
  return {
    ...round,
    // Backend đang lưu số báo cáo đã hoàn tất trong completed_reports.
    // Mỗi phòng ban tương ứng 1 báo cáo, nên có thể dùng completed_reports để hiển thị tiến độ.
    completed_departments: typeof round.completed_departments === 'number' 
      ? round.completed_departments 
      : (round.completed_reports ? parseInt(round.completed_reports) || 0 : 0),
    total_departments: typeof round.total_departments === 'number' 
      ? round.total_departments 
      : (round.total_departments ? parseInt(round.total_departments) || 0 : 0),
    status: round.status || 'in_progress',
  };
};

const fetchRounds = async () => {
  loadingRounds.value = true;
  try {
    const result = await inventoryService.getAllRounds({
      page: roundsPage.value,
      limit: roundsLimit.value,
    });
    
    // Normalize response structure
    let roundsData: InventoryRound[] = [];
    let totalCount = 0;
    
    if (result) {
      // Handle different response structures
      if (Array.isArray(result)) {
        roundsData = result;
        totalCount = result.length;
      } else if (result.data) {
        roundsData = Array.isArray(result.data) ? result.data : [];
        totalCount = result.total || (result as any).count || roundsData.length;
      } else if ((result as any).items) {
        roundsData = Array.isArray((result as any).items) ? (result as any).items : [];
        totalCount = result.total || (result as any).count || roundsData.length;
      }
    }
    
    // Normalize each round to ensure all fields are valid
    rounds.value = roundsData.map(normalizeRound);
    roundsTotal.value = typeof totalCount === 'number' && !isNaN(totalCount) ? totalCount : rounds.value.length;
  } catch (error: any) {
    console.error('Error fetching rounds:', error);
    ElMessage.error(error.response?.data?.message || 'Không thể tải danh sách đợt kiểm kê');
    rounds.value = [];
    roundsTotal.value = 0;
  } finally {
    loadingRounds.value = false;
  }
};

const fetchReports = async () => {
  loadingReports.value = true;
  try {
    const params: any = {
      page: reportsPage.value,
      limit: reportsLimit.value,
    };
    if (reportFilters.value.round_id) params.round_id = reportFilters.value.round_id;
    if (reportFilters.value.status) params.status = reportFilters.value.status;
    
    const result = await inventoryService.getReports(params);
    reports.value = result.data || [];
    reportsTotal.value = result.total || 0;
  } catch (error) {
    console.error('Error fetching reports:', error);
    ElMessage.error('Không thể tải danh sách báo cáo');
  } finally {
    loadingReports.value = false;
  }
};

// Actions
const createRound = async () => {
  const valid = await roundFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  creating.value = true;
  try {
    await inventoryService.createRound({
      ...newRound.value,
      start_date: new Date(newRound.value.start_date).toISOString(),
      end_date: new Date(newRound.value.end_date).toISOString(),
    });
    ElMessage.success('Tạo đợt kiểm kê thành công');
    showCreateRoundDialog.value = false;
    fetchRounds();
    fetchActiveRound();
    // Reset form
    newRound.value = {
      round_name: '',
      round_year: new Date().getFullYear(),
      start_date: '',
      end_date: '',
      description: '',
    };
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra');
  } finally {
    creating.value = false;
  }
};

const completeRound = async (round: InventoryRound) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn hoàn tất đợt kiểm kê "${round.round_name}"? Sau khi hoàn tất sẽ không thể chỉnh sửa.`,
      'Xác nhận hoàn tất',
      { confirmButtonText: 'Hoàn tất', cancelButtonText: 'Hủy', type: 'warning' }
    );
    await inventoryService.completeRound(round.id);
    ElMessage.success('Đã hoàn tất đợt kiểm kê');
    fetchRounds();
    fetchActiveRound();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }
};

const viewRoundDetail = (round: InventoryRound) => {
  if (round && round.id) {
    router.push({ name: 'InventoryRoundDetail', params: { id: round.id } });
  } else {
    ElMessage.error('Không tìm thấy ID của đợt kiểm kê.');
  }
};

const goToActiveRound = () => {
  if (activeRound.value && activeRound.value.id) {
    router.push({ name: 'InventoryRoundDetail', params: { id: activeRound.value.id } });
  } else {
    ElMessage.error('Không tìm thấy ID của đợt kiểm kê đang hoạt động.');
  }
};

const startInventory = () => {
  if (activeRound.value && activeRound.value.id) {
    router.push(`/inventory/conduct?round_id=${activeRound.value.id}`);
  } else {
    ElMessage.error('Không tìm thấy thông tin đợt kiểm kê');
  }
};

const goToMyReport = async () => {
  if (!activeRound.value || !activeRound.value.id) {
    ElMessage.error('Không tìm thấy thông tin đợt kiểm kê');
    return;
  }
  
  if (!authStore.user?.department_id) {
    ElMessage.error('Bạn chưa được phân công vào phòng ban nào');
    return;
  }
  
  // Tìm báo cáo của đơn vị trong đợt kiểm kê hiện tại
  try {
    const result = await inventoryService.getReports({
      round_id: activeRound.value.id,
      department_id: authStore.user.department_id,
      page: 1,
      limit: 1,
    });
    if (result.data && result.data.length > 0) {
      const report = result.data[0];
      if (report.status === 'draft') {
        // Truyền cả round_id để tránh lỗi khi report thiếu round_id
        const roundIdParam = report.round_id || activeRound.value.id;
        router.push(`/inventory/conduct?report_id=${report.id}&round_id=${roundIdParam}`);
      } else {
        router.push(`/inventory/reports/${report.id}`);
      }
    } else {
      // Nếu chưa có báo cáo, tạo mới
      ElMessage.info('Chưa có báo cáo. Đang tạo báo cáo mới...');
      router.push(`/inventory/conduct?round_id=${activeRound.value.id}`);
    }
  } catch (error: any) {
    console.error('Error fetching report:', error);
    ElMessage.error(error.response?.data?.message || 'Không thể tải báo cáo');
  }
};

const viewReportDetail = (report: InventoryReport) => {
  router.push(`/inventory/reports/${report.id}`);
};

const editReport = (report: InventoryReport) => {
  // Truyền cả round_id nếu có để tránh lỗi khi report thiếu round_id
  if (report.round_id) {
    router.push(`/inventory/conduct?report_id=${report.id}&round_id=${report.round_id}`);
  } else {
    // Nếu report không có round_id, vẫn truyền report_id và để InventoryConduct tự khôi phục
    router.push(`/inventory/conduct?report_id=${report.id}`);
  }
};

const canApprove = (report: InventoryReport) => {
  const user = authStore.user;
  if (!user) return false;
  
  // Department head can approve pending reports
  if (user.role === 'department_head' && report.status === 'pending') {
    return true;
  }
  // Admin can approve approved_by_head reports
  if (user.role === 'admin' && report.status === 'approved_by_head') {
    return true;
  }
  return false;
};

const openApproveDialog = (report: InventoryReport) => {
  selectedReport.value = report;
  approveData.value = { approved: true, rejection_reason: '' };
  showApproveDialog.value = true;
};

const approveReport = async () => {
  if (!selectedReport.value) return;
  
  approving.value = true;
  try {
    await inventoryService.approveReport(
      selectedReport.value.id,
      approveData.value.approved,
      approveData.value.rejection_reason
    );
    ElMessage.success(approveData.value.approved ? 'Đã phê duyệt báo cáo' : 'Đã từ chối báo cáo');
    showApproveDialog.value = false;
    fetchReports();
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra');
  } finally {
    approving.value = false;
  }
};

// Helpers - Progress and Status calculations
const getCompletedCount = (row: InventoryRound): number => {
  const completed = (row as any).completed_reports || row.completed_departments;
  if (typeof completed === 'number' && !isNaN(completed) && completed >= 0) {
    return completed;
  }
  return 0;
};

const getTotalCount = (row: InventoryRound): number => {
  const total = row.total_departments;
  if (typeof total === 'number' && !isNaN(total) && total > 0) {
    return total;
  }
  return 0;
};

const calculateProgress = (row: InventoryRound): number => {
  const completed = getCompletedCount(row);
  const total = getTotalCount(row);
  
  if (total === 0) {
    // Nếu status là completed nhưng total = 0, hiển thị 100%
    if (row.status === 'completed') {
      return 100;
    }
    return 0;
  }
  
  const percentage = Math.round((completed / total) * 100);
  
  // Đảm bảo percentage trong khoảng 0-100
  if (isNaN(percentage) || percentage < 0) return 0;
  if (percentage > 100) return 100;
  
  return percentage;
};

const getStatusTagType = (row: InventoryRound): string => {
  // Nếu status là completed, luôn hiển thị success
  if (row.status === 'completed') {
    return 'success';
  }
  // Nếu progress = 100% nhưng status chưa completed, vẫn hiển thị warning
  const progress = calculateProgress(row);
  if (progress === 100) {
    return 'warning';
  }
  return 'warning';
};

const getRoundStatusLabel = (row: InventoryRound): string => {
  if (row.status === 'completed') {
    return 'Hoàn thành';
  }
  
  // Kiểm tra nếu tất cả departments đã hoàn thành nhưng status chưa updated
  const progress = calculateProgress(row);
  if (progress === 100) {
    return 'Hoàn thành';
  }
  
  return 'Đang thực hiện';
};

// Helpers
const formatDate = (date: string) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('vi-VN');
  } catch (error) {
    return 'N/A';
  }
};

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
  const key = `inventory.reportStatus.${status}`;
  const v = t(key);
  return v !== key ? v : status;
};

onMounted(() => {
  fetchActiveRound();
  fetchRounds();
  fetchReports();
});
</script>

<style scoped>
.inventory-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.active-round-card {
  margin-bottom: 20px;
  border: 2px solid #e4e7ed;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.active-round-card.has-report {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e9 100%);
}

.round-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.round-title-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.round-icon {
  font-size: 32px;
  margin-top: 4px;
}

.round-icon.success {
  color: #67c23a;
}

.round-icon.warning {
  color: #e6a23c;
}

.round-info-section {
  flex: 1;
}

.round-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.round-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #606266;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.round-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.start-inventory-btn,
.continue-inventory-btn {
  font-size: 16px;
  padding: 12px 24px;
  font-weight: 600;
}

.instructions-section {
  margin-top: 24px;
  padding-top: 24px;
}

.inventory-steps {
  margin: 24px 0;
}

.instruction-tips {
  margin-top: 20px;
}

.tips-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.tips-list li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.report-status-section {
  margin-top: 16px;
}

.no-round-alert {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .round-header {
    flex-direction: column;
  }
  
  .round-actions {
    width: 100%;
  }
  
  .start-inventory-btn,
  .continue-inventory-btn {
    width: 100%;
  }
  
  .inventory-steps {
    padding: 0 10px;
  }
  
  .inventory-steps :deep(.el-step__title) {
    font-size: 12px;
  }
  
  .inventory-steps :deep(.el-step__description) {
    font-size: 11px;
  }
}

.inventory-tabs {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.filters .el-select {
  width: 200px;
}

.progress-text {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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

.rejection-info {
  margin-top: 4px;
}

.rejection-reason {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
  word-break: break-word;
}

.rejection-time {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.approve-form {
  margin-top: 20px;
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

.stat-box .stat-text {
  font-size: 12px;
  color: #606266;
}

.report-summary {
  margin-bottom: 20px;
}

.approve-actions-hint {
  margin-top: 16px;
  text-align: center;
}
</style>
