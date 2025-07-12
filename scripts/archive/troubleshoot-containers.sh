#!/bin/bash

# 容器故障排除脚本
echo "🔍 分析容器退出原因..."

echo "=== 查看容器日志 ==="
echo "📱 Web应用日志："
sudo docker logs comp47360_team9-webapp-1 2>&1 | tail -20

echo -e "\n🤖 ML API日志："
sudo docker logs comp47360_team9-ml-api-1 2>&1 | tail -20

echo -e "\n=== 查找项目目录 ==="
PROJECT_DIRS=$(sudo find /home/gitlab-runner -name "comp47360_team9" -type d 2>/dev/null)
echo "找到的项目目录："
echo "$PROJECT_DIRS"

# 尝试找到最新的构建目录
if [ -n "$PROJECT_DIRS" ]; then
    LATEST_DIR=$(echo "$PROJECT_DIRS" | head -1)
    echo "使用目录: $LATEST_DIR"
    
    if [ -f "$LATEST_DIR/docker-compose.yml" ]; then
        echo -e "\n=== 尝试重新启动 ==="
        cd "$LATEST_DIR"
        
        echo "当前目录: $(pwd)"
        echo "Docker Compose 文件内容预览："
        head -10 docker-compose.yml
        
        echo -e "\n停止现有容器..."
        sudo docker-compose down 2>/dev/null || true
        
        echo "设置环境变量..."
        export OPENWEATHER_API_KEY="${OPENWEATHER_API_KEY:-dummy_key}"
        export GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY:-dummy_key}"
        export NEXT_PUBLIC_MAPBOX_API_KEY="${NEXT_PUBLIC_MAPBOX_API_KEY:-dummy_key}"
        
        echo "重新启动容器..."
        sudo -E docker-compose up -d
        
        echo -e "\n等待容器启动..."
        sleep 10
        
        echo "检查容器状态："
        sudo docker-compose ps
        
        echo -e "\n检查新的日志："
        sudo docker-compose logs --tail=5 webapp || true
        sudo docker-compose logs --tail=5 ml-api || true
        
    else
        echo "❌ 在 $LATEST_DIR 中没有找到 docker-compose.yml"
    fi
else
    echo "❌ 没有找到项目目录"
fi

echo -e "\n=== 网络检查 ==="
echo "检查端口占用："
sudo netstat -tlnp | grep -E "(3030|5000)" || echo "没有端口在监听"

echo -e "\n=== 完成 ==="
