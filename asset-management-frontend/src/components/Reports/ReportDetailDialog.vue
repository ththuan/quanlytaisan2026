<template>
  <el-dialog
    :model-value="visible"
    :title="$t('reports.reportDetail')"
    width="920px"
    class="report-detail-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="report">
      <el-descriptions
        :column="2"
        border
        class="detail-block"
      >
        <el-descriptions-item
          :label="$t('reports.department')"
          :span="2"
        >
          <el-tag>{{ report.department?.name || '—' }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item :label="$t('reports.year')">
          <strong>{{ report.year }}</strong>
        </el-descriptions-item>

        <el-descriptions-item :label="$t('common.status')">
          <el-tag :type="getStatusType(report.status)">
            {{ reportStatusLabel(report.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <p class="stats-basis">
        {{ $t('reports.statisticsBasis') }}
      </p>

      <el-divider>{{ $t('reports.assetStatistics') }}</el-divider>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic
            :title="$t('reports.totalAssets')"
            :value="report.total_assets || 0"
          >
            <template #suffix>
              <el-icon><Box /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic
            :title="$t('reports.activeAssets')"
            :value="report.active_assets || 0"
          >
            <template #prefix>
              <el-icon style="color: #67c23a">
                <CircleCheck />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic
            :title="$t('reports.damagedAssets')"
            :value="report.damaged_assets || 0"
          >
            <template #prefix>
              <el-icon style="color: #e6a23c">
                <Warning />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic
            :title="$t('reports.lostAssets')"
            :value="report.lost_assets || 0"
          >
            <template #prefix>
              <el-icon style="color: #f56c6c">
                <CircleClose />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <div class="total-value-card">
        <div class="label">
          {{ $t('reports.totalValue') }}
        </div>
        <div class="value">
          {{ formatCurrency(report.total_value) }}
        </div>
      </div>

      <el-divider>{{ $t('reports.notes') }}</el-divider>

      <div
        class="notes-section"
        :class="{ 'notes-section--empty': !report.notes }"
      >
        {{ report.notes || $t('reports.notesEmpty') }}
      </div>

      <template v-if="report.year_summary">
        <el-divider>{{ $t('reports.yearSummary.title') }}</el-divider>
        <p class="summary-lead">
          {{ $t('reports.yearSummary.lead') }}
        </p>
        <p class="summary-note">
          {{ $t('reports.yearSummary.stockExcluded') }}
        </p>

        <el-collapse
          v-model="summaryOpenPanels"
          class="year-summary-collapse"
        >
          <el-collapse-item
            name="snapshot"
            :title="$t('reports.yearSummary.snapshotTitle')"
          >
            <p class="scope-note">
              {{ $t('reports.yearSummary.snapshotScope') }}
            </p>
            <el-descriptions
              :column="2"
              border
              size="small"
              class="detail-block"
            >
              <el-descriptions-item :label="$t('reports.yearSummary.totalInScope')">
                {{ report.year_summary.assets_at_year_end?.total_in_scope ?? '—' }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('reports.yearSummary.totalValueLive')">
                {{ formatCurrency(report.year_summary.assets_at_year_end?.total_value_vnd) }}
              </el-descriptions-item>
            </el-descriptions>
            <p class="subheading">
              {{ $t('reports.yearSummary.byAssetStatus') }}
            </p>
            <el-table
              :data="assetStatusTableRows"
              size="small"
              border
              class="mini-table"
            >
              <el-table-column
                prop="label"
                :label="$t('reports.yearSummary.colStatus')"
                min-width="200"
              />
              <el-table-column
                prop="count"
                :label="$t('reports.yearSummary.colCount')"
                width="100"
                align="right"
              />
            </el-table>
          </el-collapse-item>

          <el-collapse-item
            name="activity"
            :title="$t('reports.yearSummary.activityTitle')"
          >
            <p class="scope-note">
              {{ $t('reports.yearSummary.activityScope') }}
            </p>

            <h4 class="activity-h4">
              {{ $t('reports.yearSummary.transfers') }}
            </h4>
            <el-descriptions
              :column="2"
              border
              size="small"
            >
              <el-descriptions-item :label="$t('reports.yearSummary.transferTotal')">
                {{ act.transfers?.total_involving_department ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('reports.yearSummary.transferOut')">
                {{ act.transfers?.outgoing_from_department ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('reports.yearSummary.transferIn')">
                {{ act.transfers?.incoming_to_department ?? 0 }}
              </el-descriptions-item>
            </el-descriptions>
            <el-table
              :data="transferStatusRows"
              size="small"
              border
              class="mini-table"
            >
              <el-table-column
                prop="label"
                :label="$t('reports.yearSummary.colStatus')"
              />
              <el-table-column
                prop="count"
                :label="$t('reports.yearSummary.colCount')"
                width="100"
                align="right"
              />
            </el-table>

            <h4 class="activity-h4">
              {{ $t('reports.yearSummary.maintenance') }}
            </h4>
            <el-descriptions
              :column="2"
              border
              size="small"
            >
              <el-descriptions-item :label="$t('reports.yearSummary.maintTotal')">
                {{ act.maintenance_requests?.total ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('reports.yearSummary.maintRepair')">
                {{ act.maintenance_requests?.repair ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('reports.yearSummary.maintProcurement')">
                {{ act.maintenance_requests?.procurement ?? 0 }}
              </el-descriptions-item>
            </el-descriptions>
            <el-table
              :data="maintenanceStatusRows"
              size="small"
              border
              class="mini-table"
            >
              <el-table-column
                prop="label"
                :label="$t('reports.yearSummary.colStatus')"
              />
              <el-table-column
                prop="count"
                :label="$t('reports.yearSummary.colCount')"
                width="100"
                align="right"
              />
            </el-table>

            <h4 class="activity-h4">
              {{ $t('reports.yearSummary.procurements') }}
            </h4>
            <el-descriptions
              :column="1"
              border
              size="small"
            >
              <el-descriptions-item :label="$t('reports.yearSummary.procTotal')">
                {{ act.procurements?.total ?? 0 }}
              </el-descriptions-item>
            </el-descriptions>
            <el-table
              :data="procurementStatusRows"
              size="small"
              border
              class="mini-table"
            >
              <el-table-column
                prop="label"
                :label="$t('reports.yearSummary.colStatus')"
              />
              <el-table-column
                prop="count"
                :label="$t('reports.yearSummary.colCount')"
                width="100"
                align="right"
              />
            </el-table>

            <h4 class="activity-h4">
              {{ $t('reports.yearSummary.disposals') }}
            </h4>
            <el-descriptions
              :column="1"
              border
              size="small"
            >
              <el-descriptions-item :label="$t('reports.yearSummary.dispTotal')">
                {{ act.disposal_cases?.total ?? 0 }}
              </el-descriptions-item>
            </el-descriptions>
            <p class="subheading subtle">
              {{ $t('reports.yearSummary.byCaseStatus') }}
            </p>
            <el-table
              :data="disposalStatusRows"
              size="small"
              border
              class="mini-table"
            >
              <el-table-column
                prop="label"
                :label="$t('reports.yearSummary.colStatus')"
              />
              <el-table-column
                prop="count"
                :label="$t('reports.yearSummary.colCount')"
                width="100"
                align="right"
              />
            </el-table>
            <p class="subheading subtle">
              {{ $t('reports.yearSummary.byDisposalType') }}
            </p>
            <el-table
              :data="disposalTypeRows"
              size="small"
              border
              class="mini-table"
            >
              <el-table-column
                prop="label"
                :label="$t('reports.yearSummary.colType')"
              />
              <el-table-column
                prop="count"
                :label="$t('reports.yearSummary.colCount')"
                width="100"
                align="right"
              />
            </el-table>

            <h4 class="activity-h4">
              {{ $t('reports.yearSummary.inventory') }}
            </h4>
            <el-descriptions
              :column="2"
              border
              size="small"
            >
              <el-descriptions-item :label="$t('reports.yearSummary.invCount')">
                {{ act.inventory_reports?.count ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('reports.yearSummary.invDiscSum')">
                {{ act.inventory_reports?.sum_total_discrepancy ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('reports.yearSummary.invDispSuggestSum')">
                {{ act.inventory_reports?.sum_disposal_suggestions ?? 0 }}
              </el-descriptions-item>
            </el-descriptions>
            <el-table
              :data="inventoryStatusRows"
              size="small"
              border
              class="mini-table"
            >
              <el-table-column
                prop="label"
                :label="$t('reports.yearSummary.colStatus')"
              />
              <el-table-column
                prop="count"
                :label="$t('reports.yearSummary.colCount')"
                width="100"
                align="right"
              />
            </el-table>

            <h4 class="activity-h4">
              {{ $t('reports.yearSummary.newAssets') }}
            </h4>
            <p class="scope-note">
              {{ $t('reports.yearSummary.newAssetsScope') }}
            </p>
            <el-descriptions
              :column="1"
              border
              size="small"
            >
              <el-descriptions-item :label="$t('reports.yearSummary.newAssetsCount')">
                {{ act.new_or_purchased_assets_recorded ?? 0 }}
              </el-descriptions-item>
            </el-descriptions>
          </el-collapse-item>
        </el-collapse>
      </template>

      <el-divider>{{ $t('reports.workflowRoles') }}</el-divider>

      <el-descriptions
        :column="1"
        border
        size="small"
        class="detail-block"
      >
        <el-descriptions-item :label="$t('reports.roleInitiator')">
          {{ $t('reports.roleInitiatorDesc') }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('reports.roleApprover')">
          {{ $t('reports.roleApproverDesc') }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider>{{ $t('common.auditInfo') }}</el-divider>

      <el-descriptions
        :column="2"
        border
        size="small"
      >
        <el-descriptions-item :label="$t('reports.createdBy')">
          {{ displayUser(report.creator) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('common.createdAt')">
          {{ formatDateTime(report.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('reports.submittedBy')">
          {{ displayUser(report.submitter) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('reports.submittedAt')">
          {{ formatDateTime(report.submitted_date) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="report.status === 'approved'"
          :label="$t('reports.approvedBy')"
        >
          {{ displayUser(report.approver) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="report.status === 'approved'"
          :label="$t('reports.approvedAt')"
        >
          {{ formatDateTime(report.approved_date) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="report.status === 'rejected'"
          :label="$t('reports.rejectedBy')"
        >
          {{ displayUser(report.approver) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="report.status === 'rejected'"
          :label="$t('reports.rejectedAt')"
        >
          {{ formatDateTime(report.approved_date || report.updated_at) }}
        </el-descriptions-item>
        <el-descriptions-item
          :label="$t('common.updatedAt')"
        >
          {{ formatDateTime(report.updated_at) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider>{{ $t('reports.statusHistory') }}</el-divider>

      <el-timeline>
        <el-timeline-item
          placement="top"
          type="primary"
          :hollow="report.status !== 'draft'"
        >
          <div class="timeline-content">
            <strong>{{ $t('reports.status.draft') }}</strong>
            <p>{{ $t('reports.draftDescription') }}</p>
            <small>{{ formatDateTime(report.created_at) }}</small>
          </div>
        </el-timeline-item>

        <el-timeline-item
          v-if="report.submitted_date"
          placement="top"
          type="warning"
          :hollow="report.status === 'submitted'"
        >
          <div class="timeline-content">
            <strong>{{ $t('reports.status.submitted') }}</strong>
            <p>{{ $t('reports.submittedDescriptionDetail', { name: displayUser(report.submitter) }) }}</p>
            <small>{{ formatDateTime(report.submitted_date) }}</small>
          </div>
        </el-timeline-item>

        <el-timeline-item
          v-if="report.status === 'approved' && report.approved_date"
          placement="top"
          type="success"
        >
          <div class="timeline-content">
            <strong>{{ $t('reports.status.approved') }}</strong>
            <p>{{ $t('reports.approvedDescriptionDetail', { name: displayUser(report.approver) }) }}</p>
            <small>{{ formatDateTime(report.approved_date) }}</small>
          </div>
        </el-timeline-item>

        <el-timeline-item
          v-if="report.status === 'rejected'"
          placement="top"
          type="danger"
        >
          <div class="timeline-content">
            <strong>{{ $t('reports.status.rejected') }}</strong>
            <p>{{ $t('reports.rejectedDescriptionDetail', { name: displayUser(report.approver) }) }}</p>
            <small>{{ formatDateTime(report.approved_date || report.updated_at) }}</small>
          </div>
        </el-timeline-item>
      </el-timeline>
    </template>

    <template #footer>
      <div class="detail-footer">
        <div class="detail-footer__left">
          <el-button
            v-if="report.status === 'submitted' && canApproveInDetail"
            type="success"
            :loading="actionLoading"
            @click="onApprove"
          >
            {{ $t('reports.approve') }}
          </el-button>
          <el-button
            v-if="report.status === 'submitted' && canApproveInDetail"
            type="danger"
            :loading="actionLoading"
            @click="onReject"
          >
            {{ $t('reports.reject') }}
          </el-button>
        </div>
        <el-button @click="emit('update:visible', false)">
          {{ $t('common.close') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Box, CircleCheck, Warning, CircleClose } from '@element-plus/icons-vue';
import { formatI18nOrRaw } from '@/utils/assetDisplay';
import { useAuthStore } from '@/stores/auth.store';
import { useReportStore } from '@/stores/report.store';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps<{
  visible: boolean;
  report?: any;
}>();

const { t, te } = useI18n();

const reportStatusLabel = (status: string | null | undefined) =>
  formatI18nOrRaw('reports.status', status, t, te);

const authStore = useAuthStore();
const reportStore = useReportStore();

const actionLoading = ref(false);
const canApproveInDetail = computed(() => authStore.isAdmin || authStore.isDirector);

const apiErr = (e: any) =>
  e?.response?.data?.message || e?.response?.data?.error || e?.message || t('common.error');

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'report-updated': [];
}>();

async function onApprove() {
  if (!props.report?.id) return;
  try {
    await ElMessageBox.confirm(t('reports.approveConfirm'), t('common.confirm'), {
      type: 'warning',
    });
    actionLoading.value = true;
    await reportStore.approveReport(props.report.id);
    ElMessage.success(t('reports.approveSuccess'));
    emit('report-updated');
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(apiErr(e));
  } finally {
    actionLoading.value = false;
  }
}

async function onReject() {
  if (!props.report?.id) return;
  try {
    const { value: notes } = await ElMessageBox.prompt(
      t('reports.rejectConfirm'),
      t('common.confirm'),
      {
        confirmButtonText: t('reports.reject'),
        cancelButtonText: t('common.cancel'),
        inputPlaceholder: t('reports.rejectReasonHint'),
        type: 'warning',
      }
    );
    actionLoading.value = true;
    await reportStore.rejectReport(props.report.id, notes || '');
    ElMessage.success(t('reports.rejectSuccess'));
    emit('report-updated');
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(apiErr(e));
  } finally {
    actionLoading.value = false;
  }
}

const summaryOpenPanels = ref(['snapshot', 'activity']);

const act = computed(() => props.report?.year_summary?.activity_in_calendar_year ?? {});

function mapBreakdown(obj: Record<string, number> | undefined, i18nPrefix: string) {
  if (!obj) return [];
  return Object.entries(obj).map(([code, count]) => ({
    label: te(`${i18nPrefix}.${code}`) ? t(`${i18nPrefix}.${code}`) : code,
    count,
  }));
}

const assetStatusTableRows = computed(() =>
  mapBreakdown(props.report?.year_summary?.assets_at_year_end?.by_status, 'reports.yearSummary.assetStatus')
);
const transferStatusRows = computed(() =>
  mapBreakdown(act.value.transfers?.by_status, 'reports.yearSummary.transferStatus')
);
const maintenanceStatusRows = computed(() =>
  mapBreakdown(act.value.maintenance_requests?.by_status, 'reports.yearSummary.maintStatus')
);
const procurementStatusRows = computed(() =>
  mapBreakdown(act.value.procurements?.by_status, 'reports.yearSummary.procurementStatus')
);
const disposalStatusRows = computed(() =>
  mapBreakdown(act.value.disposal_cases?.by_status, 'reports.yearSummary.disposalCaseStatus')
);
const disposalTypeRows = computed(() =>
  mapBreakdown(act.value.disposal_cases?.by_disposal_type, 'reports.yearSummary.disposalType')
);
const inventoryStatusRows = computed(() =>
  mapBreakdown(act.value.inventory_reports?.by_status, 'reports.yearSummary.inventoryReportStatus')
);

const displayUser = (u: { fullname?: string; username?: string } | null | undefined) => {
  if (!u) return '—';
  return u.fullname?.trim() || u.username || '—';
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return types[status] || 'info';
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);
};

const formatDateTime = (date: string) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('vi-VN');
};
</script>

<style scoped>
.detail-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.detail-footer__left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-block {
  margin-top: 8px;
}

.stats-basis {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.total-value-card {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  text-align: center;
  color: white;
}

.total-value-card .label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 5px;
}

.total-value-card .value {
  font-size: 28px;
  font-weight: bold;
}

.notes-section {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  white-space: pre-wrap;
}

.notes-section--empty {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.timeline-content {
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.timeline-content strong {
  display: block;
  margin-bottom: 5px;
}

.timeline-content p {
  margin: 0 0 5px;
  color: #606266;
  font-size: 13px;
}

.timeline-content small {
  color: #909399;
}

.summary-lead,
.summary-note,
.scope-note {
  font-size: 13px;
  line-height: 1.55;
  color: var(--el-text-color-secondary);
  margin: 0 0 10px;
}

.summary-note {
  margin-bottom: 16px;
}

.year-summary-collapse {
  margin-bottom: 8px;
}

.activity-h4 {
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.subheading {
  margin: 12px 0 8px;
  font-size: 13px;
  font-weight: 600;
}

.subheading.subtle {
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.mini-table {
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  :deep(.el-col) {
    width: 100% !important;
    max-width: 100% !important;
  }
}
</style>
