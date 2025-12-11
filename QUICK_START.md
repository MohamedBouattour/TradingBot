# Quick Start - Trading Bot

## PM2 (Recommended)

```bash
# Run bot
./run.sh

# Stop bot
./run.sh stop

# View logs
./run.sh logs

# Check status
./run.sh status

# Restart bot
./run.sh restart
```

## Cronjob (Alternative)

```bash
# Setup cronjob (runs every hour)
chmod +x crontab-setup.sh
./crontab-setup.sh

# Remove cronjob
chmod +x crontab-remove.sh
./crontab-remove.sh

# View cronjobs
crontab -l
```

## Direct PM2 Commands

```bash
pm2 start ecosystem.config.js
pm2 stop bot
pm2 restart bot
pm2 logs bot
pm2 status
pm2 monit
```



