#!/bin/bash

# Scheduled maintenance tasks
# Add this to crontab for regular maintenance

echo "⏰ Scheduled Maintenance - $(date)"
echo "================================"

# Daily maintenance (run at 2 AM)
if [ "$1" = "daily" ]; then
    echo "🌅 Daily maintenance tasks..."
    bash scripts/maintenance.sh cleanup
    bash scripts/maintenance.sh health-check
    bash scripts/maintenance.sh backup
fi

# Weekly maintenance (run on Sunday at 3 AM)
if [ "$1" = "weekly" ]; then
    echo "📅 Weekly maintenance tasks..."
    bash scripts/maintenance.sh full-maintenance
fi

# Monthly maintenance (run on 1st of month at 4 AM)
if [ "$1" = "monthly" ]; then
    echo "📊 Monthly maintenance tasks..."
    bash scripts/maintenance.sh security-scan
    bash scripts/maintenance.sh update-deps
fi

echo "✅ Scheduled maintenance completed!"

# Example crontab entries:
# Add these to your crontab (crontab -e)
#
# # Daily maintenance at 2 AM
# 0 2 * * * cd /path/to/project && bash scripts/scheduled-maintenance.sh daily
#
# # Weekly maintenance on Sunday at 3 AM
# 0 3 * * 0 cd /path/to/project && bash scripts/scheduled-maintenance.sh weekly
#
# # Monthly maintenance on 1st at 4 AM
# 0 4 1 * * cd /path/to/project && bash scripts/scheduled-maintenance.sh monthly
