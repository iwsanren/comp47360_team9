#!/bin/bash

# Quick ML API Test Script
# This script tests all ML API endpoints to verify the fix

echo "🧪 Testing ML API Endpoints..."

SERVER_IP="137.43.49.26"
LOCAL_IP="localhost"

echo "=================================="
echo "Testing Local ML API (localhost:5000)"
echo "=================================="

echo "1. Testing root endpoint (/):"
curl -s http://$LOCAL_IP:5000/ | jq . 2>/dev/null || echo "❌ Root endpoint failed"

echo ""
echo "2. Testing predict-all endpoint:"
curl -s http://$LOCAL_IP:5000/predict-all | jq '.timestamp, .predictions | length' 2>/dev/null || echo "❌ Predict-all endpoint failed"

echo ""
echo "3. Testing health endpoint:"
curl -s http://$LOCAL_IP:5000/health | jq . 2>/dev/null || echo "❌ Health endpoint failed"

echo ""
echo "=================================="
echo "Testing ML API through Nginx Proxy"
echo "=================================="

echo "4. Testing /api/ml/ (root via Nginx):"
curl -s http://$SERVER_IP/api/ml/ | jq . 2>/dev/null || echo "❌ /api/ml/ failed"

echo ""
echo "5. Testing /api/ml/predict-all (via Nginx):"
curl -s http://$SERVER_IP/api/ml/predict-all | jq '.timestamp, .predictions | length' 2>/dev/null || echo "❌ /api/ml/predict-all failed"

echo ""
echo "6. Testing /api/ml/health (via Nginx):"
curl -s http://$SERVER_IP/api/ml/health | jq . 2>/dev/null || echo "❌ /api/ml/health failed"

echo ""
echo "=================================="
echo "Container Status Check"
echo "=================================="

echo "7. Docker containers status:"
docker-compose ps

echo ""
echo "8. Nginx status:"
sudo systemctl status nginx --no-pager -l | head -10

echo ""
echo "✅ Test Complete!"
echo "If all endpoints return JSON data, the fix is successful!"
