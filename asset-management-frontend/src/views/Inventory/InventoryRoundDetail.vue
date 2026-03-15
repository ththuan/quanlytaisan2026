<template>
  <div class="inventory-round-detail">
    <div class="page-header">
      <div>
        <h2>Chi tiết đợt kiểm kê</h2>
        <div class="sub" v-if="round">
          {{ round.round_name }} ({{ round.round_year }})
        </div>
      </div>
      <div class="actions">
        <el-button 
          v-if="round?.status === 'completed'" 
          type="success" 
          :icon="Download" 
          @click="exportReport"
          :loading="exporting"
          style="margin-right: 12px"
        >
          Xuất báo cáo tổng hợp
        </el-button>
        <el-button v-if="isAdmin" type="warning" @click="openExtendDialog" style="margin-right: 12px">
          Gia hạn (Bổ sung thời gian)
        </el-button>
        <el-button @click="goBack">Quay lại</el-button>
      </div>
    </div>

    <el-card v-loading="loading">
      <template v-if="round">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Năm">{{ round.round_year }}</el-descriptions-item>
          <el-descriptions-item label="Trạng thái">
            <el-tag :type="round.status === 'completed' ? 'success' : 'warning'">
              {{ round.status === 'completed' ? 'Hoàn thành' : 'Đang thực hiện' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Thời gian">
            {{ formatDate(round.start_date) }} - {{ formatDate(round.end_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="Tiến độ">
            {{ (round as any).completed_reports || round.completed_departments || 0 }}/{{ round.total_departments || 0 }} phòng ban
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <!-- Tổng quan thống kê -->
        <div class="section-title">Tổng quan báo cáo</div>
        <div class="summary-stats">
          <el-row :gutter="16">
            <el-col :xs="12" :sm="6">
              <div class="stat-box">
                <div class="stat-number">{{ summaryStats.total_assets }}</div>
                <div class="stat-label">Tổng tài sản</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="stat-box success">
                <div class="stat-number">{{ summaryStats.matched_assets }}</div>
                <div class="stat-label">Khớp</div>
                <div class="stat-percent">{{ getPercent(summaryStats.matched_assets, summaryStats.total_assets) }}%</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="stat-box danger">
                <div class="stat-number">{{ summaryStats.missing_assets }}</div>
                <div class="stat-label">Thiếu/Mất</div>
                <div class="stat-percent">{{ getPercent(summaryStats.missing_assets, summaryStats.total_assets) }}%</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="stat-box warning">
                <div class="stat-number">{{ summaryStats.needs_repair_assets }}</div>
                <div class="stat-label">Cần sửa chữa</div>
                <div class="stat-percent">{{ getPercent(summaryStats.needs_repair_assets, summaryStats.total_assets) }}%</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="stat-box danger">
                <div class="stat-number">{{ summaryStats.damaged_assets }}</div>
                <div class="stat-label">Hỏng/Thanh lý</div>
                <div class="stat-percent">{{ getPercent(summaryStats.damaged_assets, summaryStats.total_assets) }}%</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="stat-box">
                <div class="stat-number">{{ formatCurrency(summaryStats.total_original_value) }}</div>
                <div class="stat-label">Tổng nguyên giá</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="stat-box">
                <div class="stat-number">{{ formatCurrency(summaryStats.total_current_value) }}</div>
                <div class="stat-label">Tổng giá trị còn lại</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="stat-box info">
                <div class="stat-number">{{ summaryStats.total_departments }}</div>
                <div class="stat-label">Số phòng ban</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <el-divider />

        <div class="section-title">Báo cáo theo phòng ban</div>

        <div class="responsive-table">
          <el-table :data="reports" v-loading="reportsLoading" stripe>
            <el-table-column type="index" label="STT" width="60" align="center" />
            <el-table-column label="Phòng ban" min-width="200">
              <template #default="scope">
                {{ scope.row.department?.name || '—' }}
              </template>
            </el-table-column>
            <el-table-column label="Tổng TS" width="90" align="center">
              <template #default="scope">{{ scope.row.total_assets || 0 }}</template>
            </el-table-column>
            <el-table-column label="Khớp" width="90" align="center">
              <template #default="scope">
                <span style="color: #67c23a; font-weight: bold;">{{ scope.row.matched_assets || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Thiếu/Mất" width="110" align="center">
              <template #default="scope">
                <span style="color: #f56c6c; font-weight: bold;">{{ scope.row.missing_assets || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Cần sửa" width="100" align="center">
              <template #default="scope">
                <span style="color: #e6a23c; font-weight: bold;">{{ scope.row.needs_repair_assets || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Hỏng/Thanh lý" width="120" align="center">
              <template #default="scope">
                <span style="color: #f56c6c; font-weight: bold;">{{ scope.row.damaged_assets || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Trạng thái" width="150" align="center">
              <template #default="scope">
                <el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Thao tác" width="120" align="center" fixed="right">
              <template #default="scope">
                <el-button type="primary" link @click="openReport(scope.row.id)">Chi tiết</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <template v-if="round.unsubmitted_departments?.length || round.incomplete_departments?.length">
          <el-divider />
          <div class="section-title">Thống kê phòng ban chưa nộp báo cáo</div>
          <el-row :gutter="20">
            <el-col :span="12" v-if="round.unsubmitted_departments?.length">
              <div class="dept-status-list text-danger">
                <h4>Chưa thực hiện ({{ round.unsubmitted_departments.length }})</h4>
                <div v-for="dept in round.unsubmitted_departments" :key="dept.id" class="dept-item">
                  {{ dept.name }}
                </div>
              </div>
            </el-col>
            <el-col :span="12" v-if="round.incomplete_departments?.length">
              <div class="dept-status-list text-warning">
                <h4>Đang thực hiện / Chờ duyệt ({{ round.incomplete_departments.length }})</h4>
                <div v-for="dept in round.incomplete_departments" :key="dept.id" class="dept-item">
                  {{ dept.name }}
                </div>
              </div>
            </el-col>
          </el-row>
        </template>
      </template>
    </el-card>

    <!-- Dialog Gia hạn thời gian -->
    <el-dialog v-model="extendDialogVisible" title="Gia hạn thời gian kiểm kê" width="500px">
      <el-form label-width="120px">
        <el-form-item label="Hạn chót mới" required>
          <el-date-picker
            v-model="newEndDate"
            type="date"
            placeholder="Chọn ngày kết thúc mới"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="extendDialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="submitExtend" :loading="extendLoading" :disabled="!newEndDate">
            Xác nhận
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import inventoryService, { type InventoryRound, type InventoryReport } from '@/services/inventory.service';
import { useAuthStore } from '@/stores/auth.store';
import * as XLSX from 'xlsx';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const roundId = computed(() => parseInt(String(route.params.id || ''), 10));
const isAdmin = computed(() => authStore.user?.role === 'admin');

const loading = ref(false);
const reportsLoading = ref(false);
const exporting = ref(false);
const round = ref<InventoryRound | null>(null);
const reports = ref<InventoryReport[]>([]);

// Thống kê tổng hợp
const summaryStats = computed(() => {
  if (!reports.value.length) {
    return {
      total_assets: 0,
      matched_assets: 0,
      missing_assets: 0,
      needs_repair_assets: 0,
      damaged_assets: 0,
      total_original_value: 0,
      total_current_value: 0,
      total_departments: 0,
    };
  }

  return {
    total_assets: reports.value.reduce((sum, r) => sum + (r.total_assets || 0), 0),
    matched_assets: reports.value.reduce((sum, r) => sum + (r.matched_assets || 0), 0),
    missing_assets: reports.value.reduce((sum, r) => sum + (r.missing_assets || 0), 0),
    needs_repair_assets: reports.value.reduce((sum, r) => sum + ((r as any).needs_repair_assets || 0), 0),
    damaged_assets: reports.value.reduce((sum, r) => sum + (r.damaged_assets || 0), 0),
    total_original_value: reports.value.reduce((sum, r) => sum + (r.total_original_value || 0), 0),
    total_current_value: reports.value.reduce((sum, r) => sum + (r.total_current_value || 0), 0),
    total_departments: reports.value.length,
  };
});

const load = async () => {
  if (!roundId.value || Number.isNaN(roundId.value)) {
    ElMessage.error('ID đợt kiểm kê không hợp lệ');
    return;
  }

  loading.value = true;
  try {
    const res: any = await inventoryService.getRoundById(roundId.value);
    // backend: { success, data: round }
    const r = res?.data || res;
    // Keep missing fields
    round.value = {
      ...r,
      unsubmitted_departments: r.unsubmitted_departments || [],
      incomplete_departments: r.incomplete_departments || []
    };
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Không thể tải chi tiết đợt kiểm kê');
  } finally {
    loading.value = false;
  }

  await loadReports();
};

const loadReports = async () => {
  if (!roundId.value || Number.isNaN(roundId.value)) return;
  reportsLoading.value = true;
  try {
    const result = await inventoryService.getReports({ round_id: roundId.value, page: 1, limit: 200 });
    reports.value = result.data || [];
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Không thể tải danh sách báo cáo');
  } finally {
    reportsLoading.value = false;
  }
};

const openReport = (id: number) => {
  router.push(`/inventory/reports/${id}`);
};

const goBack = () => {
  router.push('/inventory');
};

const formatDate = (v: string) => {
  if (!v) return 'N/A';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('vi-VN');
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    draft: 'Bản nháp',
    pending: 'Chờ duyệt',
    approved_by_head: 'Trưởng Đơn vị đã duyệt',
    completed: 'Hoàn thành',
    rejected_by_head: 'Trưởng Đơn vị từ chối',
    rejected_by_admin: 'Quản trị viên từ chối',
  };
  return map[s] || s;
};

const extendDialogVisible = ref(false);
const newEndDate = ref('');
const extendLoading = ref(false);

const openExtendDialog = () => {
  if (round.value) {
    newEndDate.value = round.value.end_date;
  }
  extendDialogVisible.value = true;
};

const submitExtend = async () => {
  if (!newEndDate.value || !roundId.value) return;
  extendLoading.value = true;
  try {
    await inventoryService.extendRound(roundId.value, newEndDate.value);
    ElMessage.success('Gia hạn đợt kiểm kê thành công');
    extendDialogVisible.value = false;
    await load();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Không thể gia hạn');
  } finally {
    extendLoading.value = false;
  }
};

const statusType = (s: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    pending: 'warning',
    approved_by_head: 'primary',
    completed: 'success',
    rejected_by_head: 'danger',
    rejected_by_admin: 'danger',
  };
  return map[s] || 'info';
};

const getPercent = (value: number, total: number) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

const formatCurrency = (value: number) => {
  if (!value) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Xuất báo cáo Excel
const exportReport = async () => {
  if (!round.value || !reports.value.length) {
    ElMessage.warning('Không có dữ liệu để xuất');
    return;
  }

  exporting.value = true;
  try {
    // Sheet 1: Tổng quan
    const summaryData = [
      ['BÁO CÁO TỔNG HỢP KIỂM KÊ TÀI SẢN'],
      [`Đợt kiểm kê: ${round.value.round_name} (${round.value.round_year})`],
      [`Thời gian: ${formatDate(round.value.start_date)} - ${formatDate(round.value.end_date)}`],
      [`Trạng thái: ${round.value.status === 'completed' ? 'Hoàn thành' : 'Đang thực hiện'}`],
      [`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
      [],
      ['THỐNG KÊ TỔNG HỢP'],
      ['Chỉ tiêu', 'Số lượng', 'Tỷ lệ %', 'Giá trị (VNĐ)'],
      ['Tổng số tài sản', summaryStats.value.total_assets, '100%', formatCurrency(summaryStats.value.total_original_value)],
      ['Tài sản khớp', summaryStats.value.matched_assets, `${getPercent(summaryStats.value.matched_assets, summaryStats.value.total_assets)}%`, ''],
      ['Tài sản thiếu/mất', summaryStats.value.missing_assets, `${getPercent(summaryStats.value.missing_assets, summaryStats.value.total_assets)}%`, ''],
      ['Tài sản cần sửa chữa', summaryStats.value.needs_repair_assets, `${getPercent(summaryStats.value.needs_repair_assets, summaryStats.value.total_assets)}%`, ''],
      ['Tài sản hỏng/thanh lý', summaryStats.value.damaged_assets, `${getPercent(summaryStats.value.damaged_assets, summaryStats.value.total_assets)}%`, ''],
      [],
      ['Tổng nguyên giá', '', '', formatCurrency(summaryStats.value.total_original_value)],
      ['Tổng giá trị còn lại', '', '', formatCurrency(summaryStats.value.total_current_value)],
      ['Số phòng ban tham gia', summaryStats.value.total_departments, '', ''],
    ];

    // Sheet 2: Chi tiết theo phòng ban
    const departmentData = [
      ['CHI TIẾT THEO PHÒNG BAN'],
      [],
      ['STT', 'Phòng ban', 'Tổng TS', 'Khớp', 'Thiếu/Mất', 'Cần sửa', 'Hỏng/Thanh lý', 'Trạng thái', 'Nguyên giá', 'Giá trị còn lại'],
    ];

    reports.value.forEach((report, index) => {
      departmentData.push([
        index + 1,
        report.department?.name || 'N/A',
        report.total_assets || 0,
        report.matched_assets || 0,
        report.missing_assets || 0,
        (report as any).needs_repair_assets || 0,
        report.damaged_assets || 0,
        statusLabel(report.status),
        report.total_original_value || 0,
        report.total_current_value || 0,
      ]);
    });

    // Tạo workbook
    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    const ws2 = XLSX.utils.aoa_to_sheet(departmentData);

    // Định dạng cột
    ws1['!cols'] = [
      { wch: 30 }, // Chỉ tiêu
      { wch: 15 }, // Số lượng
      { wch: 12 }, // Tỷ lệ
      { wch: 20 }, // Giá trị
    ];

    ws2['!cols'] = [
      { wch: 5 },  // STT
      { wch: 30 }, // Phòng ban
      { wch: 10 }, // Tổng TS
      { wch: 10 }, // Khớp
      { wch: 12 }, // Thiếu/Mất
      { wch: 10 }, // Cần sửa
      { wch: 15 }, // Hỏng/Thanh lý
      { wch: 20 }, // Trạng thái
      { wch: 18 }, // Nguyên giá
      { wch: 18 }, // Giá trị còn lại
    ];

    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');
    XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết phòng ban');

    // Xuất file
    const fileName = `BaoCaoKiemKe_${round.value.round_year}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);

    ElMessage.success('Đã xuất báo cáo thành công');
  } catch (error: any) {
    console.error('Export error:', error);
    ElMessage.error('Có lỗi khi xuất báo cáo');
  } finally {
    exporting.value = false;
  }
};

watch(
  () => route.params.id,
  () => {
    load();
  }
);

onMounted(() => {
  load();
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
}

.sub {
  color: #909399;
  font-size: 13px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 10px;
}

.dept-status-list {
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 10px;
}

.dept-status-list h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
}

.dept-item {
  font-size: 13px;
  padding: 4px 0;
  border-bottom: 1px dashed #ebeef5;
}

.dept-item:last-child {
  border-bottom: none;
}

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}

/* Summary Stats */
.summary-stats {
  margin-bottom: 8px;
}

.summary-stats .el-col {
  margin-bottom: 16px;
  display: flex;
}

.stat-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
  flex: 1;
}

.stat-box:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-box.success {
  background: #f0f9ff;
  border-color: #67c23a;
}

.stat-box.danger {
  background: #fef0f0;
  border-color: #f56c6c;
}

.stat-box.warning {
  background: #fef9e7;
  border-color: #e6a23c;
}

.stat-box.info {
  background: #e8f4fd;
  border-color: #409eff;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1;
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

.stat-box.info .stat-number {
  color: #409eff;
}

.stat-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.stat-percent {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* Responsive table */
.responsive-table {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.responsive-table .el-table {
  min-width: 900px;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .actions {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .actions .el-button {
    flex: 1 1 100%;
  }

  .stat-box {
    padding: 16px 12px;
  }

  .stat-number {
    font-size: 24px;
  }

  .stat-label {
    font-size: 12px;
  }
}
</style>
