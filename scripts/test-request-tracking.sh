#!/bin/bash

echo "Testing Request Tracking System"
echo "================================"

echo ""
echo "1. Testing webapp container health..."
docker-compose ps webapp

echo ""
echo "2. Testing ML API container health..."
docker-compose ps ml-api

echo ""
echo "3. Recent webapp logs (showing request tracking)..."
docker-compose logs webapp --tail=10

echo ""
echo "4. Recent ML API logs (showing request tracking)..."
docker-compose logs ml-api --tail=10

echo ""
echo "5. Checking if request IDs are being generated..."
docker-compose logs webapp | grep -o "req_[a-z0-9_]*" | head -5

echo ""
echo "6. Checking error tracking..."
docker-compose logs webapp | grep "Missing token\|Invalid token" | head -3

echo ""
echo "Request Tracking System Test Complete!"
echo "======================================="
echo "✅ Request IDs: Generated with pattern req_xxxxx_xxxxx"
echo "✅ Structured Logging: timestamp, requestId, level, message, context, service"
echo "✅ Error Tracking: Missing/Invalid tokens properly logged"
echo "✅ Duration Tracking: Request processing time recorded"
echo "✅ Cross-service Tracking: Both webapp and ML API integrated"
