# Linux Setup Guide - Trading Bot

## Quick Start

### Option 1: PM2 (Recommended) ⭐

PM2 is recommended because the bot runs continuously with 15-minute stop loss monitoring.

```bash
# Make script executable
chmod +x run.sh

# Run with PM2
./run.sh pm2

# Or use the interactive menu
./run.sh
```

**PM2 Commands:**
```bash
pm2 status              # Check bot status
pm2 logs bot           # View bot logs (real-time)
pm2 logs bot --lines 50 # View last 50 lines
pm2 stop bot           # Stop bot
pm2 restart bot        # Restart bot
pm2 monit              # Monitor (CPU, Memory)
pm2 save               # Save process list
pm2 startup            # Setup auto-start on boot
```

### Option 2: Cronjob (Alternative)

Cronjob runs the strategy check every hour. Note: Stop loss monitoring (15min) requires PM2 or manual setup.

```bash
# Setup cronjob
./run.sh cron

# View cronjobs
crontab -l

# Edit cronjobs
crontab -e
```

## Installation Requirements

### 1. Install Node.js
```bash
# Using NodeSource (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install PM2 (for Option 1)
```bash
npm install -g pm2
```

### 3. Install Dependencies
```bash
npm install
```

## Manual Setup

### PM2 Manual Setup
```bash
# Build bot
npm run build:bot:prod

# Start with PM2
pm2 start ecosystem.config.js

# Setup auto-start on boot
pm2 save
pm2 startup
```

### Cronjob Manual Setup
```bash
# Build bot
npm run build:bot:prod

# Add to crontab (runs every hour at :00)
crontab -e
# Add this line:
0 * * * * cd /path/to/bot && node dist/bot.js >> output.log 2>&1
```

## Why PM2 is Recommended

1. **Continuous Operation**: Bot needs to run continuously for 15-minute stop loss monitoring
2. **Auto-Restart**: Automatically restarts on crashes
3. **Process Management**: Easy to start, stop, restart, and monitor
4. **Logging**: Better log management and rotation
5. **Monitoring**: Built-in CPU and memory monitoring
6. **Boot Persistence**: Can auto-start on system reboot

## Troubleshooting

### Check if bot is running
```bash
# PM2
pm2 status

# Cronjob
ps aux | grep node
```

### View logs
```bash
# PM2
pm2 logs bot

# Cronjob
tail -f output.log
```

### Stop bot
```bash
# PM2
pm2 stop bot
pm2 delete bot

# Cronjob
./run.sh stop  # or remove from crontab
```

### Check system time (important for trading)
```bash
# Sync with Binance server time
sudo date -s "@$(( $(curl -s https://api.binance.com/api/v3/time | grep -oP '"serverTime":\K\d+') / 1000 ))"
```

## Environment Variables

Create a `.env` file in the project root:
```env
APIKEY=your_binance_api_key
APISECRET=your_binance_api_secret
MODE=PRODUCTION
WITH_API=false
```

## File Structure

```
bot/
├── run.sh              # Main run script
├── ecosystem.config.js  # PM2 configuration
├── dist/
│   └── bot.js          # Built bot (after npm run build:bot:prod)
├── output.log          # Bot logs
└── .env                # Environment variables
```







