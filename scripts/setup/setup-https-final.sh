#!/bin/bash

# HTTPS Setup Script - Final working version
DOMAIN="lunaroutes.duckdns.org"
EMAIL="hzfang0421@gmail.com"

echo "🔒 Setting up HTTPS with DNS challenge..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script with root privileges"
    exit 1
fi

# Install certbot
echo "📦 Installing Certbot..."
apt update
apt install -y certbot

# Stop Nginx
echo "⏹️ Stopping Nginx..."
systemctl stop nginx

# Run certbot with DNS challenge
echo "🔐 Starting certificate request..."
echo "You will need to add a DNS TXT record when prompted."

certbot certonly --manual --preferred-challenges dns --email $EMAIL --agree-tos --no-eff-email -d $DOMAIN

# Check if certificate was obtained
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Certificate obtained successfully!"
    
    # Create Nginx HTTPS config
    echo "📋 Configuring Nginx..."
    
    cat > /etc/nginx/sites-available/manhattan-my-way << 'EOF'
server {
    listen 80;
    server_name lunaroutes.duckdns.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lunaroutes.duckdns.org;
    
    ssl_certificate /etc/letsencrypt/live/lunaroutes.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lunaroutes.duckdns.org/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://localhost:3030;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ml/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    # Test and start Nginx
    nginx -t && {
        ln -sf /etc/nginx/sites-available/manhattan-my-way /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        systemctl start nginx
        systemctl enable nginx
        
        echo "🎉 HTTPS setup complete!"
        echo "🔒 Visit: https://$DOMAIN"
    }
else
    echo "❌ Certificate failed"
    systemctl start nginx
fi
