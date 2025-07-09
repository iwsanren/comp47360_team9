#!/bin/bash
# GitLab Runner Diagnosis Script

echo "=== GitLab Runner Diagnosis ==="
echo "Checking GitLab Runner status and configuration..."
echo ""

# Check if GitLab Runner is installed
echo "1. Checking GitLab Runner installation:"
if command -v gitlab-runner &> /dev/null; then
    echo "✓ GitLab Runner is installed"
    gitlab-runner --version
else
    echo "✗ GitLab Runner is not installed or not in PATH"
    echo "Install with: curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash"
    echo "Then: sudo apt-get install gitlab-runner"
fi
echo ""

# Check GitLab Runner status
echo "2. Checking GitLab Runner service status:"
if systemctl is-active --quiet gitlab-runner; then
    echo "✓ GitLab Runner service is running"
else
    echo "✗ GitLab Runner service is not running"
    echo "Start with: sudo systemctl start gitlab-runner"
    echo "Enable with: sudo systemctl enable gitlab-runner"
fi
echo ""

# List registered runners
echo "3. Checking registered runners:"
if command -v gitlab-runner &> /dev/null; then
    sudo gitlab-runner list
else
    echo "Cannot check runners - GitLab Runner not found"
fi
echo ""

# Check runner configuration
echo "4. Checking runner configuration:"
if [ -f /etc/gitlab-runner/config.toml ]; then
    echo "✓ Config file exists at /etc/gitlab-runner/config.toml"
    echo "Current configuration:"
    sudo cat /etc/gitlab-runner/config.toml
else
    echo "✗ Config file not found at /etc/gitlab-runner/config.toml"
fi
echo ""

# Check Docker availability (if using Docker executor)
echo "5. Checking Docker availability:"
if command -v docker &> /dev/null; then
    echo "✓ Docker is installed"
    docker --version
    if docker ps &> /dev/null; then
        echo "✓ Docker is running"
    else
        echo "✗ Docker is not running or permission denied"
        echo "Start with: sudo systemctl start docker"
    fi
else
    echo "✗ Docker is not installed"
fi
echo ""

echo "=== Common Solutions ==="
echo ""
echo "If runner is not picking up jobs, try:"
echo "1. Check runner tags match job tags in .gitlab-ci.yml"
echo "2. Restart runner: sudo gitlab-runner restart"
echo "3. Re-register runner if needed"
echo "4. Check project settings > CI/CD > Runners"
echo "5. Ensure runner is not paused"
echo ""
echo "To register a new runner:"
echo "sudo gitlab-runner register"
echo "  - URL: https://csgitlab.ucd.ie/"
echo "  - Token: [Get from GitLab project settings]"
echo "  - Executor: docker"
echo "  - Default image: alpine:latest"
echo "  - Tags: docker"
