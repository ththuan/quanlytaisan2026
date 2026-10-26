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
        <span class="preview-badge">
          <el-icon><Lock /></el-icon>
          Chữ ký số
        </span>
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

const drawArcText = (
  c: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  start: number,
  end: number,
  font: string,
  color: string,
) => {
  c.save();
  c.fillStyle = color;
  c.font = font;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const step = (end - start) / text.length;
  for (let i = 0; i < text.length; i += 1) {
    const angle = start + step * (i + 0.5);
    c.save();
    c.translate(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    c.rotate(angle + Math.PI / 2);
    c.fillText(text[i], 0, 0);
    c.restore();
  }
  c.restore();
};

const drawDigitalSignature = () => {
  const canvas = digitalCanvasRef.value;
  if (!canvas) return;
  const W = 820;
  const H = 240;
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  if (!c) return;

  c.clearRect(0, 0, W, H);

  const name = signerName.value.trim();
  if (!name) return;

  const blue = '#1d4ed8';
  const ink = c.createLinearGradient(80, 50, 520, 170);
  ink.addColorStop(0, '#1d4ed8');
  ink.addColorStop(1, '#0f766e');

  let size = 56;
  const maxWidth = 440;
  const setFont = (s: number) => {
    c.font = `italic 700 ${s}px "Segoe Script", "Brush Script MT", "Times New Roman", serif`;
  };
  setFont(size);
  while (c.measureText(name).width > maxWidth && size > 24) {
    size -= 2;
    setFont(size);
  }

  const cx = 270;
  const cy = 108;

  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = ink;
  c.fillText(name, cx, cy);

  const textWidth = Math.min(c.measureText(name).width, maxWidth);
  const flourishY = cy + size * 0.72;
  c.strokeStyle = ink;
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(cx - textWidth / 2 - 14, flourishY);
  c.bezierCurveTo(
    cx - textWidth / 4,
    flourishY + 14,
    cx + textWidth / 4,
    flourishY - 10,
    cx + textWidth / 2 + 14,
    flourishY + 2,
  );
  c.stroke();

  // Con dấu "ĐÃ KÝ SỐ" kiểu hóa đơn điện tử
  const sx = 650;
  const sy = 112;
  const r = 84;

  c.strokeStyle = blue;
  c.lineWidth = 5;
  c.beginPath();
  c.arc(sx, sy, r, 0, Math.PI * 2);
  c.stroke();

  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(sx, sy, r - 8, 0, Math.PI * 2);
  c.stroke();

  drawArcText(
    c,
    'CHỮ KÝ ĐIỆN TỬ',
    sx,
    sy,
    r - 20,
    Math.PI * 1.08,
    Math.PI * 1.92,
    '600 11px Inter, Arial, sans-serif',
    blue,
  );

  // Dấu check
  c.strokeStyle = '#15803d';
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(sx - 16, sy - 8);
  c.lineTo(sx - 3, sy + 6);
  c.lineTo(sx + 20, sy - 20);
  c.stroke();

  c.fillStyle = blue;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = '700 16px Inter, Arial, sans-serif';
  c.fillText('ĐÃ KÝ SỐ', sx, sy + 28);

  c.font = '500 12px Inter, Arial, sans-serif';
  c.fillStyle = '#475569';
  c.fillText(new Date().toLocaleDateString('vi-VN'), sx, sy + 50);
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

.preview-badge {
  position: absolute;
  top: 8px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  color: #15803d;
  font-size: 11px;
  font-weight: 600;
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
