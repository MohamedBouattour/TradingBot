#!/bin/bash
# Sync VPS time with Binance Server Time

echo "Fetching time from Binance..."
# Fetch JSON from Binance
JSON=$(curl -s "https://api.binance.com/api/v3/time")

# Extract timestamp (13 digits)
TIMESTAMP=$(echo $JSON | grep -oE "[0-9]{13}")

if [ -z "$TIMESTAMP" ]; then
    echo "Failed to retrieve timestamp from Binance."
    echo "Response was: $JSON"
    exit 1
fi

echo "Binance Timestamp (ms): $TIMESTAMP"

# Convert to seconds (integer division)
SECONDS=$(($TIMESTAMP / 1000))

# Set the system time
if date -s @$SECONDS; then
    echo "Success! System time updated."
    echo "Current System Time: $(date)"
else
    echo "Failed to set system time. Are you running as root?"
    exit 1
fi
