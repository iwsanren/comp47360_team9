#!/bin/bash

# Project startup script with automatic maintenance
# This script should be run when setting up the project

echo "🚀 Manhattan My Way - Project Startup"
echo "====================================="

# Check if this is first time setup
if [ ! -f ".setup-complete" ]; then
    echo "🔧 First time setup detected..."
    
    # Install pre-commit hooks
    echo "📋 Setting up Git hooks..."
    bash scripts/setup-git-hooks.sh
    
    # Mark setup as complete
    touch .setup-complete
    echo "✅ Initial setup completed!"
fi

# Always run cleanup before starting
echo "🧹 Running pre-startup cleanup..."
bash scripts/maintenance.sh cleanup

# Start services
echo "🚀 Starting services..."
if [ "$1" = "production" ]; then
    docker-compose -f docker-compose.prod.yml up -d
else
    docker-compose up -d
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Run health check
echo "🏥 Running health check..."
bash scripts/maintenance.sh health-check

echo "✅ Project startup completed!"
echo "🌐 Access your application at:"
echo "   - Webapp: http://localhost:3030"
echo "   - ML API: http://localhost:5000"
echo ""
echo "💡 Available maintenance commands:"
echo "   - npm run cleanup         # Clean Docker cache"
echo "   - npm run health-check    # Check services"
echo "   - npm run security-scan   # Run security scan"
echo "   - npm run maintenance     # Show all options"
