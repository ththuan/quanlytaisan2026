// PM2 ecosystem config — chạy backend ở cluster mode để tận dụng toàn bộ CPU core.
// Mặc định instances = 'max' (toàn bộ core). Ghi đè bằng biến môi trường PM2_INSTANCES (số nguyên).
const instances = process.env.PM2_INSTANCES
  ? parseInt(process.env.PM2_INSTANCES, 10)
  : 'max';

module.exports = {
  apps: [
    {
      name: 'asset-management-backend',
      script: './dist/server.js',
      exec_mode: 'cluster',
      instances,
      // Mỗi worker giữ bộ nhớ < 1GB thì restart, tránh rò rỉ bộ nhớ lâu dài.
      max_memory_restart: '1G',
      // Cho server thời gian xử lý request đang chạy trước khi tắt (graceful shutdown).
      kill_timeout: 15000,
      // PM2 sẽ dùng NODE_APP_INSTANCE để phân biệt instance (scheduler chỉ chạy ở instance 0).
      instance_var: 'NODE_APP_INSTANCE',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
