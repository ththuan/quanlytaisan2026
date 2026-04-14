<template>
  <div class="public-scan-page">
    <!-- Header -->
    <div class="scan-header">
      <div class="brand">
        <span class="brand-icon">🏢</span>
        <span class="brand-name">Quản Lý Tài Sản</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="scan-state">
      <div class="spinner" />
      <p>Đang tra cứu tài sản...</p>
    </div>

    <!-- Error / Not found -->
    <div v-else-if="error" class="scan-state error-state">
      <div class="state-icon">❌</div>
      <h2>Không tìm thấy</h2>
      <p>{{ error }}</p>
      <p class="scan-code">Mã tra cứu: <strong>{{ code }}</strong></p>
    </div>

    <!-- Asset info -->
    <div v-else-if="asset" class="asset-card">
      <!-- Asset image -->
      <div class="asset-image-wrap">
        <img
          v-if="asset.image_url"
          :src="asset.image_url"
          :alt="asset.name"
          class="asset-image"
        />
        <div v-else class="asset-image-placeholder">
          <span>📦</span>
        </div>
      </div>

      <!-- Status badge -->
      <div class="status-row">
        <span :class="['status-badge', statusClass]">{{ asset.status_label || asset.status }}</span>
        <span v-if="asset.condition" :class="['condition-badge', conditionClass]">
          {{ asset.condition_label || asset.condition }}
        </span>
      </div>

      <!-- Main info -->
      <h1 class="asset-name">{{ asset.name }}</h1>
      <p class="asset-code">{{ asset.asset_code }}</p>

      <!-- Details -->
      <div class="info-list">
        <div v-if="asset.assetCategory?.name" class="info-row">
          <span class="info-label">Loại tài sản</span>
          <span class="info-value">{{ asset.assetCategory.name }}</span>
        </div>
        <div v-if="asset.current_department?.name" class="info-row">
          <span class="info-label">Phòng ban</span>
          <span class="info-value">{{ asset.current_department.name }}</span>
        </div>
        <div v-if="asset.location" class="info-row">
          <span class="info-label">Vị trí</span>
          <span class="info-value">{{ asset.location }}</span>
        </div>
        <div v-if="asset.year_in_use" class="info-row">
          <span class="info-label">Năm sử dụng</span>
          <span class="info-value">{{ asset.year_in_use }}</span>
        </div>
        <div v-if="asset.quantity" class="info-row">
          <span class="info-label">Số lượng</span>
          <span class="info-value">{{ asset.quantity }}{{ asset.unit ? ` ${asset.unit}` : '' }}</span>
        </div>
        <div v-if="asset.serial_number" class="info-row">
          <span class="info-label">Số sê-ri</span>
          <span class="info-value">{{ asset.serial_number }}</span>
        </div>
        <div v-if="asset.warranty_date" class="info-row">
          <span class="info-label">Bảo hành đến</span>
          <span class="info-value">{{ formatDate(asset.warranty_date) }}</span>
        </div>
        <div v-if="asset.description" class="info-row description-row">
          <span class="info-label">Mô tả</span>
          <span class="info-value">{{ asset.description }}</span>
        </div>
      </div>

      <p class="scan-note">Thông tin tra cứu qua mã QR – chỉ hiển thị dữ liệu cơ bản</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const code = computed(() => route.params.code as string);

interface PublicAsset {
  id: number;
  asset_code: string;
  name: string;
  description?: string;
  category?: string;
  category_code?: string;
  status: string;
  status_label?: string;
  condition?: string;
  condition_label?: string;
  location?: string;
  unit?: string;
  quantity?: number;
  image_url?: string;
  year_in_use?: number;
  serial_number?: string;
  warranty_date?: string;
  current_department?: { id: number; name: string; type?: string } | null;
  assetCategory?: { id: number; name: string; code?: string; category_group?: string } | null;
}

const loading = ref(true);
const error = ref<string | null>(null);
const asset = ref<PublicAsset | null>(null);

const statusClass = computed(() => {
  const s = asset.value?.status;
  if (s === 'active') return 'status-active';
  if (s === 'disposed' || s === 'pending_disposal') return 'status-disposed';
  if (s === 'damaged' || s === 'lost') return 'status-damaged';
  return 'status-other';
});

const conditionClass = computed(() => {
  const c = asset.value?.condition;
  if (c === 'good') return 'condition-good';
  if (c === 'fair' || c === 'usable') return 'condition-fair';
  if (c === 'poor' || c === 'needs_repair' || c === 'damaged') return 'condition-poor';
  return '';
});

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN');
}

onMounted(async () => {
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    const res = await axios.get(`${apiBase}/public/asset/${encodeURIComponent(code.value)}`);
    if (res.data?.success) {
      asset.value = res.data.data;
    } else {
      error.value = res.data?.message || 'Không tìm thấy tài sản';
    }
  } catch (err: any) {
    if (err.response?.status === 404) {
      error.value = 'Không tìm thấy tài sản với mã QR này';
    } else {
      error.value = 'Không thể kết nối máy chủ, vui lòng thử lại';
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.public-scan-page {
  min-height: 100vh;
  background: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1a1a2e;
}

/* Header */
.scan-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%);
  padding: 16px 20px;
  display: flex;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.brand-icon {
  font-size: 24px;
}

.brand-name {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* States */
.scan-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 24px;
  text-align: center;
  gap: 12px;
  color: #555;
}

.error-state { color: #c0392b; }
.state-icon { font-size: 48px; }

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #dde3ed;
  border-top-color: #2d6a9f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Asset Card */
.asset-card {
  max-width: 480px;
  margin: 20px auto;
  padding: 0 16px 40px;
}

.asset-image-wrap {
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 16px;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.asset-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-image-placeholder {
  font-size: 64px;
  opacity: 0.4;
}

/* Status badges */
.status-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.status-badge,
.condition-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-active   { background: #d4edda; color: #155724; }
.status-disposed { background: #f8d7da; color: #721c24; }
.status-damaged  { background: #fff3cd; color: #856404; }
.status-other    { background: #e2e3e5; color: #383d41; }

.condition-good  { background: #cce5ff; color: #004085; }
.condition-fair  { background: #fff3cd; color: #856404; }
.condition-poor  { background: #f8d7da; color: #721c24; }

/* Names */
.asset-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
  line-height: 1.3;
}

.asset-code {
  font-size: 14px;
  color: #888;
  margin: 0 0 20px;
  font-family: monospace;
  letter-spacing: 0.5px;
}

/* Info list */
.info-list {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  gap: 12px;
}

.info-row:last-child {
  border-bottom: none;
}

.description-row {
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  color: #888;
  min-width: 120px;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: #1a1a2e;
  font-weight: 500;
  word-break: break-word;
}

.scan-note {
  font-size: 12px;
  color: #aaa;
  text-align: center;
  margin-top: 8px;
}

.scan-code {
  font-size: 14px;
  color: #666;
}
</style>
