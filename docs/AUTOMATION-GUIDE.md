# 🚀 Manhattan My Way - Project Automation Guide

## 📋 Implemented Solution: Simplified Architecture + GitLab CI Integration

### 🔧 1. Automatic Code Quality Control

#### Pre-commit hooks (runs on every git commit):
```bash
# One-time setup (run only once)
bash scripts/setup-git-hooks.sh

# After setup, every commit automatically runs:
# - Code formatting (Prettier for JS/TS)
# - Code linting (ESLint, flake8)
# - Security checks
# - File format validation
# - Large file detection
```

#### Docker startup with automatic cleanup:
```bash
# Enhanced startup script
bash scripts/start-project.sh

# Or use npm commands
npm run setup
```

### 🔧 2. GitLab CI Automation

#### Automatic execution on deployment:
- Docker cache cleanup (solves memory issues) before builds
- Service health checks after deployment
- Automated container management

#### Local code quality (via pre-commit hooks):
- Code quality checks run locally before commits
- Security vulnerability scanning available via npm commands
- Consistent code formatting and linting

### 🔧 3. Daily Maintenance Automation

#### Convenient maintenance commands:
```bash
# Clean Docker cache (solves memory issues)
npm run cleanup

# Health check all services
npm run health-check

# Security vulnerability scan
npm run security-scan

# Complete maintenance routine
npm run maintenance full-maintenance
```

### 🔧 4. Scheduled Tasks (Optional for Production)

#### Production environment scheduled maintenance:
```bash
# Add to crontab for automatic execution
# Daily cleanup at 2 AM
0 2 * * * cd /path/to/project && npm run cleanup

# Weekly full maintenance on Sunday at 3 AM
0 3 * * 0 cd /path/to/project && npm run maintenance full-maintenance
```

## ✅ Key Benefits

1. **Solves Memory Issues** - Automatic Docker cache cleanup before builds
2. **Zero Configuration** - Run setup script and you're done
3. **Improved Developer Experience** - Automatic formatting and linting
4. **CI/CD Integration** - Automated code quality assurance
5. **Easy Maintenance** - Simple scripts, easy to modify and extend

## 🚀 Quick Start

```bash
# 1. Initial setup (one-time)
npm run setup

# 2. Daily development
# Just commit code, pre-commit hooks run automatically
git add .
git commit -m "feat: add new feature"

# 3. When you need to clean up
npm run cleanup

# 4. Start the project
docker-compose up -d
```

## 📈 File Structure and Purpose

### Configuration Files:
- **`.pre-commit-config.yaml`** - Defines code quality checks and formatting rules
- **`webapp/.prettierrc`** - Code formatting standards for frontend
- **`scripts/maintenance.sh`** - Automated maintenance tasks

### Automation Scripts:
- **`scripts/setup-git-hooks.sh`** - Sets up pre-commit hooks
- **`scripts/start-project.sh`** - Enhanced project startup with cleanup
- **`scripts/scheduled-maintenance.sh`** - For production scheduled tasks

### When Each Tool Runs:
- **Pre-commit hooks**: Every `git commit`
- **Docker cleanup**: Before every build in GitLab CI
- **Maintenance tasks**: On-demand via npm scripts
- **Security scans**: Weekly in CI, or on-demand

## 🔧 Available Commands

```bash
# Project management
npm run setup              # Initial project setup
npm run setup-production   # Production environment setup

# Maintenance
npm run cleanup            # Clean Docker cache and temp files
npm run health-check       # Check if all services are healthy
npm run security-scan      # Run security vulnerability scan
npm run maintenance        # Show all maintenance options

# Diagnostics and Testing
npm run diagnose           # Run complete project diagnostics
npm run test-api           # Test ML API endpoints

# Code quality
npm run pre-commit         # Run pre-commit hooks manually
```

## 📁 Organized Scripts Structure

```
scripts/
├── maintenance.sh              # Main automation script
├── setup-git-hooks.sh          # Git hooks setup
├── start-project.sh            # Enhanced project startup
├── scheduled-maintenance.sh    # Production scheduling
├── diagnose-project.sh         # Combined diagnostics
├── test-ml-api.sh             # ML API testing
├── setup/                     # One-time setup scripts
│   ├── setup-server.sh
│   ├── setup-nginx.sh
│   ├── configure-firewall.sh
│   ├── setup-ssh-keys.sh
│   └── install-gitlab-runner-linux.sh
├── windows/                   # Windows-specific scripts
│   ├── diagnose-gitlab-runner.bat
│   ├── install-gitlab-runner.bat
│   ├── setup-ssh-keys.bat
│   ├── switch-to-simple-cicd.bat
│   └── test-docker-setup.bat
└── archive/                   # Archived/obsolete scripts
    └── (old scripts moved here)
```

## 📊 Problem Solving

### Original Issues → Solutions:
1. **VM Memory Shortage** → Automatic Docker cache cleanup
2. **Inconsistent Code Style** → Automatic formatting with Prettier
3. **Manual Maintenance** → Automated scripts and CI integration
4. **Security Vulnerabilities** → Automatic scanning and alerts

## 🎯 Next Steps

1. Run `npm run setup` to activate all automation
2. Commit your code normally - hooks will run automatically
3. Use `npm run cleanup` when VM memory gets low
4. Monitor GitLab CI for automatic quality checks

The system is designed to be simple, effective, and solve real problems while improving the development workflow.
