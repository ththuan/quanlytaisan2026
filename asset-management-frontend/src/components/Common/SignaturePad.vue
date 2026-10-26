<template>
  <el-dialog
    :model-value="modelValue"
    :title="title || 'Ký xác nhận'"
    :width="isMobile ? '95vw' : '480px'"
    :close-on-click-modal="false"
    append-to-body
    class="signature-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
    @open="onOpen"
  >
    <div class="digital-card">
      <div class="signer-row">
        <div class="signer-avatar">
          {{ initials }}
        </div>
        <div class="signer-meta">
          <div class="signer-name">
            {{ signerName || '—' }}
          </div>
          <div class="signer-sub">
            {{ signerRoleLabel }}
          </div>
        </div>
        <el-tag
          type="success"
          effect="light"
          size="small"
          round
        >
          <el-icon class="tag-icon">
            <CircleCheck />
          </el-icon>
          Đã xác thực
        </el-tag>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Đơn vị</span>
          <span class="info-value">{{ departmentName || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Thời gian ký</span>
          <span class="info-value">{{ signedAtText }}</span>
        </div>
      </div>

      <div class="digital-preview">
        <canvas
          ref="digitalCanvasRef"
          class="digital-signature-canvas"
        />
      </div>

      <div class="digital-note">
        <el-icon><Lock /></el-icon>
        Chữ ký được xác thực bằng tài khoản đăng nhập và lưu vết cùng thời gian ký.
      </div>
    </div>
    <template #footer>
      <el-button @click="close">
        Hủy
      </el-button>
      <el-button
        type="primary"
        :disabled="!signerName.trim()"
        @click="confirm"
      >
        Ký số xác nhận
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { CircleCheck, Lock } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth.store';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  signerName?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [boolean];
  confirm: [string];
}>();

const authStore = useAuthStore();

const digitalCanvasRef = ref<HTMLCanvasElement | null>(null);
const isMobile = computed(() => window.innerWidth <= 768);

const signerName = computed(() => props.signerName || authStore.user?.fullname || authStore.user?.username || '');
const departmentName = computed(() => authStore.user?.department?.name || '');
const initials = computed(() => {
  const name = signerName.value.trim();
  if (!name) return '?';
  const parts = name.split(/\s+/);
  return (parts[parts.length - 1]?.charAt(0) || '') + (parts.length > 1 ? parts[0].charAt(0) : '');
});

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  director: 'Giám hiệu',
  department_head: 'Trưởng đơn vị',
  manager: 'Quản lý',
  staff: 'Viên chức',
  user: 'Viên chức',
};
const signerRoleLabel = computed(() => ROLE_LABELS[authStore.user?.role || ''] || 'Người ký');

const signedAtText = ref('');
const updateSignedAt = () => {
  signedAtText.value = new Date().toLocaleString('vi-VN', { hour12: false });
};

const formatSignDate = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} +07'00'`;
};

/**
 * Vẽ khối chữ ký số theo chuẩn hiển thị của Adobe Acrobat:
 * dấu check xác thực + "Digitally signed by ..." + "Date: ...".
 */
const drawDigitalSignature = () => {
  const canvas = digitalCanvasRef.value;
  if (!canvas) return;
  const W = 820;
  const H = 300;
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  if (!c) return;

  c.clearRect(0, 0, W, H);

  const name = signerName.value.trim();
  if (!name) return;

  // Dấu check xanh mờ làm nền phía sau chữ (watermark xác thực)
  c.save();
  c.strokeStyle = 'rgba(22, 163, 74, 0.10)';
  c.lineWidth = 10;
  c.beginPath();
  c.arc(410, 150, 128, 0, Math.PI * 2);
  c.stroke();

  c.strokeStyle = 'rgba(22, 163, 74, 0.14)';
  c.lineWidth = 28;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(320, 148);
  c.lineTo(375, 208);
  c.lineTo(505, 68);
  c.stroke();
  c.restore();

  // Khối nội dung chuẩn "Digitally signed by / Date"
  const rx = 40;
  const maxTextWidth = W - rx - 24;

  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#111827';
  c.font = '600 31px Inter, Arial, sans-serif';
  c.fillText('Digitally signed', rx, 78);

  let nameSize = 31;
  const setNameFont = (s: number) => {
    c.font = `400 ${s}px Inter, Arial, sans-serif`;
  };
  setNameFont(nameSize);
  while (c.measureText(`by ${name}`).width > maxTextWidth && nameSize > 16) {
    nameSize -= 1;
    setNameFont(nameSize);
  }
  c.fillText(`by ${name}`, rx, 118);

  const subline = [signerRoleLabel.value, departmentName.value].filter(Boolean).join(' • ');
  if (subline) {
    c.font = '400 15px Inter, Arial, sans-serif';
    c.fillStyle = '#4b5563';
    c.fillText(subline, rx, 146);
  }

  c.fillStyle = '#111827';
  c.font = '400 26px Inter, Arial, sans-serif';
  c.fillText('Date:', rx, 188);

  let dateSize = 26;
  const setDateFont = (s: number) => {
    c.font = `400 ${s}px Inter, Arial, sans-serif`;
  };
  setDateFont(dateSize);
  const dateText = formatSignDate();
  while (c.measureText(dateText).width > maxTextWidth && dateSize > 16) {
    dateSize -= 1;
    setDateFont(dateSize);
  }
  c.fillText(dateText, rx, 222);
};

const onOpen = () => {
  updateSignedAt();
  requestAnimationFrame(() => drawDigitalSignature());
};

const close = () => emit('update:modelValue', false);

const confirm = () => {
  const canvas = digitalCanvasRef.value;
  if (!canvas) return;
  emit('confirm', canvas.toDataURL('image/png'));
  emit('update:modelValue', false);
};
</script>

<style scoped>
.digital-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 45%);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.signer-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.signer-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #0f766e 100%);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.signer-meta {
  flex: 1;
  min-width: 0;
}

.signer-name {
  font-weight: 700;
  font-size: 15.5px;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signer-sub {
  font-size: 12.5px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-icon {
  margin-right: 3px;
  vertical-align: -2px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f1f5f9;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 13px;
}

.info-label {
  color: #64748b;
  flex-shrink: 0;
}

.info-value {
  color: #0f172a;
  font-weight: 600;
  text-align: right;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.digital-preview {
  position: relative;
  border: 1.5px dashed #cbd5e1;
  border-radius: 12px;
  background:
    radial-gradient(circle at 88% 18%, rgba(37, 99, 235, 0.06), transparent 45%),
    #fff;
  padding: 10px 12px;
}

.digital-signature-canvas {
  display: block;
  width: 100%;
  height: auto;
}

.digital-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}

.digital-note .el-icon {
  margin-top: 2px;
  color: #15803d;
  flex-shrink: 0;
}
</style>
