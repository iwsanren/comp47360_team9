#!/bin/bash

# 防火墙配置脚本 - 开放必要端口
echo "🔥 配置防火墙规则..."

# 检查防火墙状态
echo "当前防火墙状态："
sudo ufw status

# 开放必要端口
echo "开放端口 3030 (Web应用)..."
sudo ufw allow 3030/tcp

echo "开放端口 5000 (ML API)..."
sudo ufw allow 5000/tcp

echo "开放端口 8080 (生产环境)..."
sudo ufw allow 8080/tcp

echo "开放端口 5001 (生产环境 ML API)..."
sudo ufw allow 5001/tcp

# 如果防火墙没有启用，启用它
if ! sudo ufw status | grep -q "Status: active"; then
    echo "启用防火墙..."
    echo "y" | sudo ufw enable
fi

echo "更新后的防火墙状态："
sudo ufw status

echo "✅ 防火墙配置完成！"
