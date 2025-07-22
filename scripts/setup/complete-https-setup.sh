#!/bin/bash

# Complete HTTPS setup - run after TXT record is added
DOMAIN="lunaroutes.duckdns.org"

echo "🔐 Completing SSL certificate setup..."

# Wait a bit more for DNS propagation
echo "⏳ Waiting 30 seconds for DNS propagation..."
sleep 30

# Try to complete the certificate issuance
echo "🔐 Attempting to complete certificate issuance..."
cd /root
./.acme.sh/acme.sh --renew -d $DOMAIN

# Check if certificate was created
if [ -f "/root/.acme.sh/$DOMAIN/$DOMAIN.cer" ]; then
    echo "✅ Certificate found! Installing..."
    
    # Create SSL directory
    mkdir -p /etc/ssl/certs
    
    # Install certificate
    ./.acme.sh/acme.sh --install-cert -d $DOMAIN \
      --key-file /etc/ssl/certs/$DOMAIN.key \
      --fullchain-file /etc/ssl/certs/$DOMAIN.cer \
      --reloadcmd "systemctl reload nginx"
    
    # Configure nginx for HTTPS
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
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/manhattan-my-way /etc/nginx/sites-enabled/
    
    # Test and restart nginx
    nginx -t
    if [ $? -eq 0 ]; then
        systemctl restart nginx
        echo "✅ HTTPS setup complete!"
        echo "🌐 Your site is now available at: https://lunaroutes.duckdns.org"
    else
        echo "❌ Nginx configuration test failed"
        systemctl start nginx
    fi
else
    echo "❌ Certificate not found. Please try the manual steps:"
    echo "1. Switch to root: sudo su -"
    echo "2. Run: ~/.acme.sh/acme.sh --renew -d lunaroutes.duckdns.org"
    systemctl start nginx
fi
