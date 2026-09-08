import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import viteCompression from 'vite-plugin-compression';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const localEnv = loadEnv(mode, __dirname, '');
  const env = { ...rootEnv, ...localEnv };
  const useHttps = String(process.env.VITE_HTTPS || env.VITE_HTTPS || '').toLowerCase().trim() === 'true';
  const port = Number(env.FRONTEND_PORT || env.VITE_FRONTEND_PORT) || 4000;
  const protocol = useHttps ? 'https' : 'http';
  if (useHttps) {
    console.log('[vite] HTTPS mode: VITE_HTTPS=true detected');
  }

  // Try to use custom SSL certs from nginx/ssl (with LAN IP SAN)
  let httpsConfig: any = useHttps;
  let hasCustomCert = false;
  if (useHttps) {
    const certDir = path.resolve(__dirname, '..', 'nginx', 'ssl');
    const certFile = path.join(certDir, 'server.crt');
    const keyFile = path.join(certDir, 'server.key');
    if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
      httpsConfig = {
        cert: fs.readFileSync(certFile, 'utf-8'),
        key: fs.readFileSync(keyFile, 'utf-8'),
      };
      hasCustomCert = true;
      console.log('[vite] Using custom SSL cert from nginx/ssl/');
    } else {
      console.log('[vite] Using auto-generated basic-ssl cert');
    }
  }

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo-truong.ico', 'logo-truong.jpg'],
        manifest: {
          name: 'Quản lý tài sản - CTEC',
          short_name: 'QLTS CTEC',
          description: 'Phần mềm Quản lý tài sản - Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ',
          theme_color: '#409eff',
          background_color: '#f0f2f5',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          lang: 'vi',
          icons: [
            {
              src: '/logo-truong.jpg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any maskable',
            },
            {
              src: '/logo-truong.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,jpg,png,svg,woff,woff2,ttf,eot}'],
          // SPA fallback khi offline
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/scan\//, /^\/storage\//],
          runtimeCaching: [
            // 1. HTML navigation — network-first: luôn lấy bản mới nhất từ server
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
              },
            },
            // 2. Code JS/CSS — network-first: luôn tải mới, offline thì dùng cache
            {
              urlPattern: /\.(?:js|css)$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'code',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              },
            },
            // 3. Logo / ảnh tĩnh — cache-first: không đổi, tiết kiệm băng thông
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: { maxEntries: 100, maxAgeSeconds: 365 * 24 * 60 * 60 },
              },
            },
            // 4. Font Google — cache-first
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
              },
            },
            // 5. API — network-first (không cache public API)
          ],
        },
      }),
      (useHttps && !hasCustomCert) ? basicSsl() : null,
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        include: /\.(js|mjs|json|css|html|svg|xml|txt|ico|woff|woff2|ttf|eot)$/i,
        deleteOriginFile: false,
        compressionOptions: { level: 6 },
        verbose: true,
        disable: false,
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        include: /\.(js|mjs|json|css|html|svg|xml|txt|ico|woff|woff2|ttf|eot)$/i,
        deleteOriginFile: false,
        verbose: true,
        disable: false,
      }),
      {
        name: 'log-and-open',
        configureServer(server) {
          server.httpServer?.once('listening', () => {
            const addr = server.httpServer?.address();
            const actualPort = typeof addr === 'object' && addr && 'port' in addr ? addr.port : port;
            const actualUrl = `${protocol}://localhost:${actualPort}`;
            console.log('\n  ' + '='.repeat(50));
            console.log('  >>> Mo trinh duyet: ' + actualUrl);
            console.log('  ' + '='.repeat(50) + '\n');
            if (useHttps) {
              console.log('  Trinh duyet bao "Khong bao mat" -> Nang cao -> Truy cap localhost\n');
            }
            import('open').then(({ default: open }) => open(actualUrl));
          });
        },
      },
    ].filter(Boolean) as any,
    server: {
      host: '0.0.0.0',
      port,
      https: httpsConfig,
      allowedHosts: true,
      open: false,
      hmr: {
        protocol: useHttps ? 'wss' : 'ws',
        port: port,
        overlay: false,
      },
      proxy: {
        '/storage': {
          target: env.VITE_PROXY_TARGET || 'http://backend:5000',
          changeOrigin: true,
          ws: false,
          secure: false,
        },
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://backend:5000',
          changeOrigin: true,
          ws: false,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => console.error('[proxy] error', err));
          },
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/echarts')) {
              return 'echarts';
            }
            if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router') || id.includes('node_modules/pinia')) {
              return 'vue-vendor';
            }
            if (id.includes('node_modules/element-plus')) {
              return 'element-plus';
            }
          },
        },
      },
    },
  };
});
