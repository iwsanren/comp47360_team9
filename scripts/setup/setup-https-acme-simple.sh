#!/bin/bash

# Alternative HTTPS setup using acme.sh
DOMAIN="lunaroutes.duckdns.org"
EMAIL="hzfang0421@gmail.com"

echo "🔒 Setting up HTTPS using acme.sh (alternative to certbot)..."

# Install acme.sh
curl https://get.acme.sh | sh -s email=$EMAIL

# Set environment
export CF_Token=""
export CF_Account_ID=""
export CF_Zone_ID=""

# For DuckDNS, we'll use DNS manual mode
echo "🔐 Using acme.sh with manual DNS verification..."

# Stop nginx
systemctl stop nginx

# Make sure we're running as root or use sudo properly
if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

# Source the acme.sh environment
source /root/.acme.sh/acme.sh.env 2>/dev/null || true

# Issue certificate with manual DNS - force interactive mode
echo "🔐 Requesting SSL certificate for $DOMAIN..."
/root/.acme.sh/acme.sh --issue --dns -d $DOMAIN \
  --yes-I-know-dns-manual-mode-enough-go-ahead-please \
  --force

echo ""
echo "📋 After acme.sh shows the TXT record:"
echo "1. Add the TXT record to DuckDNS using:"
echo "   curl \"https://www.duckdns.org/update?domains=lunaroutes&token=4d903bad-44bf-4bd5-b6db-7b3688271c0c&txt=[TXT_VALUE]\""
echo "2. Wait 2-3 minutes for DNS propagation"
echo "3. Press Enter in the acme.sh prompt to continue"

# After manual verification, install cert
if [ -f "/root/.acme.sh/$DOMAIN/$DOMAIN.cer" ]; then
    mkdir -p /etc/ssl/certs
    /root/.acme.sh/acme.sh --install-cert -d $DOMAIN \
      --key-file /etc/ssl/certs/$DOMAIN.key \
      --fullchain-file /etc/ssl/certs/$DOMAIN.cer \
      --reloadcmd "systemctl reload nginx"
    
    # Configure nginx
    cat > /etc/nginx/sites-available/manhattan-my-way << 'EOF'
server {
    listen 80;
    server_name lunaroutes.duckdns.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lunaroutes.duckdns.org;
    
    ssl_certificate /etc/ssl/certs/lunaroutes.duckdns.org.cer;
    ssl_certificate_key /etc/ssl/certs/lunaroutes.duckdns.org.key;
    
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
    
    nginx -t && systemctl start nginx
    echo "✅ HTTPS setup complete with acme.sh!"
else
    systemctl start nginx
    echo "❌ Certificate not found"
fi
