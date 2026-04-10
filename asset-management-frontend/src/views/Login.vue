<template>
  <div class="login-container">
    <!-- Full-screen particle background -->
    <canvas ref="canvasRef" class="particle-canvas" />

    <!-- Centered login card -->
    <div class="login-center">
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
            Hệ thống Quản lý Tài sản Chuyên nghiệp
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
              label="Tên đăng nhập"
              prop="username"
            >
              <el-input
                v-model="loginForm.username"
                placeholder="Nhập tên đăng nhập"
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
                Ghi nhớ phiên đăng nhập
              </el-checkbox>
            </div>

            <el-button
              type="primary"
              :loading="authStore.loading"
              class="premium-submit-btn"
              @click="handleLogin"
            >
              Đăng nhập ngay
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
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth.store';
import type { FormInstance, FormRules } from '@/types/element-plus';

import logoUrl from '@/login/logo-truong.jpg';

const router = useRouter();
const authStore = useAuthStore();
const loginFormRef = ref<FormInstance>();
const rememberMe = ref(false);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const onLogoError = (e: Event) => {
  const img = e.target as HTMLImageElement | null;
  if (img) img.style.display = 'none';
};

const loginForm = reactive({ username: '', password: '' });
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
  if (success) router.push('/');
};

// Canvas particle network
interface Particle { x: number; y: number; vx: number; vy: number; r: number; alpha: number; }
let animFrameId = 0;

function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  const COUNT = 100;
  const MAX_DIST = 140;
  const particles: Particle[] = Array.from({ length: COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    r: Math.random() * 1.8 + 0.5,
    alpha: Math.random() * 0.55 + 0.25,
  }));

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 210, 255, ${p.alpha})`;
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(100, 180, 255, ${(1 - dist / MAX_DIST) * 0.28})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    animFrameId = requestAnimationFrame(draw);
  };

  draw();
  onUnmounted(() => { cancelAnimationFrame(animFrameId); window.removeEventListener('resize', resize); });
}

onMounted(() => { initCanvas(); });
</script>

<style scoped>

/* ============================================================
   LAYOUT – full screen background
   ============================================================ */
.login-container {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #060d1f 0%, #0a1a35 40%, #0d2145 70%, #091828 100%);
  font-family: 'Outfit', 'Inter', sans-serif;
  overflow: hidden;
}

/* Canvas phủ toàn màn hình */
.particle-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* Vùng chứa card login, nằm giữa màn hình */
.login-center {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  padding: 32px 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* The white card */
.form-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 20px;
  padding: 40px 36px 32px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 480px) {
  .form-card { padding: 28px 20px 24px; border-radius: 16px; }
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 8px;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.school-logo {
  height: 72px;
  width: 72px;
  border-radius: 50%;
  background: #fff;
  padding: 4px;
  box-shadow: 0 0 0 3px #e2e8f0, 0 8px 20px rgba(0,0,0,0.08);
  object-fit: cover;
}

.sub-welcome {
  color: #475569;
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0 0 28px;
  line-height: 1.5;
}

/* Form items */
.premium-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.premium-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
  padding-bottom: 6px;
}

.premium-form :deep(.el-input__wrapper) {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  box-shadow: none !important;
  border-radius: 10px;
  height: 46px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.premium-form :deep(.el-input__inner) {
  font-size: 16px !important;
  color: #1e293b;
}

.premium-form :deep(.el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
  background: #fff;
}

/* Remember row */
.form-actions-row {
  display: flex;
  align-items: center;
  margin: -4px 0 20px;
}

.form-actions-row :deep(.el-checkbox__label) {
  font-size: 0.875rem;
  color: #64748b;
}

/* Submit button */
.premium-submit-btn {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.premium-submit-btn:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.45);
}

.premium-submit-btn:active {
  transform: translateY(0);
}

/* Footer */
.login-footer {
  text-align: center;
  margin-top: 20px;
  color: #94a3b8;
  font-size: 0.8rem;
}

/* ============================================================
   2FA STEP
   ============================================================ */
.totp-step { text-align: center; }

.totp-icon-box {
  width: 72px;
  height: 72px;
  background: #f1f5f9;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 2.2rem;
}

.totp-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.totp-hint {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 24px;
}

.totp-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 2rem;
  letter-spacing: 12px;
  font-weight: 800;
}

.back-btn {
  width: 100%;
  margin-top: 12px;
  color: #94a3b8;
  font-size: 0.875rem;
}

/* ============================================================
   MOBILE ADJUSTMENTS
   ============================================================ */
@media (max-width: 480px) {
  .school-logo { height: 60px; width: 60px; }
  .sub-welcome { font-size: 0.875rem; margin-bottom: 20px; }
  .premium-submit-btn { height: 44px; font-size: 0.95rem; }
  .login-footer { font-size: 0.75rem; }
}
</style>
