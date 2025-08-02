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

      // Log configuration
      log_type: "raw", // Changed from 'json' to 'raw' for simpler logs
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Disable all log rotation
      out_file: "/home/admin/bot/output.log", // Use absolute path
      error_file: "/home/admin/bot/output.log",
      pid_file: "/home/admin/bot/bot.pid",

      // Disable log rotation completely
      disable_logs: false,
      log_rotate: false,
      max_log_size: 0, // 0 means unlimited
      retain_logs: 0, // Keep all logs
      rotate_logs: false,
    },
  ],
};
