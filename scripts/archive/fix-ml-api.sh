#!/bin/bash

# ML API Fix and Deployment Script
# This script rebuilds the ML API with the new routes and reloads Nginx

echo "🔧 Starting ML API Fix and Deployment..."

# Step 1: Rebuild ML API container
echo "1. Rebuilding ML API container..."
docker-compose down ml-api
docker-compose build --no-cache ml-api
docker-compose up -d ml-api

# Step 2: Check if ML API is running
echo "2. Checking ML API status..."
sleep 5
docker-compose ps ml-api

# Step 3: Test ML API endpoints directly
echo "3. Testing ML API endpoints directly..."
echo "Testing root endpoint (/):"
curl -s http://localhost:5000/ | jq . || echo "❌ Root endpoint failed"

echo "Testing predict-all endpoint:"
curl -s http://localhost:5000/predict-all | jq '.timestamp, .predictions | length' || echo "❌ Predict-all endpoint failed"

echo "Testing health endpoint:"
curl -s http://localhost:5000/health | jq . || echo "❌ Health endpoint failed"

# Step 4: Update Nginx configuration
echo "4. Updating Nginx configuration..."
if [ -f "nginx.conf" ]; then
    sudo cp nginx.conf /etc/nginx/sites-available/manhattan-my-way
    
    # Test Nginx configuration
    echo "Testing Nginx configuration..."
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration is valid"
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded successfully"
    else
        echo "❌ Nginx configuration has errors"
        exit 1
    fi
else
    echo "❌ nginx.conf not found in current directory"
    exit 1
fi

# Step 5: Test ML API endpoints through Nginx
echo "5. Testing ML API endpoints through Nginx..."
SERVER_IP="137.43.49.26"

echo "Testing /api/ml/ (root):"
curl -s http://$SERVER_IP/api/ml/ | jq . || echo "❌ /api/ml/ failed"

echo "Testing /api/ml/predict-all:"
curl -s http://$SERVER_IP/api/ml/predict-all | jq '.timestamp, .predictions | length' || echo "❌ /api/ml/predict-all failed"

echo "Testing /api/ml/health:"
curl -s http://$SERVER_IP/api/ml/health | jq . || echo "❌ /api/ml/health failed"

# Step 6: Final status check
echo "6. Final deployment status:"
echo "✅ Docker containers status:"
docker-compose ps

echo "✅ Nginx status:"
sudo systemctl status nginx --no-pager -l

echo "🎉 ML API Fix and Deployment Complete!"
echo ""
echo "Available endpoints:"
echo "- http://$SERVER_IP/api/ml/ (API information)"
echo "- http://$SERVER_IP/api/ml/predict-all (Get predictions)"
echo "- http://$SERVER_IP/api/ml/health (Health check)"
echo "- http://$SERVER_IP/ (Main webapp)"
