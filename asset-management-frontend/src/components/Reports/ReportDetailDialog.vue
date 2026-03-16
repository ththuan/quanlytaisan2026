<template>
  <el-dialog
    :model-value="visible"
    :title="$t('reports.reportDetail')"
    width="700px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template v-if="report">
      <el-descriptions
        :column="2"
        border
      >
        <el-descriptions-item
          :label="$t('reports.department')"
          :span="2"
        >
          <el-tag>{{ report.Department?.name || '-' }}</el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item :label="$t('reports.year')">
          <strong>{{ report.year }}</strong>
        </el-descriptions-item>
        
        <el-descriptions-item :label="$t('reports.status')">
          <el-tag :type="getStatusType(report.status)">
            {{ $t(`reports.status.${report.status}`) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

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

      <el-divider v-if="report.notes">
        {{ $t('reports.notes') }}
      </el-divider>
      
      <div
        v-if="report.notes"
        class="notes-section"
      >
        {{ report.notes }}
      </div>

      <el-divider>{{ $t('common.auditInfo') }}</el-divider>

      <el-descriptions
        :column="2"
        border
        size="small"
      >
        <el-descriptions-item :label="$t('reports.createdBy')">
          {{ report.CreatedBy?.full_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('common.createdAt')">
          {{ formatDateTime(report.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="report.submitted_at"
          :label="$t('reports.submittedAt')"
        >
          {{ formatDateTime(report.submitted_at) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="report.approved_by"
          :label="$t('reports.approvedBy')"
        >
          {{ report.ApprovedBy?.full_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="report.approved_at"
          :label="$t('reports.approvedAt')"
        >
          {{ formatDateTime(report.approved_at) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- Status Timeline -->
      <el-divider>{{ $t('reports.statusHistory') }}</el-divider>
      
      <el-timeline>
        <el-timeline-item
          timestamp=""
          placement="top"
          type="primary"
          :hollow="report.status === 'draft'"
        >
          <div class="timeline-content">
            <strong>{{ $t('reports.status.draft') }}</strong>
            <p>{{ $t('reports.draftDescription') }}</p>
            <small>{{ formatDateTime(report.created_at) }}</small>
          </div>
        </el-timeline-item>
        
        <el-timeline-item
          v-if="report.submitted_at"
          timestamp=""
          placement="top"
          type="warning"
          :hollow="report.status === 'submitted'"
        >
          <div class="timeline-content">
            <strong>{{ $t('reports.status.submitted') }}</strong>
            <p>{{ $t('reports.submittedDescription') }}</p>
            <small>{{ formatDateTime(report.submitted_at) }}</small>
          </div>
        </el-timeline-item>
        
        <el-timeline-item
          v-if="report.approved_at"
          timestamp=""
          placement="top"
          type="success"
        >
          <div class="timeline-content">
            <strong>{{ $t('reports.status.approved') }}</strong>
            <p>{{ $t('reports.approvedDescription') }}</p>
            <small>{{ formatDateTime(report.approved_at) }}</small>
          </div>
        </el-timeline-item>
      </el-timeline>
    </template>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">
        {{ $t('common.close') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Box, CircleCheck, Warning, CircleClose } from '@element-plus/icons-vue';

defineProps<{
  visible: boolean;
  report?: any;
}>();

defineEmits<{
  'update:visible': [value: boolean];
}>();

useI18n();

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
  if (!date) return '-';
  return new Date(date).toLocaleString('vi-VN');
};
</script>

<style scoped>
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
</style>
