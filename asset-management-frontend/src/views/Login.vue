<template>
  <div class="login-container">
    <canvas ref="canvasRef" id="particle-canvas" />

    <div class="login-center">
      <div class="form-card">
        <div class="login-header">
          <div class="logo-wrapper">
            <img
              :src="logoUrl"
              alt="Logo CTEC"
              class="school-logo"
              @error="onLogoError"
            >
          </div>
          <p class="sub-welcome">Phần mềm Quản lý Tài sản</p>
          <p class="school-name">Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ</p>
        </div>

        <form id="login-form" novalidate @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label" for="f-username"><span class="required">*</span> Tên đăng nhập</label>
            <div class="input-wrap">
              <span class="material-symbols-rounded input-icon">person</span>
              <input
                ref="usernameRef"
                v-model="loginForm.username"
                class="input-field"
                type="text"
                id="f-username"
                placeholder="Nhập tên đăng nhập"
                autocomplete="username"
                autofocus
              >
            </div>
            <p class="field-hint">Vui lòng nhập tên đăng nhập</p>
          </div>

          <div class="form-group">
            <label class="form-label" for="f-password"><span class="required">*</span> Mật khẩu</label>
            <div class="input-wrap">
              <span class="material-symbols-rounded input-icon">lock</span>
              <input
                ref="passwordRef"
                v-model="loginForm.password"
                class="input-field pw-field"
                :type="showPassword ? 'text' : 'password'"
                id="f-password"
                placeholder="••••••••"
                autocomplete="current-password"
                @keyup.enter="handleSubmit"
              >
              <button type="button" class="toggle-pw" @click="showPassword = !showPassword" title="Hiện/ẩn mật khẩu">
                <span class="material-symbols-rounded">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <p class="field-hint">Vui lòng nhập mật khẩu</p>
          </div>

          <div v-if="totpRequired" class="form-group">
            <label class="form-label" for="f-totp"><span class="required">*</span> Mã xác thực 2 lớp</label>
            <div class="input-wrap">
              <span class="material-symbols-rounded input-icon">pin</span>
              <input
                ref="totpRef"
                v-model="totpCode"
                class="input-field"
                type="text"
                inputmode="numeric"
                maxlength="6"
                id="f-totp"
                placeholder="Nhập mã 6 chữ số từ ứng dụng xác thực"
                autocomplete="one-time-code"
                @keyup.enter="handleSubmit"
              >
            </div>
            <p class="field-hint">Mã gồm 6 chữ số từ Google Authenticator (hoặc ứng dụng TOTP tương tự)</p>
          </div>

          <div class="form-row">
            <label class="remember-wrap">
              <input type="checkbox" v-model="rememberMe" id="remember-me">
              <span>Ghi nhớ phiên đăng nhập</span>
            </label>
            <button type="button" class="forgot-link" @click="toggleForgotPassword">
              <span class="material-symbols-rounded">help_outline</span>
              Quên mật khẩu?
            </button>
          </div>

          <div id="admin-help" class="admin-help" :class="{ show: showForgotPassword }" role="status">
            <strong>Liên hệ Admin để được hỗ trợ:</strong><br>
            Trần Thuận - <span class="phone">0944 300 848</span>
          </div>

          <div v-if="errorMessage" class="login-error" role="alert">
            <span class="material-symbols-rounded">error</span>
            <span>{{ errorMessage }}</span>
          </div>

          <button type="submit" class="btn-login" :disabled="loading">
            <span v-if="loading" class="spinner" />
            <span id="btn-login-text">{{ loading ? 'Đang xử lý...' : (totpRequired ? 'Xác nhận mã' : 'Đăng nhập ngay') }}</span>
          </button>
        </form>

        <div class="login-footer">
          <p>&copy; 2026 Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';

import logoUrl from '@/login/logo-truong.jpg';

const authStore = useAuthStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const passwordRef = ref<HTMLInputElement | null>(null);
const rememberMe = ref(false);
const showPassword = ref(false);
const showForgotPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const totpRequired = ref(false);
const totpCode = ref('');
const totpRef = ref<HTMLInputElement | null>(null);

const loginForm = reactive({ username: '', password: '' });

const onLogoError = (e: Event) => {
  const img = e.target as HTMLImageElement | null;
  if (img) img.style.display = 'none';
};

const toggleForgotPassword = () => {
  showForgotPassword.value = !showForgotPassword.value;
};

const handleLogin = async () => {
  const username = loginForm.username.trim();
  const password = loginForm.password;

  if (!username || !password) {
    errorMessage.value = !username ? 'Vui lòng nhập tên đăng nhập' : 'Vui lòng nhập mật khẩu';
    return;
  }

  errorMessage.value = '';
  loading.value = true;

  try {
    const result = await authStore.login(username, password);
    loading.value = false;
    if (result === true) {
      // _applyAuthResponse handles localStorage clear + full page reload
    } else if (result === '2fa_required') {
      totpRequired.value = true;
      errorMessage.value = '';
      totpCode.value = '';
      setTimeout(() => totpRef.value?.focus(), 0);
    }
  } catch (err: any) {
    loading.value = false;
    const msg = err?.response?.data?.error || err?.message || 'Sai tên đăng nhập hoặc mật khẩu';
    errorMessage.value = msg;
    loginForm.password = '';
    passwordRef.value?.focus();
  }
};

const handleVerify2FA = async () => {
  const code = totpCode.value.trim();
  if (!/^\d{6}$/.test(code)) {
    errorMessage.value = 'Vui lòng nhập đúng mã xác thực 6 chữ số';
    return;
  }
  errorMessage.value = '';
  loading.value = true;
  try {
    const ok = await authStore.verify2FA(code);
    loading.value = false;
    if (!ok) {
      errorMessage.value = 'Mã xác thực không đúng hoặc đã hết hạn';
    }
  } catch {
    loading.value = false;
    errorMessage.value = 'Xác thực thất bại. Vui lòng thử lại.';
  }
};

const handleSubmit = () => {
  if (totpRequired.value) {
    handleVerify2FA();
  } else {
    handleLogin();
  }
};

// Check existing session - show current user if any, but don't auto-redirect
// This prevents account mixing when multiple users share the same device
onMounted(async () => {
  await authStore.checkAuth();
});

// Canvas particle network
interface Particle { x: number; y: number; vx: number; vy: number; r: number; alpha: number; }
let animFrameId = 0;

function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w: number, h: number;
  const COUNT = 100;
  const MAX_DIST = 140;

  const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  const particles: Particle[] = Array.from({ length: COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    r: Math.random() * 1.8 + 0.5,
    alpha: Math.random() * 0.55 + 0.25,
  }));

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
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

  onUnmounted(() => {
    cancelAnimationFrame(animFrameId);
    window.removeEventListener('resize', resize);
  });
}

onMounted(() => { initCanvas(); });
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0&display=swap');
</style>

<style scoped>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

.login-container {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #060d1f 0%, #0a1a35 40%, #0d2145 70%, #091828 100%);
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #1e293b;
  overflow: hidden;
}

#particle-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

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

.form-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 20px;
  padding: 40px 36px 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2);
}

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
  box-shadow: 0 0 0 3px #e2e8f0, 0 8px 20px rgba(0, 0, 0, 0.08);
  object-fit: contain;
}

.sub-welcome {
  color: #1e293b;
  font-size: 17.6px;
  font-weight: 600;
  margin: 0 0 4px;
  line-height: 1.5;
}

.school-name {
  color: #64748b;
  font-size: 13.6px;
  font-weight: 400;
  margin: 0 0 28px;
  line-height: 1.4;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #1e293b;
  font-size: 14.4px;
  padding-bottom: 6px;
}

.form-label .required {
  color: #dc2626;
  font-weight: 700;
  margin-right: 2px;
}

.field-hint {
  font-size: 11.5px;
  color: #94a3b8;
  margin: 4px 0 0 0;
  line-height: 1.4;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  font-size: 20px;
  pointer-events: none;
}

.input-field {
  width: 100%;
  height: 46px;
  padding: 0 14px 0 42px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  color: #1e293b;
  font-family: inherit;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.input-field::placeholder {
  color: #94a3b8;
}

.input-field:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  background: #fff;
}

.pw-field {
  padding-right: 44px;
}

.toggle-pw {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.toggle-pw:hover {
  color: #475569;
}

.toggle-pw .material-symbols-rounded {
  font-size: 20px;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -6px 0 20px;
}

.remember-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  user-select: none;
}

.remember-wrap input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.forgot-link {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 12.8px;
  font-family: inherit;
  cursor: pointer;
  padding: 4px 0;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #3b82f6;
}

.forgot-link .material-symbols-rounded {
  font-size: 16px;
}

.admin-help {
  display: none;
  padding: 10px 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  font-size: 13.1px;
  color: #1e293b;
  line-height: 1.6;
  margin-bottom: 16px;
}

.admin-help.show {
  display: block;
}

.admin-help strong {
  color: #2563eb;
}

.admin-help .phone {
  font-weight: 700;
}

.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-size: 13.1px;
  color: #dc2626;
  margin-bottom: 16px;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

.login-error .material-symbols-rounded {
  font-size: 16px;
  flex-shrink: 0;
}

.btn-login {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}

.btn-login:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.45);
}

.btn-login:active {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  color: #94a3b8;
  font-size: 12.8px;
}

@media (max-width: 480px) {
  .form-card { padding: 28px 20px 24px; border-radius: 16px; }
  .school-logo { height: 60px; width: 60px; }
  .sub-welcome { font-size: 14px; }
  .btn-login { height: 44px; font-size: 15.2px; }
  .login-footer { font-size: 12px; }
}
</style>
