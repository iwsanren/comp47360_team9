# Scripts 文件夹清理说明

## 当前脚本文件状态

### 1. setup-server.sh ✅ **保留**
- **用途**: 在服务器上初始化部署环境
- **功能**: 安装 Docker、Docker Compose、配置部署目录
- **需要**: 在服务器首次部署时运行
- **保留原因**: CI/CD 部署的前置条件

### 2. test-config.sh ✅ **保留**
- **用途**: 本地测试项目配置是否正确
- **功能**: 检查文件结构、Docker 环境、Git 状态等
- **需要**: 开发时验证配置
- **保留原因**: 调试和验证工具

### 3. switch-to-simple-cicd.bat ❌ **可删除**
- **用途**: 切换到简化 CI/CD 配置
- **状态**: 已经完成切换，不再需要
- **原因**: 一次性使用的脚本

## 建议操作

### 删除不需要的脚本
```bash
# 删除已完成任务的切换脚本
rm scripts/switch-to-simple-cicd.bat
```

### 保留的脚本
- `scripts/setup-server.sh` - 服务器环境初始化
- `scripts/test-config.sh` - 配置测试工具

### 添加到 .gitignore (可选)
如果你想保留脚本文件但不提交到版本控制：
```
backup/
*.bak
*.tmp
```

## 最终文件结构

```
scripts/
├── setup-server.sh     # 服务器初始化脚本
└── test-config.sh      # 配置测试脚本
```
