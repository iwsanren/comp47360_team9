#!/bin/bash

# CI 文件清理脚本
echo "🧹 清理 GitLab CI 配置文件..."

echo "📋 当前的 CI 文件:"
ls -la .gitlab-ci*

echo -e "\n🎯 推荐的文件保留策略:"
echo "✅ 保留: .gitlab-ci.yml (当前活跃的配置)"
echo "📁 归档: 其他文件移动到 backup/ 目录"

# 创建备份目录
mkdir -p backup/ci-configs

# 当前活跃配置的备份
echo -e "\n💾 备份当前活跃配置..."
cp .gitlab-ci.yml backup/ci-configs/gitlab-ci-current.yml

# 移动旧配置文件到备份目录
echo "📦 归档旧配置文件..."
for file in .gitlab-ci-*.yml; do
    if [ -f "$file" ]; then
        echo "移动 $file -> backup/ci-configs/"
        mv "$file" backup/ci-configs/
    fi
done

echo -e "\n📋 清理后的文件结构:"
echo "主配置: .gitlab-ci.yml"
echo "备份目录: backup/ci-configs/"
ls -la backup/ci-configs/

echo -e "\n📝 各配置文件说明:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 .gitlab-ci.yml                    ← 当前使用 (GitLab Runner + Docker)"
echo "📁 backup/ci-configs/gitlab-ci-standard.yml     ← 标准配置 (有 DinD 问题)"
echo "📁 backup/ci-configs/gitlab-ci-ssh-backup.yml   ← SSH 远程部署方式"
echo "📁 backup/ci-configs/gitlab-ci-runner.yml       ← GitLab Runner 原版"
echo "📁 backup/ci-configs/gitlab-ci-clean.yml        ← 清理过的版本"
echo "📁 backup/ci-configs/gitlab-ci-backup2.yml      ← 备份版本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "\n✅ 清理完成！"
echo "🎯 现在只需要关注 .gitlab-ci.yml 这一个文件"
echo "📁 如果需要回滚，所有旧配置都在 backup/ci-configs/ 目录中"
