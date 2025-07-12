#!/bin/bash

# Server setup script for Manhattan My Way deployment
# Run this script on the Linux server (137.43.49.26)

set -e

echo "🚀 Setting up Manhattan My Way deployment environment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed successfully!"
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully!"
else
    echo "Docker Compose already installed"
fi

# Create deployment directories
echo "📁 Creating deployment directories..."

# Function to test directory creation
test_directory() {
    local dir="$1"
    if mkdir -p "$dir/test" 2>/dev/null && rm -rf "$dir/test" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Try different base directories in order of preference
DEPLOY_BASE=""

# Option 1: /opt/team9-deploy (system-wide, requires sudo)
if [ -w "/opt" ] || sudo mkdir -p /opt/team9-deploy 2>/dev/null && sudo chown $(whoami):$(whoami) /opt/team9-deploy 2>/dev/null; then
    DEPLOY_BASE="/opt/team9-deploy"
    echo "✅ Using system directory: $DEPLOY_BASE"
# Option 2: ~/team9-deploy (user home)
elif test_directory "$HOME"; then
    DEPLOY_BASE="$HOME/team9-deploy"
    echo "✅ Using user home directory: $DEPLOY_BASE"
# Option 3: /tmp/team9-deploy (temporary)
elif test_directory "/tmp"; then
    DEPLOY_BASE="/tmp/team9-deploy"
    echo "⚠️  Using temporary directory: $DEPLOY_BASE (will be lost on reboot)"
# Option 4: Current directory
else
    DEPLOY_BASE="$(pwd)/team9-deploy"
    echo "⚠️  Using current directory: $DEPLOY_BASE"
fi

# Create the deployment structure
echo "Creating staging and production directories..."
mkdir -p "$DEPLOY_BASE/staging"
mkdir -p "$DEPLOY_BASE/production"

echo "📁 Deployment base directory: $DEPLOY_BASE"
ls -la "$DEPLOY_BASE"

# Create staging environment file
echo "📝 Creating staging environment file..."
cat > "$DEPLOY_BASE/staging/.env" << 'EOF'
# Staging Environment Variables
NODE_ENV=development
FLASK_ENV=production
WEBAPP_PORT=3030
ML_API_PORT=5000

# API Keys (update these with actual values)
OPENWEATHER_API_KEY=d80653ff6bef26981a00369ab5f9a00c
GOOGLE_MAPS_API_KEY=AIzaSyCLxVxjw2d27TagAHFCYCjjrresvXw7Pg8
NEXT_PUBLIC_MAPBOX_API_KEY=pk.eyJ1IjoicHJha2hhcmRheWFsIiwiYSI6ImNtYm5qeDRnajE4bzcyaXF5cWthNXV1d2wifQ.vkY8ZEZMIn4wS7sP7nMF7Q
OPENAQ_API_KEY=f5d4413488537dbe913d8a4a47d9a547da75ad60696bbd8f9e46506516161b39
EOF

# Create production environment file
echo "📝 Creating production environment file..."
cat > "$DEPLOY_BASE/production/.env" << 'EOF'
# Production Environment Variables
NODE_ENV=production
FLASK_ENV=production
WEBAPP_PORT=8080
ML_API_PORT=5001

# API Keys (same as staging for now)
OPENWEATHER_API_KEY=d80653ff6bef26981a00369ab5f9a00c
GOOGLE_MAPS_API_KEY=AIzaSyCLxVxjw2d27TagAHFCYCjjrresvXw7Pg8
NEXT_PUBLIC_MAPBOX_API_KEY=pk.eyJ1IjoicHJha2hhcmRheWFsIiwiYSI6ImNtYm5qeDRnajE4bzcyaXF5cWthNXV1d2wifQ.vkY8ZEZMIn4wS7sP7nMF7Q
OPENAQ_API_KEY=f5d4413488537dbe913d8a4a47d9a547da75ad60696bbd8f9e46506516161b39
EOF

# Copy docker-compose files to deployment directories
echo "📋 Creating docker-compose files..."
cat > "$DEPLOY_BASE/staging/docker-compose.yml" << 'EOF'
services:
  webapp:
    image: ${WEBAPP_IMAGE}
    ports:
      - "3030:3000"
    environment:
      - NODE_ENV=development
      - NEXT_TELEMETRY_DISABLED=1
      - NEXT_PUBLIC_MAPBOX_API_KEY=${NEXT_PUBLIC_MAPBOX_API_KEY}
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
    depends_on:
      - ml-api

  ml-api:
    image: ${ML_API_IMAGE}
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
EOF

cat > "$DEPLOY_BASE/production/docker-compose.yml" << 'EOF'
services:
  webapp:
    image: ${WEBAPP_IMAGE}
    ports:
      - "8080:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - NEXT_PUBLIC_MAPBOX_API_KEY=${NEXT_PUBLIC_MAPBOX_API_KEY}
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
    depends_on:
      - ml-api

  ml-api:
    image: ${ML_API_IMAGE}
    ports:
      - "5001:5000"
    environment:
      - FLASK_ENV=production
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
EOF

# Set proper permissions
echo "🔒 Setting permissions..."
chmod +x "$DEPLOY_BASE/staging/.env"
chmod +x "$DEPLOY_BASE/production/.env"

echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up SSH key for GitLab CI/CD"
echo "2. Configure GitLab CI/CD variables"
echo "3. Test deployment"
echo ""
echo "🌐 Access URLs after deployment:"
echo "- Staging: http://137.43.49.26:3030"
echo "- Production: http://137.43.49.26:8080"
echo ""
echo "📁 Deployment directory: $DEPLOY_BASE"
