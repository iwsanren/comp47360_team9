# CI/CD Deployment Guide

## Overview
This document describes how to set up GitLab CI/CD for automatic deployment to the university Linux server.

## Architecture
```
GitLab Repository → GitLab CI/CD → Linux Server (137.43.49.26)
     ↓                  ↓                ↓
  Code Push         Build & Test      Deploy Containers
```

## Deployment Environments

### Staging Environment
- **Trigger**: Push to `develop` branch
- **URL**: http://137.43.49.26:3030
- **Ports**: 
  - Web App: 3030
  - ML API: 5000

### Production Environment
- **Trigger**: Push to `main` branch (manual approval)
- **URL**: http://137.43.49.26:8080
- **Ports**:
  - Web App: 8080
  - ML API: 5001

## Setup Instructions

### 1. Server Setup
Run this on the Linux server (137.43.49.26):

**First, create a working directory:**
```bash
# Connect to the server
ssh student@137.43.49.26
# Enter password: Team-9-lucky!

# Find current working directory and permissions
pwd
whoami
ls -la

# The script will automatically find the best available directory:
# 1. /opt/team9-deploy (preferred, if accessible)
# 2. Current working directory + team9-deploy (fallback)
# 3. /tmp/team9-deploy (temporary, last resort)
```

**Option 1: Copy script from local machine (Recommended)**
```bash
# From your local machine (Windows), use Git Bash or PowerShell
# Navigate to your project directory first
cd "D:\School\Program\comp47360_team9"

# Copy the setup script to a temporary location first
scp scripts/setup-server.sh student@137.43.49.26:/tmp/

# Then connect to the server and run it
ssh student@137.43.49.26
cd /tmp
chmod +x setup-server.sh
./setup-server.sh
```

**Option 2: Download directly on server**
```bash
# Connect to the server first
ssh student@137.43.49.26
cd /tmp  # Use /tmp as working directory

# Download the script from GitLab
wget https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/raw/main/scripts/setup-server.sh

# Or use curl if wget is not available
curl -O https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/raw/main/scripts/setup-server.sh

# Make it executable and run
chmod +x setup-server.sh
./setup-server.sh
```

**Alternative directories if /opt is also restricted:**
```bash
# Try these alternatives in order:
mkdir -p ~/team9-deploy && cd ~/team9-deploy  # User home directory
# or
mkdir -p /tmp/team9-deploy && cd /tmp/team9-deploy  # Temporary directory
# or
mkdir -p /var/tmp/team9-deploy && cd /var/tmp/team9-deploy  # Persistent temp
```

### 2. SSH Key Setup
Generate SSH key pair for GitLab CI/CD:

```bash
# On the server
ssh-keygen -t rsa -b 4096 -C "gitlab-ci@team9"
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/id_rsa  # Copy this private key
```

### 3. GitLab CI/CD Variables
In GitLab project → Settings → CI/CD → Variables, add:

| Variable | Value | Protected | Masked |
|----------|-------|-----------|--------|
| `SSH_PRIVATE_KEY` | SSH private key content | ✅ | ✅ |
| `DEPLOY_SERVER` | `137.43.49.26` | ✅ | ❌ |
| `DEPLOY_USER` | `student` | ✅ | ❌ |
| `OPENWEATHER_API_KEY` | Your API key | ✅ | ✅ |
| `GOOGLE_MAPS_API_KEY` | Your API key | ✅ | ✅ |
| `NEXT_PUBLIC_MAPBOX_API_KEY` | Your API key | ✅ | ❌ |

### 4. GitLab Container Registry
Enable Container Registry in GitLab project settings.

## Workflow

### Development Flow
1. Create feature branch from `develop`
2. Make changes and push
3. Create merge request to `develop`
4. After merge → automatic staging deployment

### Release Flow
1. Create merge request from `develop` to `main`
2. After merge → manual production deployment

## Pipeline Stages

### 1. Build Stage
- Builds Docker images for ML API and Web App
- Pushes images to GitLab Container Registry
- Tags with commit SHA

### 2. Test Stage
- Runs linting and tests
- Validates code quality

### 3. Deploy Stage
- **Staging**: Automatic deployment on `develop` branch
- **Production**: Manual deployment on `main` branch

## Monitoring & Logs

### Check deployment status:
```bash
# On the server
docker ps
docker-compose logs -f
```

### Access applications:
- **Staging**: http://137.43.49.26:3030
- **Production**: http://137.43.49.26:8080

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify SSH key is correctly added to GitLab variables
   - Check server SSH access

2. **Docker Build Failed**
   - Check Dockerfile syntax
   - Verify all required files are present

3. **Deployment Failed**
   - Check server disk space
   - Verify environment variables

### Useful Commands

```bash
# View pipeline logs in GitLab
# Project → CI/CD → Pipelines → [Pipeline] → [Job]

# Server troubleshooting
ssh student@137.43.49.26
docker ps -a
docker logs [container_name]
docker-compose down && docker-compose up -d

# Clean up old images
docker system prune -a
```

## Security Notes

- All sensitive data is stored in GitLab CI/CD variables
- Server access is restricted to SSH keys
- Production deployments require manual approval
- Container images are stored in private GitLab registry

## Rollback Process

If deployment fails:

```bash
# On the server - find your deployment directory first
ssh student@137.43.49.26

# Function to find deployment directory (same as in CI/CD)
find_deploy_dir() {
  if [ -d '/opt/team9-deploy' ] && [ -w '/opt/team9-deploy' ]; then
    echo '/opt/team9-deploy'
  elif [ -d "$HOME/team9-deploy" ] && [ -w "$HOME/team9-deploy" ]; then
    echo "$HOME/team9-deploy"
  elif [ -d '/tmp/team9-deploy' ] && [ -w '/tmp/team9-deploy' ]; then
    echo '/tmp/team9-deploy'
  else
    echo "$(pwd)/team9-deploy"
  fi
}

DEPLOY_BASE=$(find_deploy_dir)
echo "Using deployment directory: $DEPLOY_BASE"

# Rollback staging or production
cd $DEPLOY_BASE/production  # or staging
docker-compose down
export ML_API_IMAGE=previous_working_image
export WEBAPP_IMAGE=previous_working_image
docker-compose up -d
```
