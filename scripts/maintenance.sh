#!/bin/bash

# Maintenance Lead automation script
# This script automates common maintenance tasks

echo "🔧 Manhattan My Way - Maintenance Automation Script"
echo "=================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run with error handling
run_with_error_handling() {
    local cmd="$1"
    local description="$2"
    
    echo "🚀 $description..."
    if eval "$cmd"; then
        echo "✅ $description completed successfully"
    else
        echo "❌ $description failed"
        exit 1
    fi
}

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command_exists docker; then
    echo "❌ Docker is not installed"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Parse command line arguments
case "$1" in
    "update-deps")
        echo "📦 Updating dependencies..."
        cd webapp
        run_with_error_handling "npm update" "Frontend dependencies update"
        cd ../ml
        run_with_error_handling "pip install -r requirements.txt --upgrade" "Python dependencies update"
        ;;
    
    "security-scan")
        echo "🔒 Running security scans..."
        cd webapp
        
        # Check if npm is available locally, otherwise use Docker
        if command_exists npm; then
            run_with_error_handling "npm audit" "NPM security audit"
        else
            echo "🐳 NPM not found locally, using Docker for security scan..."
            run_with_error_handling "docker run --rm -v $(pwd):/app -w /app node:18 npm audit" "Docker-based NPM security audit"
        fi
        
        cd ../ml
        if command_exists safety; then
            run_with_error_handling "safety check" "Python security scan"
        else
            echo "⚠️ Safety not installed, checking with Docker..."
            if command_exists docker; then
                run_with_error_handling "docker run --rm -v $(pwd):/app -w /app python:3.11-slim sh -c 'pip install safety && safety check'" "Docker-based Python security scan"
            else
                echo "⚠️ Docker not available, skipping Python security scan"
            fi
        fi
        
        # Run pre-commit hooks for additional security checks (skip if not available)
        if [ -f "../.pre-commit-config.yaml" ]; then
            echo "🔒 Running pre-commit security checks..."
            run_precommit "run --all-files" "Pre-commit security and quality checks"
        else
            echo "⚠️ Pre-commit config not found, skipping pre-commit checks"
        fi
        ;;
    
    "cleanup")
        echo "🧹 Cleaning up system..."
        run_with_error_handling "docker system prune -f" "Docker cleanup"
        run_with_error_handling "docker volume prune -f" "Docker volume cleanup"
        cd webapp
        run_with_error_handling "rm -rf node_modules/.cache" "Node cache cleanup"
        run_with_error_handling "rm -rf .next" "Next.js cache cleanup"
        ;;
    
    "health-check")
        echo "🏥 Running health checks..."
        run_with_error_handling "docker-compose ps" "Container status check"
        
        # Check if services are responding
        if curl -f http://localhost:3030/api/health >/dev/null 2>&1; then
            echo "✅ Web application is healthy"
        else
            echo "❌ Web application health check failed"
        fi
        
        if curl -f http://localhost:5000/health >/dev/null 2>&1; then
            echo "✅ ML API is healthy"
        else
            echo "❌ ML API health check failed"
        fi
        ;;
    
    "backup")
        echo "💾 Creating backup..."
        BACKUP_DIR="/tmp/team9-backup-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup source code (excluding node_modules and other large directories)
        run_with_error_handling "rsync -av --exclude=node_modules --exclude=.git --exclude=.next --exclude=__pycache__ . $BACKUP_DIR/source/" "Source code backup"
        
        # Backup Docker volumes if any
        run_with_error_handling "docker-compose config --volumes" "Docker volumes backup"
        
        echo "✅ Backup created at $BACKUP_DIR"
        ;;
    
    "logs")
        echo "📝 Displaying recent logs..."
        run_with_error_handling "docker-compose logs --tail=50" "Container logs"
        ;;
    
    "restart")
        echo "🔄 Restarting services..."
        run_with_error_handling "docker-compose down" "Stopping services"
        run_with_error_handling "docker-compose up -d" "Starting services"
        sleep 10
        run_with_error_handling "docker-compose ps" "Service status check"
        ;;
    
    "full-maintenance")
        echo "🔧 Running full maintenance routine..."
        $0 cleanup
        $0 update-deps
        $0 security-scan
        $0 health-check
        echo "✅ Full maintenance completed"
        ;;
    
    "setup-precommit")
        echo "🔧 Setting up pre-commit hooks..."
        if is_windows; then
            echo "📋 Windows detected. Running setup script..."
            echo "Please manually add Python Scripts to PATH:"
            echo "C:\\Users\\%USERNAME%\\AppData\\Roaming\\Python\\Python313\\Scripts"
            echo "Or run: scripts/setup-git-hooks.sh"
        else
            run_precommit "install" "Install pre-commit hooks"
        fi
        ;;
    
    *)
        echo "Usage: $0 {update-deps|security-scan|cleanup|health-check|backup|logs|restart|setup-precommit|full-maintenance}"
        echo ""
        echo "Available commands:"
        echo "  update-deps      - Update all dependencies"
        echo "  security-scan    - Run security vulnerability scans"
        echo "  cleanup          - Clean up Docker system and caches"
        echo "  health-check     - Check if all services are healthy"
        echo "  backup           - Create a backup of the project"
        echo "  logs             - Display recent container logs"
        echo "  restart          - Restart all services"
        echo "  setup-precommit  - Set up pre-commit hooks"
        echo "  full-maintenance - Run complete maintenance routine"
        exit 1
        ;;
esac

# Windows-specific functions
is_windows() {
    [[ "$OS" == "Windows_NT" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]
}

# Function to run pre-commit with proper path handling
run_precommit() {
    local cmd="$1"
    local description="$2"
    
    if is_windows; then
        # Try different pre-commit locations on Windows
        local precommit_paths=(
            "pre-commit"
            "$HOME/AppData/Roaming/Python/Python313/Scripts/pre-commit.exe"
            "$HOME/AppData/Roaming/Python/Python312/Scripts/pre-commit.exe"
            "$HOME/AppData/Roaming/Python/Python311/Scripts/pre-commit.exe"
        )
        
        for path in "${precommit_paths[@]}"; do
            if command -v "$path" >/dev/null 2>&1; then
                echo "🔧 Using pre-commit at: $path"
                run_with_error_handling "$path $cmd" "$description"
                return 0
            fi
        done
        
        echo "❌ pre-commit not found. Please run scripts/setup-git-hooks.sh first"
        return 1
    else
        run_with_error_handling "pre-commit $cmd" "$description"
    fi
}

echo "🎉 Maintenance task completed successfully!"
