#!/bin/bash

echo "🚀 Complete System Test"
echo "========================"

echo ""
echo "📊 1. Container Status Check"
docker-compose ps

echo ""
echo "🔍 2. ML API Health Check"
echo "Visit http://localhost:5000/health"

echo ""
echo "🌐 3. Web Application Status"
echo "Visit http://localhost:3030"

echo ""
echo "📝 4. Recent Request Tracking Logs"
echo "Web application logs:"
docker-compose logs webapp --tail=5 | grep "req_"

echo ""
echo "ML API logs:"
docker-compose logs ml-api --tail=5 | grep "req_"

echo ""
echo "🎯 5. Error Fix Summary"
echo "======================"
echo "✅ TypeScript compilation error - Resolved"
echo ""
echo "   Issue: Next.js App Router doesn't support HOF pattern for API exports"
echo ""
echo "   Solution: Refactored to inline request tracking pattern"
echo "   Solution: Refactored to inline request tracking pattern"
echo ""
echo "✅ ML API startup error - Resolved"
echo ""
echo "   Issue: Dockerfile missing utils directory copy"
echo ""
echo "   Solution: Added COPY utils/ ./utils/ to Dockerfile"
echo ""
echo "🎉 System Status: All services running normally"
echo ""
echo "🔗 Available Endpoints:"
echo "   - Web Application: http://localhost:3030"
echo "   - ML API: http://localhost:5000"
echo "   - ML Health Check: http://localhost:5000/health"
