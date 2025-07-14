#!/bin/bash

# Render 部署测试脚本
# 这个脚本测试 Render 上的服务是否正常运行

echo "🧪 测试 Render 部署的服务..."

# 你需要替换这些 URL 为你的 Render 服务 URL
WEBAPP_URL="https://your-webapp.onrender.com"
ML_API_URL="https://your-ml-api.onrender.com"

echo "=================================="
echo "测试 ML API 服务"
echo "=================================="

echo "1. 测试 ML API 根端点:"
curl -s "$ML_API_URL/" | jq . 2>/dev/null || echo "❌ ML API 根端点失败"

echo ""
echo "2. 测试 ML API predict-all 端点:"
curl -s "$ML_API_URL/predict-all" | jq '.timestamp, .predictions | length' 2>/dev/null || echo "❌ ML API predict-all 端点失败"

echo ""
echo "3. 测试 ML API health 端点:"
curl -s "$ML_API_URL/health" | jq . 2>/dev/null || echo "❌ ML API health 端点失败"

echo ""
echo "=================================="
echo "测试前端 Web 应用"
echo "=================================="

echo "4. 测试前端首页:"
curl -s -I "$WEBAPP_URL/" | head -n 1 || echo "❌ 前端首页失败"

echo ""
echo "5. 测试前端地图页面:"
curl -s -I "$WEBAPP_URL/map" | head -n 1 || echo "❌ 前端地图页面失败"

echo ""
echo "=================================="
echo "测试服务间通信"
echo "=================================="

echo "6. 测试前端调用 ML API:"
curl -s "$WEBAPP_URL/api/manhattan" -X POST | jq . 2>/dev/null || echo "❌ 前端调用 ML API 失败"

echo ""
echo "✅ 测试完成!"
echo ""
echo "如果所有测试都通过，说明 Render 部署成功！"
echo "如果有测试失败，请检查:"
echo "- 服务是否正在运行"
echo "- 环境变量是否正确设置"
echo "- 服务间通信是否正常"
