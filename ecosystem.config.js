module.exports = {
  apps: [
    {
      name: "bot",
      script: "./bot.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      node_args: [
        "--max-old-space-size=512",
        "--gc-interval=100",
        "--optimize-for-size",
      ],
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: "10s",
      log_type: "raw",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      out_file: "./output.log",
      error_file: "./output.log",
      pid_file: "./bot.pid",
      log_rotate: true,
      max_log_size: "100M",
      retain_logs: 5,
    },
  ],
};
