#!/bin/bash

# Quick test script for GitLab CI/CD setup
# This script helps verify your configuration before running a full pipeline

echo "🚀 GitLab CI/CD Configuration Test"
echo "=================================="

# Test 1: Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Run this script from project root."
    exit 1
fi

echo "✅ Project structure verified"

# Test 2: Check required files
REQUIRED_FILES=(
    "webapp/package.json"
    "ml/app.py"
    "ml/requirements.txt"
    "ml/Dockerfile"
    "webapp/Dockerfile"
    ".gitlab-ci.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found: $file"
    else
        echo "❌ Missing: $file"
    fi
done

# Test 3: Check Docker
echo ""
echo "🐳 Testing Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    
    # Test Docker build for ML service
    echo "Testing ML Docker build..."
    if docker build -t test-ml ./ml > /dev/null 2>&1; then
        echo "✅ ML Docker build successful"
        docker rmi test-ml > /dev/null 2>&1
    else
        echo "❌ ML Docker build failed"
    fi
    
    # Test Docker build for webapp
    echo "Testing webapp Docker build..."
    if docker build -t test-webapp ./webapp > /dev/null 2>&1; then
        echo "✅ Webapp Docker build successful"
        docker rmi test-webapp > /dev/null 2>&1
    else
        echo "❌ Webapp Docker build failed"
    fi
else
    echo "❌ Docker not found. Please install Docker first."
fi

# Test 4: Check Git configuration
echo ""
echo "📝 Testing Git configuration..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "✅ Git repository detected"
    
    current_branch=$(git branch --show-current)
    echo "📍 Current branch: $current_branch"
    
    if [ "$current_branch" = "develop" ] || [ "$current_branch" = "main" ]; then
        echo "✅ On deployment branch"
    else
        echo "⚠️  Not on develop or main branch. CI/CD only runs on these branches."
    fi
else
    echo "❌ Not a git repository"
fi

# Test 5: Environment variables check
echo ""
echo "🔐 Environment Variables Check..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
    
    # Check if required variables are set (without showing values)
    ENV_VARS=("OPENWEATHER_API_KEY" "GOOGLE_MAPS_API_KEY" "NEXT_PUBLIC_MAPBOX_API_KEY")
    
    for var in "${ENV_VARS[@]}"; do
        if grep -q "^$var=" .env; then
            echo "✅ $var is set"
        else
            echo "⚠️  $var not found in .env"
        fi
    done
else
    echo "⚠️  .env file not found. Create one for local testing."
fi

# Test 6: Suggest next steps
echo ""
echo "📋 Next Steps:"
echo "============="

echo "For GitLab CI/CD setup:"
echo "1. Go to: https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/settings/ci_cd"
echo "2. Configure CI/CD Variables:"
echo "   - DEPLOY_SERVER: 137.43.49.26"
echo "   - DEPLOY_USER: student"
echo "   - SSH_PRIVATE_KEY: (your private key)"
echo "   - OPENWEATHER_API_KEY: (your API key)"
echo "   - GOOGLE_MAPS_API_KEY: (your API key)"
echo "   - NEXT_PUBLIC_MAPBOX_API_KEY: (your API key)"

echo ""
echo "For manual deployment:"
echo "1. SSH to server: ssh student@137.43.49.26"
echo "2. Run setup script: curl -L https://raw.githubusercontent.com/your-repo/main/scripts/setup-server.sh | bash"

echo ""
echo "For local testing:"
echo "1. Ensure Docker is running"
echo "2. Run: docker-compose up --build"
echo "3. Access: http://localhost:3000 (webapp) and http://localhost:5000 (ml-api)"

echo ""
echo "🎯 Ready to deploy! Choose your deployment method:"
echo "   A) GitLab CI/CD (automated)"
echo "   B) Manual deployment on server"
echo "   C) Local development testing"
