module.exports = {
  apps: [
    {
      name: 'rw-demo-one',  // 应用名称
      script: 'node_modules/next/dist/bin/next', // Next.js 启动脚本
      args: 'start',  // 启动参数
      instances: 'max', // 使用所有可用 CPU 核心
      exec_mode: 'cluster', // 使用集群模式
      watch: false, // 不启用文件监控
      max_memory_restart: '1G', // 内存超过 1G 自动重启
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // 错误日志文件
      error_file: './logs/pm2/error.log',
      // 输出日志文件
      out_file: './logs/pm2/out.log',
      // 日志时间格式
      time: true,
    },
  ],
};
