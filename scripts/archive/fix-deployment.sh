#!/bin/bash

# 修复和诊断脚本
echo "🔍 诊断部署问题..."

DEPLOY_DIR="/opt/team9-deploy"
cd $DEPLOY_DIR

echo "📁 当前目录: $(pwd)"
echo "📋 目录内容:"
ls -la

echo -e "\n🔍 查找 docker-compose 文件:"
find . -name "docker-compose*" -type f

echo -e "\n🔍 查找 Dockerfile:"
find . -name "Dockerfile" -type f

echo -e "\n📦 Git 状态:"
git status 2>/dev/null || echo "不是 Git 仓库"

echo -e "\n🌿 当前分支:"
git branch 2>/dev/null || echo "无法检查分支"

echo -e "\n📋 根目录文件:"
ls -la | head -20

# 如果找不到 docker-compose.yml，尝试重新克隆到子目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "\n❌ 找不到 docker-compose.yml，重新克隆..."
    cd /opt
    sudo rm -rf team9-deploy
    sudo mkdir team9-deploy
    sudo chown $USER:$USER team9-deploy
    cd team9-deploy
    
    echo "🔄 重新克隆项目..."
    git clone https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9.git .
    
    echo "📋 克隆后的文件:"
    ls -la
    
    if [ -f "docker-compose.yml" ]; then
        echo "✅ 找到 docker-compose.yml"
        
        echo -e "\n🔧 创建 .env 文件..."
        cat > .env << EOF
OPENWEATHER_API_KEY=d80653ff6bef26981a00369ab5f9a00c
GOOGLE_MAPS_API_KEY=AIzaSyCLxVxjw2d27TagAHFCYCjjrresvXw7Pg8
NEXT_PUBLIC_MAPBOX_API_KEY=pk.eyJ1IjoicHJha2hhcmRheWFsIiwiYSI6ImNtYm5qeDRnajE4bzcyaXF5cWtha5V1d2wifQ.vkY8ZEZMIn4wS7sP7nMF7Q
EOF
        
        echo "🛑 清理现有容器..."
        sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true
        sudo docker system prune -f
        
        echo "🏗️ 构建项目..."
        sudo docker-compose build
        
        echo "🚀 启动项目..."
        sudo docker-compose up -d
        
        echo "📊 检查状态..."
        sudo docker-compose ps
        
        echo "📝 容器日志:"
        sudo docker-compose logs --tail=5 webapp 2>/dev/null || echo "无 webapp 日志"
        sudo docker-compose logs --tail=5 ml-api 2>/dev/null || echo "无 ml-api 日志"
        
    else
        echo "❌ 重新克隆后仍然找不到 docker-compose.yml"
        echo "🔍 让我们检查远程仓库内容:"
        git ls-tree HEAD
    fi
else
    echo "✅ 找到 docker-compose.yml"
fi

echo -e "\n🌐 检查网络工具..."
which netstat || echo "netstat 未安装，尝试安装..."
sudo apt update && sudo apt install -y net-tools 2>/dev/null || echo "无法安装 net-tools"

echo -e "\n🔥 检查端口监听:"
ss -tlnp | grep -E "(3030|5000)" || echo "没有端口在监听"

echo -e "\n✅ 诊断完成！"
