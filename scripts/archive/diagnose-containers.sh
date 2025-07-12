#!/bin/bash

# 容器诊断脚本
echo "🔍 诊断容器和网络状态..."

echo "=== Docker 容器状态 ==="
docker ps -a

echo -e "\n=== Docker Compose 服务状态 ==="
docker-compose ps

echo -e "\n=== 端口监听状态 ==="
netstat -tlnp | grep -E "(3030|5000|8080|5001)" || echo "没有找到相关端口"

echo -e "\n=== 容器网络详情 ==="
echo "Web应用容器网络："
docker inspect $(docker-compose ps -q webapp 2>/dev/null) --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo "Web应用容器未运行"

echo "ML API容器网络："
docker inspect $(docker-compose ps -q ml-api 2>/dev/null) --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo "ML API容器未运行"

echo -e "\n=== 测试本地连接 ==="
echo "测试 localhost:3030..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3030 || echo "连接失败"

echo -e "\n测试 127.0.0.1:3030..."
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3030 || echo "连接失败"

echo -e "\n=== 容器日志 (最后20行) ==="
echo "Web应用日志："
docker-compose logs --tail=20 webapp 2>/dev/null || echo "无法获取Web应用日志"

echo -e "\nML API日志："
docker-compose logs --tail=20 ml-api 2>/dev/null || echo "无法获取ML API日志"

echo -e "\n=== 防火墙状态 ==="
sudo ufw status 2>/dev/null || echo "无法检查防火墙状态"

echo -e "\n🎯 诊断完成！"
