<template>
  <el-dialog
    :model-value="visible"
    :title="$t('transfers.transferDetail')"
    width="680px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template v-if="transfer">
      <el-descriptions
        :column="2"
        border
      >
        <el-descriptions-item :label="$t('transfers.assetCode')">
          {{ transfer.asset?.asset_code }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('transfers.assetName')">
          {{ transfer.asset?.name }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('transfers.fromDepartment')">
          {{ transfer.from_department?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('transfers.toDepartment')">
          {{ transfer.to_department?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('transfers.requestedBy')">
          {{ transfer.requester?.fullname || transfer.requester?.username }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('transfers.approvedBy')">
          {{ transfer.approver?.fullname || transfer.approver?.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">
          <el-tag :type="getStatusType(transfer.status)">
            {{ getStatusText(transfer.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('transfers.transferDate')">
          {{ formatDate(transfer.transfer_date) }}
        </el-descriptions-item>
        <el-descriptions-item
          :label="$t('transfers.reason')"
          :span="2"
        >
          {{ transfer.reason || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          :label="$t('transfers.notes')"
          :span="2"
        >
          {{ transfer.notes || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- Timeline phê duyệt -->
      <div
        v-if="approvalTimeline.length > 0"
        class="approval-timeline-section"
      >
        <div class="timeline-title">
          {{ $t('common.auditInfo') }}
        </div>
        <el-timeline>
          <el-timeline-item
            v-for="(item, idx) in approvalTimeline"
            :key="idx"
            :timestamp="item.date"
            :type="item.type"
            placement="top"
          >
            <div class="timeline-content">
              <span class="timeline-label">{{ item.label }}</span>
              <span
                v-if="item.actor"
                class="timeline-actor"
              >{{ item.actor }}</span>
              <p
                v-if="item.reason"
                class="timeline-reason"
              >
                {{ item.reason }}
              </p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </template>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">
        {{ $t('common.close') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment';
import api from '@/services/api';

const props = defineProps<{
  visible: boolean;
  transfer: any;
}>();

defineEmits<{
  'update:visible': [value: boolean];
}>();

const { t } = useI18n();
const approvalHistory = ref<any[]>([]);

const approvalTimeline = computed(() => {
  const list: { date: string; label: string; type: string; actor?: string; reason?: string }[] = [];
  if (props.transfer?.created_at) {
    list.push({
      date: formatDate(props.transfer.created_at),
      label: 'Yêu cầu điều chuyển được tạo',
      type: 'primary',
      actor: props.transfer.requester?.fullname || props.transfer.requester?.username,
    });
  }
  (approvalHistory.value || []).forEach((item: any) => {
    const isApproved = item.decision === 'approved';
    const roleLabel =
      item.approver_role === 'department_head'
        ? 'Trưởng Đơn vị'
        : item.approver_role === 'admin'
          ? 'Quản trị viên'
          : item.approver_role === 'director'
            ? 'Giám hiệu'
            : '';
    list.push({
      date: formatDate(item.decided_at),
      label: isApproved ? `Đã duyệt (${roleLabel})` : `Từ chối (${roleLabel})`,
      type: isApproved ? 'success' : 'danger',
      actor: item.approver?.fullname || item.approver_name,
      reason: !isApproved ? item.reason : undefined,
    });
  });
  return list;
});

watch(
  () => [props.visible, props.transfer?.id],
  async ([visible, id]) => {
    if (visible && id) {
      try {
        const res: any = await api.get(`/transfers/${id}/approval-history`);
        approvalHistory.value = res?.data ?? [];
      } catch {
        approvalHistory.value = [];
      }
    } else {
      approvalHistory.value = [];
    }
  },
  { immediate: true }
);

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'info',
  };
  return types[status] || '';
};

const getStatusText = (status: string) => {
  return t(`transfers.status.${status}`);
};

const formatDate = (date: string) => {
  return date ? moment(date).format('DD/MM/YYYY HH:mm') : '-';
};
</script>

<style scoped>
.approval-timeline-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
.timeline-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  font-size: 14px;
}
.timeline-content {
  font-size: 13px;
}
.timeline-label {
  font-weight: 500;
  color: #303133;
}
.timeline-actor {
  color: #606266;
  margin-left: 6px;
}
.timeline-reason {
  margin: 6px 0 0 0;
  color: #909399;
  font-size: 12px;
}
</style>
