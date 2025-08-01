module.exports = {
  apps: [{
    name: 'bot',
    script: './bot.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    node_args: [
      '--max-old-space-size=512',
      '--gc-interval=100',
      '--optimize-for-size'
    ],
    env: {
      NODE_ENV: 'production'
    },
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Disable PM2 log rotation to prevent .gz files
    log_type: 'json',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Disable log rotation completely
    max_log_size: '0',
    retain_logs: 0,
    
    // Use custom log files that won't be rotated
    out_file: './output.log',
    error_file: './output.log',
    log_file: './output.log',
    
    // Disable PM2's built-in log rotation
    disable_logs: false,
    
    // Additional PM2 log rotation settings to disable
    logrotate: false
  }]
};