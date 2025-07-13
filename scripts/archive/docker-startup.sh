#!/bin/bash

# Docker startup script with maintenance automation
# This script runs before Docker containers start

echo "🚀 Docker Startup Automation Script"
echo "===================================="

# Function to run maintenance tasks
run_maintenance() {
    local task=$1
    echo "🔧 Running maintenance task: $task"
    bash scripts/maintenance.sh $task
}

# Pre-startup maintenance
echo "🧹 Pre-startup maintenance..."
run_maintenance cleanup

# Health check after startup
echo "🏥 Post-startup health check..."
sleep 30  # Wait for services to start
run_maintenance health-check

# Optional: Run security scan periodically
if [ "${RUN_SECURITY_SCAN:-false}" = "true" ]; then
    echo "🔒 Running security scan..."
    run_maintenance security-scan
fi

echo "✅ Docker startup automation completed!"
