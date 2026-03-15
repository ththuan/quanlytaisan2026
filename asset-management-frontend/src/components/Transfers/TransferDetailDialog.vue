<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="$t('transfers.transferDetail')"
    width="650px"
  >
    <el-descriptions :column="2" border v-if="transfer">
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
        <el-tag :type="getStatusType(transfer.status)">{{ getStatusText(transfer.status) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('transfers.transferDate')">
        {{ formatDate(transfer.transfer_date) }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('transfers.reason')" :span="2">
        {{ transfer.reason || '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('transfers.notes')" :span="2">
        {{ transfer.notes || '-' }}
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">{{ $t('common.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import moment from 'moment';

defineProps<{
  visible: boolean;
  transfer: any;
}>();

defineEmits<{
  'update:visible': [value: boolean];
}>();

const { t } = useI18n();

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
