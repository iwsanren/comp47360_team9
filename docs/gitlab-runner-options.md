# 检查学校 GitLab 可用的 Runner

## 步骤:

1. 登录到你的 GitLab 项目
2. 进入 Settings > CI/CD
3. 展开 "Runners" 部分
4. 查看是否有 "Available shared runners" 或 "Available group runners"

## 如果有共享 Runner:
- 确保已启用 "Enable shared runners for this project"
- 移除 .gitlab-ci.yml 中的 tags 配置

## 如果没有共享 Runner:
- 需要在 Linux VM 上安装自己的 Runner
- 使用 scripts/install-gitlab-runner-linux.sh 脚本

## 常见的学校 GitLab Runner 标签:
- shared
- docker
- linux
- shell

## 测试配置:
如果不确定有哪些 Runner 可用，可以尝试不同的标签组合：

```yaml
tags:
  - shared
# 或
tags:
  - linux
# 或者完全移除 tags
```
