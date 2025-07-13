#!/bin/bash

# Scripts cleanup and reorganization script
echo "🧹 Cleaning up and reorganizing scripts directory..."

# Create new directories
mkdir -p scripts/setup
mkdir -p scripts/windows
mkdir -p scripts/archive

echo "📁 Created new directory structure"

# Move setup scripts
echo "🔧 Moving setup scripts..."
mv scripts/setup-server.sh scripts/setup/ 2>/dev/null || true
mv scripts/setup-nginx.sh scripts/setup/ 2>/dev/null || true
mv scripts/configure-firewall.sh scripts/setup/ 2>/dev/null || true
mv scripts/setup-ssh-keys.sh scripts/setup/ 2>/dev/null || true
mv scripts/install-gitlab-runner-linux.sh scripts/setup/ 2>/dev/null || true

# Move Windows scripts
echo "🪟 Moving Windows scripts..."
mv scripts/diagnose-gitlab-runner.bat scripts/windows/ 2>/dev/null || true
mv scripts/install-gitlab-runner.bat scripts/windows/ 2>/dev/null || true
mv scripts/setup-ssh-keys.bat scripts/windows/ 2>/dev/null || true
mv scripts/switch-to-simple-cicd.bat scripts/windows/ 2>/dev/null || true
mv scripts/test-docker-setup.bat scripts/windows/ 2>/dev/null || true

# Archive obsolete scripts
echo "📁 Archiving obsolete scripts..."
mv scripts/docker-startup.sh scripts/archive/ 2>/dev/null || true
mv scripts/cleanup-ci-files.sh scripts/archive/ 2>/dev/null || true
mv scripts/restart-project.sh scripts/archive/ 2>/dev/null || true
mv scripts/manual-deploy.sh scripts/archive/ 2>/dev/null || true
mv scripts/fix-deployment.sh scripts/archive/ 2>/dev/null || true
mv scripts/fix-gitlab-runner.sh scripts/archive/ 2>/dev/null || true
mv scripts/fix-ml-api.sh scripts/archive/ 2>/dev/null || true

# Create combined diagnostic script
echo "🔍 Creating combined diagnostic script..."
cat > scripts/diagnose-project.sh << 'EOF'
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
EOF

chmod +x scripts/diagnose-project.sh

# Archive old diagnostic scripts
mv scripts/diagnose-containers.sh scripts/archive/ 2>/dev/null || true
mv scripts/troubleshoot-containers.sh scripts/archive/ 2>/dev/null || true
mv scripts/test-docker-setup.sh scripts/archive/ 2>/dev/null || true

echo "✅ Scripts cleanup completed!"
echo ""
echo "📊 New structure:"
echo "├── Core scripts (active use)"
echo "├── setup/ (one-time setup)"
echo "├── windows/ (Windows-specific)"
echo "└── archive/ (obsolete scripts)"
echo ""
echo "🎯 Active scripts remaining:"
ls -la scripts/*.sh | grep -v "^d" | wc -l
echo "scripts: $(ls -1 scripts/*.sh 2>/dev/null | wc -l)"
