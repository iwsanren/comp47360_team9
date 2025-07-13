#!/bin/bash

# 项目重启脚本
echo "🚀 重启 Manhattan My Way 项目..."

# 找到项目目录
PROJECT_DIRS=(
    "/home/gitlab-runner/builds"
    "/opt/team9-deploy/staging"
    "/tmp/team9-deploy/staging"
    "$HOME/team9-deploy/staging"
)

PROJECT_DIR=""
for dir in "${PROJECT_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        FOUND=$(find "$dir" -name "docker-compose.yml" -path "*/comp47360_team9/*" 2>/dev/null | head -1)
        if [ -n "$FOUND" ]; then
            PROJECT_DIR=$(dirname "$FOUND")
            break
        fi
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ 无法找到项目目录，手动查找..."
    find /home -name "docker-compose.yml" -path "*/comp47360_team9/*" 2>/dev/null
    exit 1
fi

echo "📁 项目目录: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "🛑 停止所有相关容器..."
# 停止旧项目
sudo docker stop microservice-demo_frontend_1 microservice-demo_api_1 microservice-demo_ml_1 2>/dev/null || true

# 停止当前项目
sudo docker-compose down 2>/dev/null || true

echo "🏗️ 构建项目..."
sudo docker-compose build

echo "🚀 启动项目..."
sudo docker-compose up -d

echo "📊 检查状态..."
sudo docker-compose ps

echo "📝 显示日志..."
sudo docker-compose logs --tail=10 webapp

echo "🌐 测试连接..."
sleep 5
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:3030 || echo "本地连接测试失败"

echo "✅ 重启完成！"
echo "🌍 访问地址: http://137.43.49.26:3030"
