# Quick Setup Guide for GitLab CI/CD

## Current Status ✅
Your project has all the necessary files:
- ✅ webapp/Dockerfile
- ✅ ml/Dockerfile  
- ✅ docker-compose.yml
- ✅ .gitlab-ci.yml
- ✅ .gitlab-ci-simple.yml (backup option)

## Option 1: Use Simplified CI/CD (Recommended)

This approach builds directly on the server and doesn't require GitLab Runner setup.

### Step 1: Switch to Simplified CI/CD
```bash
# In your project directory
mv .gitlab-ci.yml .gitlab-ci-standard.yml
mv .gitlab-ci-simple.yml .gitlab-ci.yml
git add .
git commit -m "Switch to simplified CI/CD approach"
```

### Step 2: Generate SSH Key for GitLab CI/CD
```bash
# Generate a new SSH key pair
ssh-keygen -t rsa -b 4096 -C "gitlab-ci@team9" -f ~/.ssh/gitlab_ci_key

# Copy public key to server
ssh-copy-id -i ~/.ssh/gitlab_ci_key.pub student@137.43.49.26

# Display private key to copy to GitLab
cat ~/.ssh/gitlab_ci_key
```

### Step 3: Configure GitLab CI/CD Variables

Go to: `https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/settings/ci_cd`

Click "Expand" next to "Variables" and add these variables:

| Variable Name | Value | Protected | Masked |
|---------------|-------|-----------|---------|
| `DEPLOY_SERVER` | `137.43.49.26` | ✓ | ✗ |
| `DEPLOY_USER` | `student` | ✓ | ✗ |
| `SSH_PRIVATE_KEY` | (paste private key content) | ✓ | ✓ |
| `OPENWEATHER_API_KEY` | (your API key) | ✓ | ✓ |
| `GOOGLE_MAPS_API_KEY` | (your API key) | ✓ | ✓ |
| `NEXT_PUBLIC_MAPBOX_API_KEY` | (your API key) | ✗ | ✓ |

### Step 4: Test Deployment
```bash
# Push to develop branch to trigger staging deployment
git checkout develop
git push origin develop

# Check pipeline status at:
# https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/pipelines
```

## Option 2: Use Standard CI/CD with GitLab Runner

If you prefer the standard approach with Docker registry:

### Step 1: Get GitLab Runner Token
1. Go to: `https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/settings/ci_cd`
2. Expand "Runners" section
3. Copy the registration token (starts with `glrt-`)

### Step 2: Install GitLab Runner on Server
```bash
# SSH to server
ssh student@137.43.49.26

# Install GitLab Runner
curl -L --output /usr/local/bin/gitlab-runner https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-linux-amd64
sudo chmod +x /usr/local/bin/gitlab-runner
sudo useradd --comment 'GitLab Runner' --create-home --shell /bin/bash gitlab-runner
sudo gitlab-runner install --user=gitlab-runner --working-directory=/home/gitlab-runner
sudo gitlab-runner start
```

### Step 3: Register Runner
```bash
sudo gitlab-runner register

# Provide these answers:
# GitLab instance URL: https://csgitlab.ucd.ie/
# Registration token: [Your token from Step 1]
# Description: manhattan-my-way-runner
# Tags: docker,deploy
# Executor: docker
# Default Docker image: docker:24.0.5
```

### Step 4: Configure Docker-in-Docker
```bash
sudo nano /etc/gitlab-runner/config.toml

# Add this configuration:
[[runners]]
  name = "manhattan-my-way-runner"
  url = "https://csgitlab.ucd.ie/"
  token = "YOUR_TOKEN"
  executor = "docker"
  [runners.docker]
    tls_verify = false
    image = "docker:24.0.5"
    privileged = true
    volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]

# Restart runner
sudo gitlab-runner restart
```

### Step 5: Enable Container Registry
1. Go to: `https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/settings/general`
2. Expand "Visibility, project features, permissions"
3. Enable "Container registry"

### Step 6: Configure Registry Variables
Add these additional variables:

| Variable Name | Value | Protected | Masked |
|---------------|-------|-----------|---------|
| `CI_REGISTRY_USER` | (your GitLab username) | ✓ | ✗ |
| `CI_REGISTRY_PASSWORD` | (your GitLab token/password) | ✓ | ✓ |

## Manual Deployment (If CI/CD doesn't work)

### Option 3: Direct Server Deployment
```bash
# SSH to server
ssh student@137.43.49.26

# Run setup script
curl -L https://raw.githubusercontent.com/your-repo/main/scripts/setup-server.sh | bash

# Or manually:
git clone https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9.git
cd comp47360_team9
docker-compose up --build -d
```

## Testing Your Setup

### Local Testing
```bash
# Test Docker builds
docker build -t test-ml ./ml
docker build -t test-webapp ./webapp

# Test full stack
docker-compose up --build
```

### Server Access
- Staging: http://137.43.49.26:3030
- Production: http://137.43.49.26:8080
- ML API: http://137.43.49.26:5000

## Troubleshooting

### Common Issues
1. **SSH Connection Failed**: Check if SSH key is correctly copied to server
2. **Docker Build Failed**: Check Dockerfile syntax and dependencies
3. **Port Not Accessible**: Check server firewall settings
4. **Permission Denied**: Ensure user has Docker privileges

### Debug Commands
```bash
# Check GitLab CI/CD logs
# Go to: https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/pipelines

# Check server status
ssh student@137.43.49.26 "docker ps && docker-compose ps"

# Check server logs
ssh student@137.43.49.26 "docker-compose logs"
```

## Next Steps

1. **Choose Option 1** (Simplified CI/CD) for quickest setup
2. Configure the required GitLab variables
3. Test with a small commit to `develop` branch
4. Monitor pipeline execution
5. Verify application is accessible

For immediate testing, I recommend starting with Option 1 as it's the most reliable and doesn't require complex GitLab Runner configuration.
