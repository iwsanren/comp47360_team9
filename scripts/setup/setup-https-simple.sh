#!/bin/bash

# HTTPS Setup Script - Standalone mode with better error handling
# This version tries to resolve DNS issues first

DOMAIN="lunaroutes.duckdns.org"
EMAIL="hzfang0421@gmail.com"

echo "🔒 Setting up HTTPS and SSL certificate..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script with root privileges"
    exit 1
fi

# Install Certbot
echo "📦 Installing Certbot..."
apt update
apt install -y certbot python3-certbot-nginx dnsutils

# Check domain resolution with multiple DNS servers
echo "🔍 Checking domain resolution..."
echo "Testing with Google DNS (8.8.8.8)..."
nslookup $DOMAIN 8.8.8.8

echo "Testing with Cloudflare DNS (1.1.1.1)..."
nslookup $DOMAIN 1.1.1.1

echo "Getting current public IP..."
PUBLIC_IP=$(curl -s ifconfig.me)
echo "Server public IP: $PUBLIC_IP"

# Check if domain resolves to correct IP
RESOLVED_IP=$(nslookup $DOMAIN 8.8.8.8 | grep "Address:" | tail -1 | awk '{print $2}')
echo "Domain resolves to: $RESOLVED_IP"

if [ "$PUBLIC_IP" != "$RESOLVED_IP" ]; then
    echo "⚠️  WARNING: Domain does not resolve to this server's IP"
    echo "Expected: $PUBLIC_IP"
    echo "Got: $RESOLVED_IP"
    echo ""
    echo "Please update your DuckDNS domain to point to: $PUBLIC_IP"
    echo "Visit: https://www.duckdns.org"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Stop Nginx to free port 80
echo "⏹️ Temporarily stopping Nginx..."
systemctl stop nginx

# Test if port 80 is free
echo "🔍 Checking if port 80 is available..."
if netstat -tlnp | grep :80; then
    echo "❌ Port 80 is still in use. Waiting 5 seconds..."
    sleep 5
    if netstat -tlnp | grep :80; then
        echo "❌ Port 80 is still occupied. Please stop the service manually."
        systemctl start nginx
        exit 1
    fi
fi

#!/bin/bash

# HTTPS Setup Script - Simple approach using certbot with DNS TXT method
# This version uses a more reliable approach

DOMAIN="lunaroutes.duckdns.org"
EMAIL="hzfang0421@gmail.com"

echo "🔒 Setting up HTTPS and SSL certificate..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script with root privileges"
    exit 1
fi

# Install dependencies
echo "📦 Installing Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# Check domain resolution
echo "� Checking domain resolution..."
nslookup $DOMAIN 8.8.8.8

# Stop Nginx to avoid conflicts
echo "⏹️ Temporarily stopping Nginx..."
systemctl stop nginx

# Use DNS manual method with clear instructions
echo "🔐 Starting certificate request process..."
echo ""
echo "ℹ️  This process will require you to add a DNS TXT record."
echo "   Please have your DuckDNS dashboard ready."
echo ""

# Start certbot with DNS challenge
certbot certonly 
    --manual 
    --manual-public-ip-logging-ok 
    --preferred-challenges dns 
    --email $EMAIL 
    --agree-tos 
    --no-eff-email 
    --keep-until-expiring 
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
        
        # Configure firewall if enabled
        echo "🔥 Configuring firewall..."
        ufw allow 443/tcp 2>/dev/null || echo "Firewall not enabled"
        ufw allow 'Nginx Full' 2>/dev/null || echo "Firewall not enabled"
        
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
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check if domain resolves correctly:"
    echo "   nslookup $DOMAIN 8.8.8.8"
    echo "2. Update DuckDNS to point to: $PUBLIC_IP"
    echo "3. Wait 5-10 minutes for DNS propagation"
    echo "4. Try using DNS challenge method instead"
    echo ""
    echo "Alternative: Use DNS challenge script:"
    echo "   sudo ./scripts/setup/setup-https-dns.sh"
    
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
