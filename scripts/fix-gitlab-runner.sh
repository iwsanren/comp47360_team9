#!/bin/bash

# GitLab Runner Docker Socket Configuration Script
# Run this on the server (137.43.49.26) to fix Docker-in-Docker issues

echo "🔧 Configuring GitLab Runner to use host Docker socket..."

# Backup current config
sudo cp /etc/gitlab-runner/config.toml /etc/gitlab-runner/config.toml.backup

# Update the configuration
sudo tee /etc/gitlab-runner/config.toml > /dev/null << 'EOF'
concurrent = 1
check_interval = 0

[session_server]
  session_timeout = 1800

[[runners]]
  name = "manhattan-my-way-runner"
  url = "https://csgitlab.ucd.ie/"
  token = "mh1o69nVW"
  executor = "docker"
  [runners.custom_build_dir]
  [runners.cache]
    [runners.cache.s3]
    [runners.cache.gcs]
    [runners.cache.azure]
  [runners.docker]
    tls_verify = false
    image = "docker:24.0.5"
    privileged = false
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]
    shm_size = 0
EOF

echo "✅ Configuration updated!"

# Restart GitLab Runner
echo "🔄 Restarting GitLab Runner..."
sudo gitlab-runner restart

# Check status
echo "📊 GitLab Runner status:"
sudo gitlab-runner status

echo "🎉 Done! GitLab Runner should now use the host Docker socket."
echo "Try running your pipeline again."
