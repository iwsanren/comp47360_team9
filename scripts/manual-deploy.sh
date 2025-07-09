#!/bin/bash

# 手动部署脚本
echo "🚀 手动部署 Manhattan My Way 项目..."

# 创建部署目录
DEPLOY_DIR="/opt/team9-deploy"
echo "📁 创建部署目录: $DEPLOY_DIR"
sudo mkdir -p $DEPLOY_DIR
sudo chown $USER:$USER $DEPLOY_DIR
cd $DEPLOY_DIR

echo "📦 克隆/更新项目代码..."
if [ -d ".git" ]; then
    echo "更新现有仓库..."
    git fetch origin
    git reset --hard origin/develop
else
    echo "克隆新仓库..."
    git clone https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9.git .
fi

echo "🛑 停止所有现有容器..."
sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true
sudo docker system prune -f 2>/dev/null || true

echo "🔧 检查环境文件..."
if [ -f ".env" ]; then
    echo "✅ 找到 .env 文件"
    head -3 .env
else
    echo "⚠️  创建临时 .env 文件..."
    cat > .env << EOF
OPENWEATHER_API_KEY=d80653ff6bef26981a00369ab5f9a00c
GOOGLE_MAPS_API_KEY=AIzaSyCLxVxjw2d27TagAHFCYCjjrresvXw7Pg8
NEXT_PUBLIC_MAPBOX_API_KEY=pk.eyJ1IjoicHJha2hhcmRheWFsIiwiYSI6ImNtYm5qeDRnajE4bzcyaXF5cWthNXV1d2wifQ.vkY8ZEZMIn4wS7sP7nMF7Q
EOF
fi

echo "🏗️  构建项目..."
sudo docker-compose build --no-cache

echo "🚀 启动项目..."
sudo docker-compose up -d

echo "⏳ 等待容器启动..."
sleep 15

echo "📊 检查容器状态..."
sudo docker-compose ps

echo "📝 检查容器日志..."
echo "=== Web应用日志 ==="
sudo docker-compose logs --tail=10 webapp 2>/dev/null || echo "无 webapp 日志"

echo "=== ML API日志 ==="
sudo docker-compose logs --tail=10 ml-api 2>/dev/null || echo "无 ml-api 日志"

echo "🌐 测试本地连接..."
sleep 5
echo "测试 localhost:3030..."
curl -s -I http://localhost:3030 | head -1 || echo "本地连接失败"

echo "🔥 检查端口监听..."
sudo netstat -tlnp | grep -E "(3030|5000)" || echo "没有端口在监听"

echo "✅ 部署完成！"
echo "🌍 Web应用: http://137.43.49.26:3030"
echo "🤖 ML API: http://137.43.49.26:5000"

echo "💡 如果无法访问，请检查："
echo "   1. 防火墙设置: sudo ufw status"
echo "   2. 容器日志: sudo docker-compose logs"
echo "   3. 端口占用: sudo netstat -tlnp | grep 3030"
