<template>
  <div class="login-container">
    <!-- Left Section: Dark Tech Panel with AI Particles -->
    <div class="login-left">
      <canvas ref="canvasRef" class="particle-canvas" />
      <div class="left-overlay">
        <div class="left-content">
          <div class="ai-badge">
            <span class="ai-dot" />
            AI POWERED
          </div>
          <h1 class="left-title">
            Quản lý<br>Tài sản số
          </h1>
          <p class="left-subtitle">
            Hệ thống quản lý tài sản thông minh<br>
            Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ
          </p>
          <div class="tech-stats">
            <div class="stat-item">
              <span class="stat-number">100%</span>
              <span class="stat-label">Số hóa</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <span class="stat-number">24/7</span>
              <span class="stat-label">Trực tuyến</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <span class="stat-number">AI</span>
              <span class="stat-label">Thông minh</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Floating binary / tech chars -->
      <div
        v-for="d in floatingChars"
        :key="d.id"
        class="floating-char"
        :style="d.style"
      >
        {{ d.char }}
      </div>
    </div>

    <!-- Right Section: Login Form -->
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

// Import assets
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

// --- Floating chars (tech/binary feel) ---
const techChars = ['0', '1', 'AI', '01', '10', '∑', 'λ', '∞', '∂', 'β', '✦', '◈'];
const floatingChars = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  char: techChars[i % techChars.length],
  style: {
    left: `${Math.random() * 90 + 5}%`,
    top: `${Math.random() * 90 + 5}%`,
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${6 + Math.random() * 10}s`,
    fontSize: `${Math.random() > 0.7 ? 11 : 9}px`,
    opacity: `${0.08 + Math.random() * 0.14}`,
  },
}));

// --- Canvas particle system ---
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; alpha: number;
}

let animFrameId = 0;

function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const COUNT = 90;
  const MAX_DIST = 130;
  const particles: Particle[] = Array.from({ length: COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 1.8 + 0.6,
    alpha: Math.random() * 0.6 + 0.3,
  }));

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & draw particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 210, 255, ${p.alpha})`;
      ctx.fill();
    }

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(100, 180, 255, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    animFrameId = requestAnimationFrame(draw);
  };

  draw();

  onUnmounted(() => {
    cancelAnimationFrame(animFrameId);
    window.removeEventListener('resize', resize);
  });
}

onMounted(() => {
  initCanvas();
});
</script>

<style scoped>

/* ============================================================
   LAYOUT
   ============================================================ */
.login-container {
  display: flex;
  min-height: 100vh;
  min-height: 100svh;
  width: 100vw;
  overflow: hidden;
  font-family: 'Outfit', 'Inter', sans-serif;
}

/* ============================================================
   LEFT PANEL – dark navy with canvas particle animation
   ============================================================ */
.login-left {
  flex: 1.15;
  position: relative;
  background: linear-gradient(135deg, #060d1f 0%, #0a1a35 40%, #0d2145 70%, #091828 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

@media (max-width: 1023px) {
  .login-left { display: none; }
}

/* Canvas fills the entire left panel */
.particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Content overlay on top of canvas */
.left-overlay {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 60px 40px;
}

.left-content {
  max-width: 480px;
  text-align: center;
}

/* AI badge */
.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 100px;
  padding: 6px 18px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: #60a5fa;
  text-transform: uppercase;
  margin-bottom: 28px;
  backdrop-filter: blur(4px);
}

.ai-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22d3ee;
  animation: dotPulse 1.5s ease-in-out infinite;
  display: inline-block;
  flex-shrink: 0;
}

@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.6); }
  50% { box-shadow: 0 0 0 6px rgba(34, 211, 238, 0); }
}

/* Main title */
.left-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.15;
  color: #ffffff;
  letter-spacing: -1px;
  margin: 0 0 18px;
  text-shadow: 0 2px 20px rgba(59, 130, 246, 0.3);
}

.left-subtitle {
  font-size: 1rem;
  color: rgba(148, 163, 184, 0.85);
  line-height: 1.65;
  margin: 0 0 48px;
}

/* Stats row */
.tech-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px 24px;
  backdrop-filter: blur(8px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-number {
  font-size: 1.6rem;
  font-weight: 800;
  color: #60a5fa;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.7);
  margin-top: 3px;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 8px;
}

/* Floating chars (binary/tech feel) */
.floating-char {
  position: absolute;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #60a5fa;
  pointer-events: none;
  z-index: 2;
  animation: floatChar linear infinite;
  user-select: none;
}

@keyframes floatChar {
  0%   { transform: translateY(0px)   rotate(0deg);  }
  25%  { transform: translateY(-18px) rotate(5deg);  }
  50%  { transform: translateY(-8px)  rotate(-3deg); }
  75%  { transform: translateY(-22px) rotate(4deg);  }
  100% { transform: translateY(0px)   rotate(0deg);  }
}

/* ============================================================
   RIGHT PANEL – white card
   ============================================================ */
.login-right {
  flex: 0.85;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #f1f5f9;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  z-index: 10;
}

@media (max-width: 1280px) {
  .login-right { flex: 0.95; padding: 32px 28px; }
}

@media (max-width: 1023px) {
  .login-right { flex: 1; padding: 24px 20px; align-items: flex-start; }
}

@media (max-width: 480px) {
  .login-right { padding: 16px; }
}

/* The white card */
.form-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 20px;
  padding: 40px 36px 32px;
  box-shadow:
    0 4px 6px -1px rgba(0,0,0,0.07),
    0 20px 40px -10px rgba(0,0,0,0.1);
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
