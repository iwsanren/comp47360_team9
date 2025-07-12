#!/bin/bash
# GitLab Runner 安装脚本 - 用于 Linux VM

echo "Installing GitLab Runner on Linux VM..."

# 1. 下载 GitLab Runner
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash

# 2. 安装 GitLab Runner
sudo apt-get install gitlab-runner

# 3. 检查安装
gitlab-runner --version

# 4. 注册 Runner
echo "Now you need to register the runner with your GitLab project:"
echo "Run: sudo gitlab-runner register"
echo ""
echo "You'll need:"
echo "- GitLab URL: https://csgitlab.ucd.ie/"
echo "- Registration token from your project settings"
echo "- Description: team9-runner"
echo "- Tags: docker,linux"
echo "- Executor: docker"
echo "- Default Docker image: alpine:latest"
