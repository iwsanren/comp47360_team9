# Docker Usage Guide

This document provides detailed instructions for using Docker in the project, including deployment guides for development, testing, and production environments.

## Table of Contents

- [Project Architecture](#project-architecture)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Project Architecture

This project uses a microservices architecture with the following services:

```
📦 Team9 Project
├── 🌐 webapp (Next.js Frontend)    - Port: 3030 (dev) / 8080 (prod)
├── 🤖 ml (Flask ML API)           - Port: 5000
└── 🔄 nginx (Reverse Proxy)       - Port: 80
```

## Requirements

### Required Software
- Docker Engine 20.10.0+
- Docker Compose 2.0.0+
- Git

### System Requirements
- Memory: Minimum 4GB, Recommended 8GB+
- Disk Space: Minimum 10GB available space
- Operating System: Windows 10+, macOS 10.14+, Linux

## Quick Start

### 1. Clone the Project
```bash
git clone <repository-url>
cd comp47360_team9
```

### 2. Environment Variables Configuration
Create a `.env` file:
```bash
# API Keys
OPENWEATHER_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_api_key

# Environment Configuration
NODE_ENV=development
FLASK_ENV=development

# Port Configuration (optional)
WEBAPP_PORT=3030
ML_API_PORT=5000
```

### 3. Start All Services
```bash
# Development environment
docker-compose up -d

# Production environment
docker-compose -f docker-compose.prod.yml up -d
```

## Development Environment

### Configuration Files
- **Main Configuration**: `docker-compose.yml`
- **Environment Variables**: `.env`

### Starting Development Environment
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Service Access URLs
- **Frontend Application**: http://localhost:3030
- **ML API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/docs

### Development Mode Features
- Hot Reload: Automatic restart after code changes
- Debug Mode: Detailed error information
- Development Tools: Includes debugging and testing tools

## Production Environment

### Configuration Files
- **Main Configuration**: `docker-compose.prod.yml`
- **Nginx Configuration**: `nginx/nginx.conf`
- **Environment Variables**: `.env`

### Deploy to Production Environment
```bash
# Stop development environment services
docker-compose down

# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

### Production Environment Optimizations
- **Performance Optimization**: Enable code compression and caching
- **Security Configuration**: Remove development tools and debug information
- **Resource Limits**: Set memory and CPU limits
- **Health Checks**: Automatic service status monitoring

## Common Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart [service_name]

# Check service status
docker-compose ps

# View logs
docker-compose logs [service_name]
docker-compose logs -f --tail=100 [service_name]  # Real-time logs
```

### Build and Cleanup
```bash
# Rebuild services
docker-compose build [service_name]
docker-compose build --no-cache  # No cache build

# Clean Docker cache
docker system prune -af

# Clean unused images
docker image prune -af

# Clean unused containers
docker container prune -f
```

### Data Management
```bash
# View data volumes
docker volume ls

# Backup data volume
docker run --rm -v team9_ml_data:/data -v $(pwd):/backup ubuntu tar czf /backup/ml_data_backup.tar.gz -C /data .

# Restore data volume
docker run --rm -v team9_ml_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/ml_data_backup.tar.gz -C /data
```

### Debug Commands
```bash
# Enter container terminal
docker-compose exec webapp bash
docker-compose exec ml bash

# View container resource usage
docker stats

# Check container configuration
docker-compose config

# Validate Dockerfile
docker-compose build --no-cache webapp
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
**Issue**: `Error: Port 3030 is already in use`
```bash
# Find processes using the port
netstat -tulpn | grep :3030  # Linux
lsof -i :3030               # macOS
netstat -ano | findstr :3030 # Windows

# Kill process or modify port configuration
```

#### 2. Insufficient Memory
**Issue**: Container startup failure or slow performance
```bash
# Check memory usage
docker stats

# Increase Docker memory limit (Docker Desktop)
# Settings -> Resources -> Memory -> Increase to 6GB+
```

#### 3. Build Failures
**Issue**: Image build failures
```bash
# Clean cache and rebuild
docker system prune -af
docker-compose build --no-cache

# View detailed build logs
docker-compose build --progress=plain
```

#### 4. Service Communication Issues
**Issue**: Network connection failures between services
```bash
# Check network configuration
docker network ls
docker network inspect comp47360_team9_default

# Recreate network
docker-compose down
docker-compose up -d
```

#### 5. Environment Variable Issues
**Issue**: API key or configuration loading failures
```bash
# Check .env file
cat .env

# Validate environment variables
docker-compose config

# Manually set environment variables
docker-compose exec webapp printenv
```

### Log Analysis
```bash
# View specific service error logs
docker-compose logs webapp | grep -i error
docker-compose logs ml | grep -i "traceback\|error"

# View system logs
docker-compose logs --since=30m
docker-compose logs --until=2h
```

### Performance Monitoring
```bash
# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# View container processes
docker-compose top
```

## Best Practices

### Development Environment
1. **Regular Cleanup**: Run `docker system prune -af` weekly
2. **Environment Isolation**: Use different networks and volumes for different projects
3. **Version Control**: Don't commit `.env` files to Git
4. **Resource Monitoring**: Regularly check `docker stats` to ensure sufficient resources

### Production Environment
1. **Security**: 
   - Run containers with non-root users
   - Regularly update base images
   - Set resource limits

2. **Monitoring**:
   - Configure health checks
   - Set up log rotation
   - Monitor container status

3. **Backup**:
   - Regularly backup data volumes
   - Backup configuration files
   - Test recovery procedures

### Docker Image Optimization
1. **Multi-stage Builds**: Reduce image size
2. **Layer Caching**: Properly arrange Dockerfile instruction order
3. **Security Scanning**: Use `docker scan` to check for vulnerabilities

### CI/CD Integration
This project uses GitLab CI/CD for automatic deployment:
- **Development Branch**: Automatically deploy to staging environment
- **Main Branch**: Manual trigger for production deployment
- **Quality Checks**: Run code quality checks for every MR

## Related Documentation

- [Quick Setup Guide](./quick-setup-guide.md)
- [Automation Guide](./AUTOMATION-GUIDE.md)
- [Nginx Setup](../NGINX-SETUP.md)
- [Complete Deployment Guide](../DEPLOYMENT-COMPLETE-GUIDE.md)

## Support

If you encounter issues:
1. Check the troubleshooting section in this document
2. Check the project Issue pages
3. Contact the development team

---

**Last Updated**: July 13, 2025
**Maintainer**: Team 9 Development Team
