#!/bin/bash

###############################################################################
# Remove Cronjob
###############################################################################

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CRON_SCRIPT="$SCRIPT_DIR/run-cron.sh"

# Remove from crontab
crontab -l 2>/dev/null | grep -v "$CRON_SCRIPT" | crontab -

echo "✓ Cronjob removed"







