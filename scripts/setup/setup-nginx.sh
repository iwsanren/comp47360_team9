#!/bin/bash

# Nginx setup script for Manhattan My Way Project
# Run this script on the server (137.43.49.26) as root or with sudo

echo "🚀 Setting up Nginx reverse proxy for Manhattan My Way..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root or with sudo"
    exit 1
fi

# Install Nginx if not already installed
echo "📦 Installing Nginx..."
apt update
apt install -y nginx

# Stop Nginx for configuration
echo "⏹️ Stopping Nginx..."
systemctl stop nginx

# Backup existing default config
if [ -f /etc/nginx/sites-available/default ]; then
    echo "💾 Backing up existing default config..."
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy our nginx configuration
echo "📋 Installing Nginx configuration..."
if [ -f "/tmp/team9-deploy/staging/nginx.conf" ]; then
    cp /tmp/team9-deploy/staging/nginx.conf /etc/nginx/sites-available/manhattan-my-way
elif [ -f "./nginx.conf" ]; then
    cp ./nginx.conf /etc/nginx/sites-available/manhattan-my-way
else
    echo "❌ nginx.conf not found in current directory or staging deployment"
    exit 1
fi

# Create symbolic link to enable the site
echo "🔗 Enabling site..."
ln -sf /etc/nginx/sites-available/manhattan-my-way /etc/nginx/sites-enabled/

# Remove default site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "🗑️ Removing default site..."
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Start and enable Nginx
    echo "🚀 Starting Nginx..."
    systemctl start nginx
    systemctl enable nginx
    
    # Check status
    echo "📊 Nginx status:"
    systemctl status nginx --no-pager -l
    
    # Open firewall ports
    echo "🔥 Configuring firewall..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 'Nginx Full'
    
    # Show listening ports
    echo "🔌 Listening ports:"
    netstat -tlnp | grep :80
    
    echo ""
    echo "🎉 Setup complete!"
    echo "📱 Your application should now be accessible at:"
    echo "   http://137.43.49.26"
    echo ""
    echo "🔧 To check logs:"
    echo "   sudo tail -f /var/log/nginx/access.log"
    echo "   sudo tail -f /var/log/nginx/error.log"
    echo ""
    echo "🐳 Make sure your Docker containers are running:"
    echo "   docker-compose ps"
    
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi
