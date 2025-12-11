#!/bin/bash
# VPS Run Script - Run bot from deployed dist files
cd /home/admin/bot
pm2 start ecosystem.config.js || pm2 restart bot



