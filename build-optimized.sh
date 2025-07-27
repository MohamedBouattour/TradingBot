#!/bin/bash

# Optimized build script for trading bot with memory optimizations
echo "Building optimized trading bot..."

# Clean previous build
rm -rf dist/
mkdir -p dist/

# Build with esbuild optimizations
esbuild ./apps/trading-bot/src/app.ts \
  --bundle \
  --platform=node \
  --outfile=dist/bot.js \
  --minify \
  --tree-shaking \
  --target=node18 \
  --format=cjs \
  --sourcemap=false \
  --legal-comments=none \
  --drop:console \
  --drop:debugger

echo "Build completed successfully!"
echo "Output: dist/bot.js"

# Show file size
echo "File size: $(du -h dist/bot.js | cut -f1)"

# Create PM2 ecosystem file with memory optimizations
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'trading-bot',
    script: './dist/bot.js',
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
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

echo "PM2 ecosystem.config.js created with memory optimizations"
echo ""
echo "To deploy:"
echo "1. Copy dist/bot.js and ecosystem.config.js to your server"
echo "2. Run: pm2 start ecosystem.config.js"
echo "3. Run: pm2 save && pm2 startup"