// PM2 ecosystem config — chạy backend ở cluster mode để tận dụng nhiều CPU core.
// Mặc định 4 worker (cân bằng cho server 8 CPU vừa chạy Node vừa chạy PostgreSQL).
// Ghi đè bằng biến môi trường PM2_INSTANCES (số nguyên).
const instances = process.env.PM2_INSTANCES
  ? parseInt(process.env.PM2_INSTANCES, 10)
  : 4;

module.exports = {
  apps: [
    {
      name: 'asset-management-backend',
      script: './dist/server.js',
      exec_mode: 'cluster',
      instances,
      // Giới hạn heap mỗi worker để PM2 restart trước khi Node tiến gần giới hạn RAM.
      node_args: '--max-old-space-size=768',
      // Mỗi worker giữ bộ nhớ < 900MB thì restart, tránh rò rỉ bộ nhớ lâu dài.
      max_memory_restart: '900M',
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
