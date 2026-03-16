<template>
  <div class="login-container">
    <!-- Animated background accents -->
    <div class="bg-blur-blob blob-1" />
    <div class="bg-blur-blob blob-2" />
    
    <!-- Left Section: Premium Interactive Network -->
    <div class="login-left">
      <div class="network-scene">
        <div class="network-wrapper">
          <div class="network-core">
            <!-- Dynamic abstract connections -->
            <div class="web-lines" />
            <!-- Interactive-feeling nodes with refined glow -->
            <div
              v-for="n in 35"
              :key="n"
              :class="['node-dot', `dot-${n}`]"
            />
            <!-- Floating asset geometry -->
            <div
              v-for="i in 8"
              :key="`ring-${i}`"
              :class="['asset-ring', `ring-${i}`]"
            />
            <div class="asset-cube cube-1" />
            <div class="asset-cube cube-2" />
          </div>
        </div>
      </div>
      <!-- Premium grain texture overlay -->
      <div class="grain-overlay" />
    </div>

    <!-- Right Section: Premium Login Form -->
    <div class="login-right">
      <div class="form-card">
        <div class="login-header">
          <div class="logo-wrapper">
            <img
              :src="logoUrl"
              alt="School Logo"
              class="school-logo"
              @error="onLogoError"
            >
          </div>
          <p class="sub-welcome">
            Hệ thống quản lý tài sản thông minh
          </p>
        </div>

        <div class="form-wrapper">
          <el-form
            v-if="step === 'credentials'"
            ref="loginFormRef"
            :model="loginForm"
            :rules="rules"
            label-position="top"
            class="premium-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item
              label="Tài khoản"
              prop="username"
            >
              <el-input
                v-model="loginForm.username"
                placeholder="Tên đăng nhập của bạn"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>

            <el-form-item
              label="Mật khẩu"
              prop="password"
            >
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="••••••••"
                size="large"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <div class="form-actions-row">
              <el-checkbox v-model="rememberMe">
                Ghi nhớ
              </el-checkbox>
              <el-link class="forgot-link">
                Quên mật khẩu?
              </el-link>
            </div>

            <el-button
              type="primary"
              :loading="authStore.loading"
              class="premium-submit-btn"
              @click="handleLogin"
            >
              Tiếp tục
              <el-icon class="el-icon--right">
                <ArrowRight />
              </el-icon>
            </el-button>
          </el-form>

          <!-- Step 2: 2FA -->
          <div
            v-else
            class="totp-step"
          >
            <div class="totp-icon-box">
              <div class="shield-icon">
                🛡️
              </div>
            </div>
            <h3 class="totp-title">
              Xác thực bảo mật
            </h3>
            <p class="totp-hint">
              Nhập mã xác thực từ ứng dụng của bạn
            </p>
            <el-input
              v-model="totpCode"
              placeholder="0 0 0 0 0 0"
              size="large"
              maxlength="6"
              class="totp-input"
              @keyup.enter="handleVerify2FA"
            />
            <el-button
              type="primary"
              :loading="authStore.loading"
              class="premium-submit-btn"
              style="margin-top: 30px"
              @click="handleVerify2FA"
            >
              Xác thực ngay
            </el-button>
            <el-button
              link
              class="back-btn"
              @click="step = 'credentials'"
            >
              Quay về bước trước
            </el-button>
          </div>
        </div>

        <div class="login-footer">
          <p>&copy; 2026 Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock, ArrowRight } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth.store';
import type { FormInstance, FormRules } from 'element-plus';

// Import assets
import logoUrl from '@/login/logo-truong.jpg';

const router = useRouter();
const authStore = useAuthStore();
const loginFormRef = ref<FormInstance>();
const rememberMe = ref(false);

const onLogoError = (e: Event) => {
  const img = e.target as HTMLImageElement | null;
  if (img) img.style.display = 'none';
};

const loginForm = reactive({
  username: '',
  password: '',
});

const step = ref<'credentials' | '2fa'>('credentials');
const totpCode = ref('');

const rules = computed<FormRules>(() => ({
  username: [{ required: true, message: 'Vui lòng nhập tên đăng nhập', trigger: 'blur' }],
  password: [
    { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự', trigger: 'blur' },
  ],
}));

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const result = await authStore.login(loginForm.username, loginForm.password);
      if (result === true) {
        router.push('/');
      } else if (result === '2fa_required') {
        step.value = '2fa';
        totpCode.value = '';
      }
    }
  });
};

const handleVerify2FA = async () => {
  if (!totpCode.value || totpCode.value.length !== 6) return;
  const success = await authStore.verify2FA(totpCode.value);
  if (success) {
    router.push('/');
  }
};
</script>

<style scoped>

.login-container {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: #fcfdfe;
  font-family: 'Outfit', sans-serif;
  overflow: hidden;
  position: relative;
}

/* --- Decorative Background Elements --- */
.bg-blur-blob {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
  opacity: 0.15;
  pointer-events: none;
}
.blob-1 { top: -100px; right: -100px; background: #3b82f6; animation: driftBlob 15s infinite alternate; }
.blob-2 { bottom: -100px; left: 10%; background: #8b5cf6; animation: driftBlob 20s infinite alternate-reverse; }

@keyframes driftBlob {
  from { transform: translate(0,0); }
  to { transform: translate(50px, 50px) scale(1.1); }
}

/* --- Left Side: Tech-Art Network --- */
.login-left {
  flex: 1.1;
  position: relative;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

@media (max-width: 1023px) {
  .login-left { display: none; }
}

.network-scene {
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.network-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 600px;
  max-height: 600px;
}

.web-lines {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 70%),
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 100% 100%, 80px 80px, 80px 80px;
}

.node-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3b82f6;
  filter: blur(0.5px);
  animation: nodeOrganic 10s infinite ease-in-out;
}

/* Populate dots dynamically with improved visual spread */
.dot-1  { top: 25%; left: 35%; background: #8b5cf6; animation-delay: 0s; }
.dot-2  { top: 45%; left: 20%; background: #3b82f6; animation-delay: -2s; }
.dot-3  { top: 65%; left: 30%; background: #06b6d4; animation-delay: -4s; }
.dot-4  { top: 80%; left: 50%; background: #3b82f6; animation-delay: -1s; }
.dot-5  { top: 15%; left: 55%; background: #c084fc; animation-delay: -3s; }
.dot-6  { top: 40%; left: 75%; background: #06b6d4; animation-delay: -5s; }
.dot-7  { top: 60%; left: 85%; background: #3b82f6; animation-delay: -7s; }
.dot-8  { top: 30%; left: 60%; background: #6366f1; animation-delay: -2.5s; }
.dot-9  { top: 50%; left: 45%; background: #3b82f6; animation-delay: -6s; }
.dot-10 { top: 75%; left: 70%; background: #8b5cf6; animation-delay: -8s; }
/* ... and many more small decorative dots ... */
[class*="dot-"] { opacity: 0.8; }

.asset-ring {
  position: absolute;
  border: 1.5px solid rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  animation: ringPulse 12s infinite alternate ease-in-out;
}
.ring-1 { width: 120px; height: 120px; top: 40%; left: 40%; border-color: rgba(59, 130, 246, 0.1); }
.ring-2 { width: 60px; height: 60px; top: 20%; left: 30%; border-color: rgba(139, 92, 246, 0.15); }

.asset-cube {
  position: absolute;
  border: 1px solid rgba(59, 130, 246, 0.3);
  width: 40px;
  height: 40px;
  transform: rotate(45deg);
  opacity: 0.2;
  animation: cubeRotate 25s infinite linear;
}
.cube-1 { top: 15%; left: 70%; }
.cube-2 { bottom: 15%; left: 20%; }

@keyframes nodeOrganic {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(20px, -20px); }
  66% { transform: translate(-15px, 15px); }
}

@keyframes ringPulse {
  from { transform: scale(0.95); opacity: 0.2; }
  to { transform: scale(1.05); opacity: 0.5; }
}

@keyframes cubeRotate {
  from { transform: rotate(0deg) translate(0,0); }
  to { transform: rotate(360deg) translate(10px, 10px); }
}

.grain-overlay {
  position: absolute;
  inset: 0;
  background-image: url('https://grainy-gradients.vercel.app/noise.svg');
  opacity: 0.02;
  pointer-events: none;
  z-index: 5;
}

/* --- Right Side: Premium Login Card --- */
.login-right {
  flex: 0.9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: #fcfdfe;
  z-index: 10;
}

.form-card {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 25px;
}

.school-logo {
  height: 80px;
  width: 80px;
  border-radius: 50%;
  background: #fff;
  padding: 6px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  border: 3px solid #fff;
}

.welcome-text {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  text-align: center;
  letter-spacing: -0.5px;
}

.sub-welcome {
  color: #64748b;
  font-size: 1.1rem;
  text-align: center;
  margin-top: 8px;
  margin-bottom: 45px;
}

.premium-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.premium-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #475569;
  font-size: 0.95rem;
  padding-bottom: 8px;
}

.premium-form :deep(.el-input__wrapper) {
  background-color: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
  border-radius: 10px;
  height: 44px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-form :deep(.el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08) !important;
}

.form-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: -5px 0 35px 0;
}

.forgot-link {
  font-size: 0.9rem;
  font-weight: 500;
  color: #3b82f6;
  cursor: pointer;
}

.premium-submit-btn {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  background: #1e293b;
  border: none;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 10px 15px -3px rgba(30, 41, 59, 0.2);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.premium-submit-btn:hover {
  background: #0f172a;
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(30, 41, 59, 0.25);
}

.login-footer {
  text-align: center;
  margin-top: 45px;
  color: #94a3b8;
  font-size: 0.9rem;
}

/* 2FA Step refined */
.totp-icon-box {
  width: 80px;
  height: 80px;
  background: #f1f5f9;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 25px auto;
  font-size: 2.5rem;
}

.totp-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
  margin-bottom: 8px;
}

.totp-hint {
  color: #64748b;
  text-align: center;
  margin-bottom: 30px;
}

.totp-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 2rem;
  letter-spacing: 12px;
  font-weight: 800;
}

.back-btn {
  width: 100%;
  margin-top: 15px;
  color: #94a3b8;
}

@media (max-width: 640px) {
  .login-right { padding: 30px 20px; }
  .welcome-text { font-size: 1.8rem; }
}
</style>
