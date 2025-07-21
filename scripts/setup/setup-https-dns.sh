#!/bin/bash

# HTTPS Setup Script - Using DNS Challenge for Let's Encrypt
# This version uses DNS validation instead of HTTP validation

DOMAIN="lunaroutes.duckdns.org"
EMAIL="hzfang0421@gmail.com"

echo "🔒 Setting up HTTPS and SSL certificate with DNS challenge..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script with root privileges"
    exit 1
fi

# Install Certbot
echo "📦 Installing Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# Check domain resolution
echo "🔍 Checking domain resolution..."
nslookup $DOMAIN

# Stop Nginx to avoid conflicts
echo "⏹️ Temporarily stopping Nginx..."
systemctl stop nginx

# Use manual DNS challenge instead of standalone
echo "🔐 Obtaining SSL certificate using DNS challenge..."
echo ""
echo "⚠️  IMPORTANT: You will need to manually add a TXT record to your DNS"
echo "   Follow the instructions that appear below carefully"
echo ""

certbot certonly --manual \
    --preferred-challenges dns \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Check if certificate was successfully obtained
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL certificate obtained successfully"
    
    # Update Nginx configuration file
    echo "📋 Updating Nginx configuration..."
    
    # Backup original configuration
    cp /etc/nginx/sites-available/manhattan-my-way /etc/nginx/sites-available/manhattan-my-way.backup 2>/dev/null || echo "No existing config to backup"
    
    # Create new HTTPS configuration
    cat > /etc/nginx/sites-available/manhattan-my-way << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL certificate configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL security configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Root path - proxy to Next.js application
    location / {
        proxy_pass http://localhost:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # ML API proxy
    location /api/ml/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range" always;
    }
    
    # Static files cache
    location /_next/static {
        proxy_pass http://localhost:3030;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

    # Test Nginx configuration
    echo "🧪 Testing Nginx configuration..."
    nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration is correct"
        
        # Enable the site
        ln -sf /etc/nginx/sites-available/manhattan-my-way /etc/nginx/sites-enabled/
        
        # Remove default site if it exists
        rm -f /etc/nginx/sites-enabled/default
        
        # Start Nginx
        systemctl start nginx
        systemctl enable nginx
        
        # Set up automatic certificate renewal
        echo "🔄 Setting up automatic certificate renewal..."
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        # Open HTTPS port
        echo "🔥 Configuring firewall..."
        ufw allow 443/tcp
        ufw allow 'Nginx Full'
        
        echo ""
        echo "🎉 HTTPS setup complete!"
        echo "🔒 Your secure website:"
        echo "   https://$DOMAIN"
        echo ""
        echo "🔧 Certificate will auto-renew"
        echo "📅 Certificate validity: 90 days"
        
    else
        echo "❌ Nginx configuration error"
        systemctl start nginx
        exit 1
    fi
    
else
    echo "❌ SSL certificate acquisition failed"
    echo "Please check the DNS challenge setup"
    
    # Restart Nginx
    systemctl start nginx
    exit 1
fi

echo ""
echo "📋 Maintenance commands:"
echo "   Check certificate status: certbot certificates"
echo "   Manual renewal: certbot renew"
echo "   View Nginx logs: tail -f /var/log/nginx/access.log"
echo "   Restart service: systemctl restart nginx"
