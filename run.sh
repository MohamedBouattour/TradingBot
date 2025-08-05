#!/bin/bash

# sudo date -s "@$(( $(curl -s https://api.binance.com/api/v3/time | grep -oP '"serverTime":\K\d+') / 1000 ))"

sudo pkill -f node
sleep 2

sudo nohup node app.js > output.log 2>&1 & disown
