#!/bin/bash

# Combined project diagnostic script
echo "🔍 Manhattan My Way - Project Diagnostics"
echo "========================================"

echo "=== Docker Environment ==="
echo "Docker version:"
docker --version
echo "Docker Compose version:"
docker-compose --version

echo -e "\n=== Container Status ==="
docker ps -a

echo -e "\n=== Docker Compose Services ==="
docker-compose ps

echo -e "\n=== Port Status ==="
netstat -tlnp | grep -E "(3030|5000|8080|5001)" || echo "No relevant ports found"

echo -e "\n=== Container Logs (last 10 lines) ==="
echo "📱 Web Application:"
docker logs comp47360_team9-webapp-1 2>&1 | tail -10

echo -e "\n🤖 ML API:"
docker logs comp47360_team9-ml-api-1 2>&1 | tail -10

echo -e "\n=== System Resources ==="
echo "Disk usage:"
df -h
echo "Memory usage:"
free -h

echo -e "\n=== ML API Health Check ==="
curl -f http://localhost:5000/health 2>/dev/null && echo "✅ ML API is healthy" || echo "❌ ML API is not responding"

echo -e "\n=== Web App Health Check ==="
curl -f http://localhost:3030/api/health 2>/dev/null && echo "✅ Web App is healthy" || echo "❌ Web App is not responding"

echo -e "\n✅ Diagnostics completed!"
