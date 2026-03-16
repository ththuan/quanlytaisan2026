import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import viteCompression from 'vite-plugin-compression';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  // Load .env từ thư mục cha (quanlytaisan) để dùng chung với backend, fallback về thư mục hiện tại
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const localEnv = loadEnv(mode, __dirname, '');
  const env = { ...rootEnv, ...localEnv };
  const useHttps = env.VITE_HTTPS === 'true';

  return {
  plugins: [
    vue(),
    // Chỉ bật SSL nếu VITE_HTTPS=true trong .env (đọc từ quanlytaisan/.env hoặc frontend/.env)
    useHttps ? basicSsl() : null,
    // Gzip compression cho production build
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      // Chỉ nén các file có kích thước >= 1KB
      threshold: 1024,
      // Nén tất cả các loại file
      include: /\.(js|mjs|json|css|html|svg|xml|txt|ico|woff|woff2|ttf|eot)$/i,
      // Xóa file gốc sau khi nén (không nên xóa để fallback)
      deleteOriginFile: false,
      // Compression level: 6 là cân bằng tốt giữa tốc độ và tỷ lệ nén
      compressionOptions: {
        level: 6,
      },
      // Chỉ chạy khi build production
      verbose: true,
      disable: false,
    }),
    // Brotli compression (tùy chọn, tốt hơn Gzip nhưng cần server hỗ trợ)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      include: /\.(js|mjs|json|css|html|svg|xml|txt|ico|woff|woff2|ttf|eot)$/i,
      deleteOriginFile: false,
      verbose: true,
      disable: false,
    }),
  ].filter(Boolean) as any,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: Number(env.FRONTEND_PORT || env.VITE_FRONTEND_PORT) || 3000,
    // HTTPS do plugin basicSsl() thiết lập khi VITE_HTTPS=true
    allowedHosts: true,
    proxy: {
      '/storage': {
        target: env.VITE_PROXY_TARGET || 'http://backend:5000',
        changeOrigin: true,
        ws: false,
        secure: false,
      },
      '/api': {
        // Khi chạy trong Docker, `backend` là service name.
        // Khi chạy bên ngoài, có thể set VITE_PROXY_TARGET=http://localhost:5000
        target: env.VITE_PROXY_TARGET || 'http://backend:5000',
        changeOrigin: true,
        ws: false,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[proxy] error', err);
          });
        },
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    // Tối ưu hóa build output
    rollupOptions: {
      output: {
        // Chia nhỏ chunks để tối ưu caching
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
          'echarts': ['echarts', 'vue-echarts'],
        },
      },
    },
  },
};
});
