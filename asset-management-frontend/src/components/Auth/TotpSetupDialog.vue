<template>
  <el-dialog
    v-model="visible"
    title="Cài đặt xác thực 2 bước (Google Authenticator)"
    width="480px"
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <!-- Status: 2FA already enabled -->
    <template v-if="isEnabled && innerStep === 'status'">
      <div class="totp-status enabled">
        <el-icon class="status-icon" color="#67c23a"><CircleCheck /></el-icon>
        <p>Xác thực 2 bước đang <strong>bật</strong>. Tài khoản của bạn được bảo vệ bởi Google Authenticator.</p>
      </div>
      <el-button type="danger" plain @click="innerStep = 'disable'" style="width:100%;margin-top:16px">
        Tắt xác thực 2 bước
      </el-button>
    </template>

    <!-- Status: 2FA not enabled -->
    <template v-else-if="!isEnabled && innerStep === 'status'">
      <div class="totp-status disabled">
        <el-icon class="status-icon" color="#e6a23c"><Warning /></el-icon>
        <p>Xác thực 2 bước chưa được bật. Hãy cài đặt Google Authenticator để tăng bảo mật.</p>
      </div>
      <el-button type="primary" @click="startSetup" :loading="loading" style="width:100%;margin-top:16px">
        Bật xác thực 2 bước
      </el-button>
    </template>

    <!-- Setup step 1: show QR code -->
    <template v-else-if="innerStep === 'qr'">
      <p class="step-hint">
        1. Mở ứng dụng <strong>Google Authenticator</strong> trên điện thoại.<br />
        2. Nhấn dấu <strong>+</strong> → <em>Quét mã QR</em>.<br />
        3. Quét mã bên dưới.
      </p>
      <div class="qr-wrapper">
        <img :src="qrCodeUrl" alt="QR Code" class="qr-image" />
      </div>
      <p class="secret-hint">
        Hoặc nhập thủ công:
        <el-tag type="info" style="font-family:monospace;font-size:13px;letter-spacing:2px">{{ secret }}</el-tag>
      </p>
      <el-divider />
      <p class="step-hint">Sau khi quét, nhập mã 6 chữ số từ ứng dụng để xác nhận:</p>
      <el-input
        v-model="verifyCode"
        placeholder="000000"
        maxlength="6"
        size="large"
        class="code-input"
        @keyup.enter="handleEnable"
      />
      <div class="dialog-footer">
        <el-button @click="innerStep = 'status'">Huỷ</el-button>
        <el-button type="primary" :loading="loading" @click="handleEnable">Xác nhận &amp; Bật</el-button>
      </div>
    </template>

    <!-- Disable step -->
    <template v-else-if="innerStep === 'disable'">
      <p class="step-hint">Nhập mật khẩu hiện tại để tắt xác thực 2 bước:</p>
      <el-input
        v-model="disablePassword"
        type="password"
        placeholder="Mật khẩu"
        size="large"
        show-password
        @keyup.enter="handleDisable"
      />
      <div class="dialog-footer">
        <el-button @click="innerStep = 'status'">Huỷ</el-button>
        <el-button type="danger" :loading="loading" @click="handleDisable">Tắt xác thực 2 bước</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { CircleCheck, Warning } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

interface Props {
  modelValue: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const authStore = useAuthStore();

const visible = ref(props.modelValue);
watch(() => props.modelValue, (v) => { visible.value = v; });
watch(visible, (v) => emit('update:modelValue', v));

// Whether 2FA is currently active for this user
const isEnabled = ref(authStore.user?.totp_enabled ?? false);

const innerStep = ref<'status' | 'qr' | 'disable'>('status');
const qrCodeUrl = ref('');
const secret = ref('');
const verifyCode = ref('');
const disablePassword = ref('');
const loading = ref(false);

watch(() => props.modelValue, (opened) => {
  if (opened) {
    isEnabled.value = authStore.user?.totp_enabled ?? false;
    innerStep.value = 'status';
    verifyCode.value = '';
    disablePassword.value = '';
  }
});

async function startSetup() {
  loading.value = true;
  try {
    const res = await authService.setup2FA();
    if (res.success && res.data) {
      qrCodeUrl.value = res.data.qrCodeUrl;
      secret.value = res.data.secret;
      innerStep.value = 'qr';
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Không thể tạo mã QR');
  } finally {
    loading.value = false;
  }
}

async function handleEnable() {
  if (!verifyCode.value || verifyCode.value.length !== 6) {
    ElMessage.warning('Vui lòng nhập mã 6 chữ số');
    return;
  }
  loading.value = true;
  try {
    await authService.enable2FA(verifyCode.value);
    ElMessage.success('Đã bật xác thực 2 bước thành công!');
    isEnabled.value = true;
    // Update cached user object
    if (authStore.user) {
      authStore.user.totp_enabled = true;
      localStorage.setItem('user', JSON.stringify(authStore.user));
    }
    innerStep.value = 'status';
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Mã xác thực không đúng');
  } finally {
    loading.value = false;
  }
}

async function handleDisable() {
  if (!disablePassword.value) {
    ElMessage.warning('Vui lòng nhập mật khẩu');
    return;
  }
  loading.value = true;
  try {
    await authService.disable2FA(disablePassword.value);
    ElMessage.success('Đã tắt xác thực 2 bước.');
    isEnabled.value = false;
    if (authStore.user) {
      authStore.user.totp_enabled = false;
      localStorage.setItem('user', JSON.stringify(authStore.user));
    }
    innerStep.value = 'status';
    disablePassword.value = '';
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Mật khẩu không đúng');
  } finally {
    loading.value = false;
  }
}

function onClosed() {
  verifyCode.value = '';
  disablePassword.value = '';
  innerStep.value = 'status';
}
</script>

<style scoped>
.totp-status {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
}
.totp-status.enabled { background: #f0f9eb; }
.totp-status.disabled { background: #fdf6ec; }
.status-icon { font-size: 28px; margin-top: 2px; flex-shrink: 0; }
.qr-wrapper { display: flex; justify-content: center; margin: 16px 0; }
.qr-image { width: 200px; height: 200px; border: 1px solid #eee; border-radius: 8px; }
.secret-hint { text-align: center; font-size: 13px; color: #606266; margin: 0 0 12px; }
.step-hint { font-size: 14px; color: #606266; line-height: 1.7; margin: 0 0 12px; }
.code-input { max-width: 200px; display: block; margin: 0 auto; }
.code-input :deep(.el-input__inner) { text-align: center; font-size: 22px; letter-spacing: 5px; font-weight: 700; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
</style>
