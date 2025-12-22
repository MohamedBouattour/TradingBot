#!/bin/bash
# VPS Cronjob - Run every hour
cd /home/admin/bot
(crontab -l 2>/dev/null | grep -v "bot.js"; echo "0 * * * * cd /home/admin/bot && node bot.js >> output.log 2>&1") | crontab -







