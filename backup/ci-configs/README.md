# GitLab CI/CD 配置文件说明

## 当前使用的配置

### 🎯 `.gitlab-ci.yml` 
**当前活跃的 CI/CD 配置**
- **类型**: GitLab Runner + Docker Socket
- **特点**: 
  - 使用自托管 GitLab Runner
  - 直接使用宿主机 Docker socket (`/var/run/docker.sock`)
  - 避免了 Docker-in-Docker 的权限问题
  - 部署到持久目录 `/tmp/team9-deploy/staging`
- **状态**: ✅ 正在使用，Pipeline 可以成功运行

## 归档的配置文件

### 📁 `backup/ci-configs/` 目录说明

| 文件名 | 描述 | 状态 |
|--------|------|------|
| `gitlab-ci-current.yml` | 当前配置的备份 | 📋 备份 |
| `.gitlab-ci-standard.yml` | 最初的标准配置，使用 DinD | ❌ 有权限问题 |
| `.gitlab-ci-ssh-backup.yml` | SSH 远程部署方式 | 🔧 可用但复杂 |
| `.gitlab-ci-runner.yml` | GitLab Runner 原始版本 | ⚠️ 有构建问题 |
| `.gitlab-ci-clean.yml` | 清理后的配置版本 | 📝 语法修复版 |
| `.gitlab-ci-backup2.yml` | 临时备份版本 | 💾 备份 |

## 配置演进历史

1. **SSH 远程部署** → 需要 SSH 密钥管理，较复杂
2. **Docker-in-Docker (DinD)** → 权限问题，容器启动失败
3. **GitLab Runner + Docker Socket** → ✅ 当前方案，稳定可靠

## 推荐做法

- **保留**: 只需要关注 `.gitlab-ci.yml`
- **备份**: 所有历史配置已归档到 `backup/ci-configs/`
- **回滚**: 如需回滚，可从备份目录复制配置文件

## 下一步

如果当前配置工作正常，可以考虑删除备份文件来保持项目整洁：

```bash
# 如果确认不需要历史配置
rm -rf backup/ci-configs/
```

---
*最后更新: 2025-07-09*
