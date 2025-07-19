# 🐳 Docker Installation and Setup Guide

This guide covers Docker installation, project setup, and container management for the Manhattan My Way project.

## 📋 Prerequisites

- Windows 10/11 (64-bit) or macOS or Linux
- At least 8GB RAM (16GB recommended)
- At least 20GB free disk space

## 🔧 Docker Installation

### Windows Installation

#### Option 1: Docker Desktop (Recommended)
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Run the installer and follow the setup wizard
3. Enable WSL 2 integration when prompted
4. Restart your computer
5. Launch Docker Desktop and complete the tutorial

#### Option 2: Docker with WSL 2 (Advanced)
```bash
# Enable WSL 2 feature
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Install Ubuntu from Microsoft Store
# Then install Docker in WSL 2
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### macOS Installation
```bash
# Option 1: Docker Desktop
# Download from docker.com and install

# Option 2: Using Homebrew
brew install --cask docker
```

### Linux Installation (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

## ✅ Verify Installation

```bash
# Check Docker version
docker --version
docker-compose --version

# Test Docker installation
docker run hello-world
```

## 🚀 Project Setup

### 1. Clone and Setup Project
```bash
# Clone the repository
git clone <your-gitlab-repo-url>
cd comp47360_team9

# One-time setup (includes git hooks and dependencies)
npm run setup
```

### 2. Environment Configuration
Create a `.env` file in the project root:
```bash
# Copy example environment file
cp .env.example .env

# Edit with your API keys
OPENWEATHER_API_KEY=your_openweather_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_key
NODE_ENV=development
FLASK_ENV=development
```

### 3. Build and Start Services
```bash
# Clean any existing containers
docker-compose down --remove-orphans

# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

## 🔍 Container Management

### Basic Commands
```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Check container logs
docker-compose logs webapp    # Frontend logs
docker-compose logs ml        # ML API logs
docker-compose logs -f        # Follow all logs

# Stop services
docker-compose down

# Restart specific service
docker-compose restart webapp
docker-compose restart ml
```

### Development Workflow
```bash
# Start development environment
docker-compose up -d

# View logs in real-time
docker-compose logs -f

# Rebuild after code changes
docker-compose up --build webapp  # Rebuild only webapp
docker-compose up --build         # Rebuild all services

# Clean restart
docker-compose down
docker-compose up --build
```

## 🧹 Maintenance and Cleanup

### Regular Cleanup
```bash
# Clean Docker cache (recommended weekly)
npm run cleanup

# Or manually:
docker system prune -f
docker volume prune -f
docker image prune -a -f
```

### Troubleshooting Commands
```bash
# Check disk usage
docker system df

# Inspect container details
docker inspect <container_name>

# Access container shell
docker-compose exec webapp bash     # Access webapp container
docker-compose exec ml bash         # Access ML container

# Check container health
docker-compose ps
```

## 🌐 Service URLs

### Development Environment
- **Frontend**: http://localhost:3000
- **ML API**: http://localhost:5001
- **ML API Endpoints**:
  - Health check: http://localhost:5001/
  - Predictions: http://localhost:5001/predict-all

### Production Environment
- **Frontend**: http://137.43.49.26
- **ML API**: http://137.43.49.26/api/ml/

## 🐛 Common Issues and Solutions

### Issue 1: Port Already in Use
```bash
# Find and kill process using port
netstat -ano | findstr :3000  # Windows
lsof -ti:3000 | xargs kill    # macOS/Linux

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Issue 2: Container Build Failures
```bash
# Clear Docker cache and rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up
```

### Issue 3: Permission Issues (Linux/macOS)
```bash
# Fix Docker permissions
sudo chown -R $USER:$USER .
sudo chmod -R 755 .

# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

### Issue 4: Out of Disk Space
```bash
# Clean everything
docker system prune -a --volumes -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f
```

### Issue 5: Environment Variables Not Loading
```bash
# Check .env file exists
ls -la .env

# Verify docker-compose uses env_file
# In docker-compose.yml:
services:
  webapp:
    env_file: .env

# Rebuild containers
docker-compose down
docker-compose up --build
```

## 📊 Performance Monitoring

### Resource Usage
```bash
# Monitor container resource usage
docker stats

# Check specific container
docker stats webapp_container ml_container
```

### Health Checks
```bash
# Test ML API health
curl http://localhost:5001/

# Test frontend
curl http://localhost:3000/

# Use project's test script
bash scripts/test-ml-api.sh
```

## 🔄 Production Deployment

For production deployment, see:
- `docs/DEPLOYMENT-COMPLETE-GUIDE.md` - Complete deployment guide
- `docs/quick-setup-guide.md` - GitLab CI/CD setup

### Quick Production Commands
```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d --build

# Check production logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project Automation Guide](AUTOMATION-GUIDE.md)
- [Git Workflow](git_workflow.md)

## 🆘 Getting Help

If you encounter issues:
1. Check this troubleshooting guide
2. Run `npm run health-check`
3. Check project logs: `docker-compose logs`
4. Ask the team in the project chat
5. Create an issue in GitLab with error details

---

**Last updated**: January 2025
**Maintainer**: Team 9 - Maintenance Lead
