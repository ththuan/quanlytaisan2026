import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import viteCompression from 'vite-plugin-compression';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const localEnv = loadEnv(mode, __dirname, '');
  const env = { ...rootEnv, ...localEnv };
  const useHttps = String(process.env.VITE_HTTPS || env.VITE_HTTPS || '').toLowerCase().trim() === 'true';
  const port = Number(env.FRONTEND_PORT || env.VITE_FRONTEND_PORT) || 3000;
  const protocol = useHttps ? 'https' : 'http';
  if (useHttps) {
    console.log('[vite] HTTPS mode: VITE_HTTPS=true detected');
  }

  return {
    plugins: [
      vue(),
      useHttps ? basicSsl() : null,
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
            console.log('  >>> Mở trình duyệt: ' + actualUrl);
            console.log('  ' + '='.repeat(50) + '\n');
            if (useHttps) {
              console.log('  Trình duyệt báo "Không bảo mật" → Nâng cao → Truy cập localhost\n');
            }
            import('open').then(({ default: open }) => open(actualUrl));
          });
        },
      },
    ].filter(Boolean) as any,
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      // HTTPS + 0.0.0.0 gây ERR_SSL_PROTOCOL_ERROR trên Windows → dùng localhost khi HTTPS
      host: useHttps ? 'localhost' : '0.0.0.0',
      port,
      https: useHttps,
      allowedHosts: true,
      open: false,
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
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'element-plus': ['element-plus'],
            echarts: ['echarts', 'vue-echarts'],
          },
        },
      },
    },
  };
});
