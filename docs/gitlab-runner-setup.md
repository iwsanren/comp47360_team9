# GitLab Runner Setup Guide

This guide explains how to configure GitLab Runners for the Manhattan My Way project.

## What is GitLab Runner?

GitLab Runner is an application that works with GitLab CI/CD to run jobs in a pipeline. It can run on various platforms and execute jobs in different environments (Docker, Shell, SSH, etc.).

## Option 1: Use GitLab.com Shared Runners (Recommended for beginners)

### Advantages
- No setup required
- GitLab manages the infrastructure
- Free tier includes 400 minutes per month

### Setup Steps
1. Go to your GitLab project: `https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9`
2. Navigate to **Settings** → **CI/CD** → **Runners**
3. Check if "Shared runners" are enabled
4. If not enabled, contact your GitLab administrator

### Usage
- Use the current `.gitlab-ci.yml` file
- No token needed for shared runners

## Option 2: Self-hosted GitLab Runner on Server

### Prerequisites
- Access to server (137.43.49.26)
- Docker installed on server
- GitLab Runner token

### Step 1: Get Registration Token

1. Go to your GitLab project
2. Navigate to **Settings** → **CI/CD** → **Runners**
3. Expand the "Specific runners" section
4. Copy the registration token (starts with `glrt-`)

### Step 2: Install GitLab Runner on Server

```bash
# SSH to your server
ssh student@137.43.49.26

# Download GitLab Runner
sudo curl -L --output /usr/local/bin/gitlab-runner https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-linux-amd64

# Give execute permissions
sudo chmod +x /usr/local/bin/gitlab-runner

# Create gitlab-runner user
sudo useradd --comment 'GitLab Runner' --create-home --shell /bin/bash gitlab-runner

# Install as service
sudo gitlab-runner install --user=gitlab-runner --working-directory=/home/gitlab-runner
sudo gitlab-runner start
```

### Step 3: Register Runner

```bash
# Register the runner
sudo gitlab-runner register

# When prompted, provide:
# GitLab instance URL: https://csgitlab.ucd.ie/
# Registration token: [Your token from Step 1]
# Description: manhattan-my-way-runner
# Tags: docker,deploy
# Executor: docker
# Default Docker image: docker:24.0.5
```

### Step 4: Configure Runner for Docker-in-Docker

Edit the runner configuration:

```bash
sudo nano /etc/gitlab-runner/config.toml
```

Update the configuration:

```toml
[[runners]]
  name = "manhattan-my-way-runner"
  url = "https://csgitlab.ucd.ie/"
  token = "YOUR_TOKEN_HERE"
  executor = "docker"
  [runners.docker]
    tls_verify = false
    image = "docker:24.0.5"
    privileged = true
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]
    shm_size = 0
```

### Step 5: Restart Runner

```bash
sudo gitlab-runner restart
```

### Step 6: Verify Runner

1. Go back to your GitLab project
2. Navigate to **Settings** → **CI/CD** → **Runners**
3. Your runner should appear in the "Specific runners" section with a green dot

## Option 3: Use Simplified CI/CD (No Runner Required)

If you encounter issues with GitLab Runner, use our simplified approach:

### Step 1: Rename CI Configuration

```bash
# In your project root
mv .gitlab-ci.yml .gitlab-ci-standard.yml
mv .gitlab-ci-simple.yml .gitlab-ci.yml
```

### Step 2: Configure GitLab CI/CD Variables

Go to **Settings** → **CI/CD** → **Variables** and add:

| Variable | Value | Protected | Masked |
|----------|-------|-----------|---------|
| `DEPLOY_SERVER` | `137.43.49.26` | ✓ | ✗ |
| `DEPLOY_USER` | `student` | ✓ | ✗ |
| `SSH_PRIVATE_KEY` | Your private key | ✓ | ✓ |
| `OPENWEATHER_API_KEY` | Your API key | ✓ | ✓ |
| `GOOGLE_MAPS_API_KEY` | Your API key | ✓ | ✓ |
| `NEXT_PUBLIC_MAPBOX_API_KEY` | Your API key | ✗ | ✓ |

### Step 3: Generate SSH Key Pair

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "gitlab-ci@team9"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub student@137.43.49.26

# Copy private key content to GitLab variable
cat ~/.ssh/id_rsa
```

## Troubleshooting

### Common Issues

1. **Runner Registration Fails**
   - Check network connectivity
   - Verify GitLab URL and token
   - Ensure GitLab instance is accessible

2. **Docker-in-Docker Issues**
   - Ensure privileged mode is enabled
   - Check Docker socket mounting
   - Verify Docker service is running

3. **Permission Denied on Server**
   - Check user permissions
   - Verify SSH key setup
   - Ensure Docker group membership

### Useful Commands

```bash
# Check runner status
sudo gitlab-runner status

# View runner logs
sudo gitlab-runner --debug run

# List registered runners
sudo gitlab-runner list

# Unregister runner
sudo gitlab-runner unregister --name "runner-name"

# Test SSH connection
ssh -T student@137.43.49.26

# Check Docker permissions
docker ps
```

## Recommended Approach

For this project, I recommend:

1. **Start with Option 3** (Simplified CI/CD) - Easiest to set up and debug
2. **Upgrade to Option 1** (Shared Runners) - If you need more advanced features
3. **Use Option 2** (Self-hosted) - Only if you need full control or have specific requirements

## Next Steps

1. Choose your preferred option
2. Configure the necessary credentials and variables
3. Test with a simple commit to the `develop` branch
4. Monitor the pipeline execution in GitLab
5. Verify deployment on the server

For immediate deployment, use the simplified approach with the setup script:

```bash
# Run the setup script on server
curl -o setup-server.sh https://raw.githubusercontent.com/your-repo/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```
