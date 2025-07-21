#!/bin/bash

# HTTPS Setup Script - Using Let's Encrypt Free SSL Certificate
# Requires DDNS service to be set up first

DOMAIN="lunaroutes.duckdns.org"  # DDNS domain
EMAIL="hzfang0421@gmail.com"       # email

echo "🔒 Setting up HTTPS and SSL certificate..."

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

# Stop Nginx to free port 80
echo "⏹️ Temporarily stopping Nginx..."
systemctl stop nginx

# Obtain SSL certificate
echo "🔐 Obtaining SSL certificate..."
certbot certonly --standalone \
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
    cp /etc/nginx/sites-available/manhattan-my-way /etc/nginx/sites-available/manhattan-my-way.backup
    
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
    
    # ML API predictions endpoint
    location /api/ml/predict-all {
        proxy_pass http://localhost:5000/predict-all;
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
    
    # ML API health check endpoint
    location /api/ml/health {
        proxy_pass http://localhost:5000/health;
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
        echo ""
        echo "⚠️  Please ensure:"
        echo "   1. DDNS domain correctly resolves to $(curl -s ifconfig.me)"
        echo "   2. Firewall allows port 443"
        echo "   3. Domain is within Let's Encrypt rate limits"
        
    else
        echo "❌ Nginx configuration error"
        systemctl start nginx
        exit 1
    fi
    
else
    echo "❌ SSL certificate acquisition failed"
    echo "Please check:"
    echo "   1. Domain resolution is correct"
    echo "   2. Port 80 is accessible"
    echo "   3. Firewall settings"
    
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
