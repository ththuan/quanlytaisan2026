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
    <div class="signature-wrap">
      <div class="signature-hint">
        <span>Người ký:</span>
        <strong>{{ signerName || '—' }}</strong>
      </div>
      <div class="signature-canvas-box">
        <canvas
          ref="canvasRef"
          class="signature-canvas"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointerleave="onPointerUp"
          @pointercancel="onPointerUp"
        />
        <span
          v-if="!hasInk"
          class="signature-placeholder"
        >Ký tay vào khung này</span>
      </div>
      <div class="signature-tools">
        <el-button
          text
          :icon="Delete"
          @click="clearCanvas"
        >
          Xóa
        </el-button>
        <span class="signature-note">Chữ ký được lưu vết kèm người ký và thời gian.</span>
      </div>
    </div>
    <template #footer>
      <el-button @click="close">Hủy</el-button>
      <el-button
        type="primary"
        :disabled="!hasInk"
        @click="confirm"
      >
        Xác nhận &amp; Ký
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Delete } from '@element-plus/icons-vue';

defineProps<{
  modelValue: boolean;
  title?: string;
  signerName?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [boolean];
  confirm: [string];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const hasInk = ref(false);
const isMobile = computed(() => window.innerWidth <= 768);

let ctx: CanvasRenderingContext2D | null = null;
let drawing = false;
let last = { x: 0, y: 0 };

const setupCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 440;
  const h = rect.height || 200;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#111827';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  hasInk.value = false;
};

const onOpen = () => {
  // Đợi dialog render xong để lấy đúng kích thước canvas
  requestAnimationFrame(setupCanvas);
};

const pos = (e: PointerEvent) => {
  const canvas = canvasRef.value!;
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const onPointerDown = (e: PointerEvent) => {
  if (!ctx) return;
  drawing = true;
  last = pos(e);
  try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
};

const onPointerMove = (e: PointerEvent) => {
  if (!drawing || !ctx) return;
  const p = pos(e);
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  last = p;
  hasInk.value = true;
};

const onPointerUp = () => {
  drawing = false;
};

const clearCanvas = () => setupCanvas();

const close = () => emit('update:modelValue', false);

const confirm = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  emit('confirm', canvas.toDataURL('image/png'));
  emit('update:modelValue', false);
};
</script>

<style scoped>
.signature-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.signature-hint {
  font-size: 13px;
  color: #606266;
}

.signature-canvas-box {
  position: relative;
  border: 1.5px dashed #c0c4cc;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.signature-canvas {
  display: block;
  width: 100%;
  height: 200px;
  touch-action: none;
  cursor: crosshair;
}

.signature-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 15px;
  pointer-events: none;
}

.signature-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.signature-note {
  font-size: 12px;
  color: #909399;
}
</style>
