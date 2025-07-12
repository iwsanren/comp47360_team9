#!/bin/bash

# Test script to validate docker-compose setup locally
# This mimics what the CI/CD pipeline does

echo "=== Testing Docker Compose Setup ==="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Creating a sample .env file for testing..."
    cat > .env << EOF
OPENWEATHER_API_KEY=your_openweather_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_key_here
NODE_ENV=development
FLASK_ENV=production
EOF
    echo "✅ Sample .env file created. Please update with real API keys."
fi

echo "📋 Current .env file contents:"
cat .env
echo ""

echo "🔧 Testing docker-compose build..."
docker-compose build

if [ $? -eq 0 ]; then
    echo "✅ Docker compose build successful!"
else
    echo "❌ Docker compose build failed!"
    exit 1
fi

echo ""
echo "🚀 Testing docker-compose up (detached)..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ Docker compose up successful!"
else
    echo "❌ Docker compose up failed!"
    exit 1
fi

echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "🌐 Service URLs:"
echo "  - Webapp: http://localhost:3030"
echo "  - ML API: http://localhost:5000"

echo ""
echo "📝 To test the services:"
echo "  - Open http://localhost:3030 in your browser"
echo "  - Test ML API: curl http://localhost:5000"

echo ""
echo "🛑 To stop the services:"
echo "  docker-compose down"

echo ""
echo "=== Test Complete ==="
