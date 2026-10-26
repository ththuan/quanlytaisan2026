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

      <!-- Chữ ký số các bên -->
      <div
        v-if="signatureBlocks.length > 0"
        class="transfer-signature-section"
      >
        <div class="timeline-title">
          Chữ ký số
        </div>
        <div
          v-for="block in signatureBlocks"
          :key="block.label"
          class="transfer-signature-box"
        >
          <img
            :src="block.sig.signature_image"
            alt="Chữ ký số"
            class="transfer-signature-img"
          >
          <div class="transfer-signature-meta">
            <strong>{{ block.label }}</strong>
            <span>{{ block.sig.signer_name }}</span>
            <span>{{ formatDate(block.sig.signed_at) }}</span>
          </div>
        </div>
      </div>

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
      <el-button
        v-if="canApprove"
        type="success"
        @click="handleApproval('approved')"
      >
        {{ $t('transfers.approve') }}
      </el-button>
      <el-button
        v-if="canApprove"
        type="danger"
        @click="handleApproval('rejected')"
      >
        {{ $t('transfers.reject') }}
      </el-button>
      <el-button
        :icon="Printer"
        @click="handlePrint"
      >
        {{ $t('common.print') }}
      </el-button>
      <el-button @click="$emit('update:visible', false)">
        {{ $t('common.close') }}
      </el-button>
    </template>
  </el-dialog>

  <SignaturePad
    v-model="showSignDialog"
    :title="signTitle"
    :signer-name="signerName"
    @confirm="onSignConfirm"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment';
import api from '@/services/api';
import { Printer } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth.store';
import { useTransferStore } from '@/stores/transfer.store';
import { useSignature } from '@/composables/useSignature';
import SignaturePad from '@/components/Common/SignaturePad.vue';
import { openPrintWindow, signatureCell } from '@/utils/print';

const props = defineProps<{
  visible: boolean;
  transfer: any;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  approved: [transfer: any];
}>();

const { t } = useI18n();
const authStore = useAuthStore();
const transferStore = useTransferStore();
const approvalHistory = ref<any[]>([]);
const signatures = ref<any[]>([]);
const creatorSignature = computed(() => signatures.value.find((s) => s.action === 'create'));
const receiverSignature = computed(() => signatures.value.find((s) => s.action === 'receive'));
const adminSignature = computed(() => signatures.value.find((s) => s.action === 'approve'));
const signatureBlocks = computed(() => [
  { label: 'Người tạo đề nghị', sig: creatorSignature.value },
  { label: 'Đơn vị nhận ký', sig: receiverSignature.value },
  { label: 'Quản trị viên ký duyệt', sig: adminSignature.value },
].filter((b) => !!b.sig) as { label: string; sig: any }[]);

const {
  show: showSignDialog,
  title: signTitle,
  signerName,
  request: requestSignature,
  onConfirm: onSignConfirm,
} = useSignature();

const canApprove = computed(() => {
  const transfer = props.transfer;
  if (!transfer) return false;
  const departmentId = Number(authStore.user?.department_id);
  if (authStore.isAdmin) return transfer.status === 'approved_by_destination';
  if (transfer.status === 'pending') {
    return authStore.user?.role === 'department_head'
      && departmentId === Number(transfer.from_department_id);
  }
  if (transfer.status === 'approved_by_head') {
    return ['department_head', 'staff'].includes(authStore.user?.role || '')
      && departmentId === Number(transfer.to_department_id);
  }
  return false;
});

const handleApproval = async (decision: 'approved' | 'rejected') => {
  if (!props.transfer) return;
  try {
    let reason: string | undefined;
    if (decision === 'rejected') {
      const result = await ElMessageBox.prompt(t('transfers.rejectReason'), t('transfers.reject'), {
        inputValidator: (value: string) => String(value || '').trim() ? true : t('transfers.rejectReasonRequired'),
      });
      reason = String(result.value).trim();
    } else {
      await ElMessageBox.confirm(t('transfers.approveConfirm'), t('common.confirm'));
    }

    const signature = await requestSignature(
      decision === 'approved'
        ? 'Ký xác nhận duyệt điều chuyển tài sản'
        : 'Ký xác nhận từ chối điều chuyển tài sản',
    );
    if (!signature) return;

    const updated = await transferStore.processApproval(props.transfer.id, decision, reason, undefined, signature);
    ElMessage.success(decision === 'approved' ? t('transfers.approveSuccess') : t('transfers.rejectSuccess'));
    emit('approved', updated);
    emit('update:visible', false);
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.response?.data?.message || error?.message || t('common.error'));
    }
  }
};

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
            : item.approver_role === 'staff'
              ? 'Viên chức đơn vị nhận'
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
      try {
        const sigRes: any = await api.get('/signatures', {
          params: { entity_type: 'asset_transfer', entity_id: id },
        });
        signatures.value = sigRes?.data ?? [];
      } catch {
        signatures.value = [];
      }
    } else {
      approvalHistory.value = [];
      signatures.value = [];
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
    approved_by_head: 'primary',
    rejected_by_head: 'danger',
  };
  return types[status] || '';
};

const getStatusText = (status: string) => {
  return t(`transfers.status.${status}`);
};

const formatDate = (date: string) => {
  return date ? moment(date).format('DD/MM/YYYY HH:mm') : '-';
};

const escapeHtml = (value: unknown) => String(value ?? '-')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const handlePrint = () => {
  if (!props.transfer) return;

  const transfer = props.transfer;
  const approvals = approvalTimeline.value.map((item) => `
    <tr>
      <td>${escapeHtml(item.date)}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>${escapeHtml(item.actor)}</td>
      <td>${escapeHtml(item.reason || '')}</td>
    </tr>
  `).join('');

  const body = `
    <h1>Phiếu điều chuyển tài sản</h1>
    <div class="subtitle">Mã phiếu: DC-${escapeHtml(transfer.id)} | Ngày lập: ${escapeHtml(formatDate(transfer.created_at))}</div>
    <table>
      <tr><th>Mã tài sản</th><td>${escapeHtml(transfer.asset?.asset_code)}</td><th>Tên tài sản</th><td>${escapeHtml(transfer.asset?.name)}</td></tr>
      <tr><th>Đơn vị giao</th><td>${escapeHtml(transfer.from_department?.name)}</td><th>Đơn vị nhận</th><td>${escapeHtml(transfer.to_department?.name)}</td></tr>
      <tr><th>Người đề nghị</th><td>${escapeHtml(transfer.requester?.fullname || transfer.requester?.username)}</td><th>Trạng thái</th><td>${escapeHtml(getStatusText(transfer.status))}</td></tr>
      <tr><th>Lý do</th><td colspan="3">${escapeHtml(transfer.reason)}</td></tr>
      <tr><th>Ghi chú</th><td colspan="3">${escapeHtml(transfer.notes)}</td></tr>
    </table>
    ${approvals ? `<h3>Lịch sử phê duyệt</h3><table class="history"><thead><tr><th>Thời gian</th><th>Thao tác</th><th>Người thực hiện</th><th>Lý do/Ghi chú</th></tr></thead><tbody>${approvals}</tbody></table>` : ''}
    <div class="signatures">
      ${signatureCell('Người tạo đề nghị', creatorSignature.value)}
      ${signatureCell('Đơn vị nhận', receiverSignature.value)}
      ${signatureCell('Quản trị viên duyệt', adminSignature.value)}
    </div>`;

  const extraStyles = `
    @page { size: A4; margin: 18mm; }
    body { font-family: Arial, sans-serif; color: #111; font-size: 13px; line-height: 1.45; }
    h1 { margin: 18px 0 4px; text-align: center; font-size: 20px; text-transform: uppercase; }
    .subtitle { text-align: center; margin-bottom: 24px; color: #444; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th, td { border: 1px solid #444; padding: 8px; vertical-align: top; }
    th { background: #f2f2f2; text-align: left; width: 22%; }
    .history th { width: auto; text-align: center; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: 34px; text-align: center; }
    .signature-space { height: 70px; }
  `;

  openPrintWindow(`Phiếu điều chuyển ${transfer.asset?.asset_code || ''}`, body, extraStyles);
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
.transfer-signature-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.transfer-signature-box {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}
.transfer-signature-img {
  max-width: 300px;
  max-height: 110px;
  object-fit: contain;
}
.transfer-signature-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12.5px;
  color: #64748b;
}
.transfer-signature-meta strong {
  color: #0f172a;
  font-size: 14px;
}
</style>
