# ✅ 简化 CI/CD 配置完成

你的 GitLab CI/CD 已经配置为简化模式，无需 GitLab Runner。

## 🚀 下一步操作

### 1. 配置 GitLab CI/CD 变量
打开：https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/settings/ci_cd

点击 "Variables" 展开，添加以下变量：

| 变量名 | 值 | Protected | Masked |
|--------|---|-----------|---------|
| `DEPLOY_SERVER` | `137.43.49.26` | ✓ | ✗ |
| `DEPLOY_USER` | `student` | ✓ | ✗ |
| `SSH_PRIVATE_KEY` | (你的私钥内容) | ✓ | ✓ |
| `OPENWEATHER_API_KEY` | (你的天气 API 密钥) | ✓ | ✓ |
| `GOOGLE_MAPS_API_KEY` | (你的谷歌地图 API 密钥) | ✓ | ✓ |
| `NEXT_PUBLIC_MAPBOX_API_KEY` | (你的 Mapbox API 密钥) | ✗ | ✓ |

### 2. 生成 SSH 密钥（如果还没有）

在你的电脑上运行：
```bash
# 生成新的 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "gitlab-ci@team9" -f ~/.ssh/gitlab_ci_key

# 复制公钥到服务器
ssh-copy-id -i ~/.ssh/gitlab_ci_key.pub student@137.43.49.26

# 显示私钥内容，复制到 GitLab 变量中
cat ~/.ssh/gitlab_ci_key
```

### 3. 测试部署

提交更改并推送到 develop 分支：
```bash
git add .
git commit -m "Switch to simplified CI/CD configuration"
git push origin develop
```

### 4. 监控部署

查看 pipeline 状态：
https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/pipelines

### 5. 访问应用

- **Staging**: http://137.43.49.26:3030
- **Production**: http://137.43.49.26:8080 (手动部署到 main 分支)

## 🔧 新的 CI/CD 工作流程

### 简化模式特点
- ✅ 无需 GitLab Runner 设置
- ✅ 直接在服务器上构建
- ✅ 更简单的故障排查
- ✅ 降低复杂性

### 部署流程
1. **Staging (develop 分支)**: 自动部署
2. **Production (main 分支)**: 手动部署

### 工作原理
1. GitLab CI/CD 通过 SSH 连接到服务器
2. 在服务器上克隆/更新代码
3. 直接在服务器上构建 Docker 镜像
4. 启动容器

## 📋 故障排查

如果部署失败，检查：
1. GitLab CI/CD 变量是否正确设置
2. SSH 密钥是否正确配置
3. 服务器是否可访问
4. Docker 是否在服务器上运行

查看详细日志：
https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/pipelines

## 🎯 现在可以：
1. 配置 GitLab 变量
2. 生成并配置 SSH 密钥
3. 推送代码测试部署
4. 享受自动化部署！

所有详细信息请参考：
- `docs/quick-setup-guide.md`
- `docs/gitlab-runner-setup.md`
- `docs/cicd-deployment.md`
