# Nginx Reverse Proxy Setup Guide

## Problem
Docker containers are running correctly locally, but external access to `http://137.43.49.26:3030` is not working. Need to set up Nginx reverse proxy to solve network access issues.

## Solution

### 1. SSH to Server
```bash
ssh root@137.43.49.26
# or
ssh student@137.43.49.26
```

### 2. Run Nginx Setup Script
```bash
cd /tmp/team9-deploy/staging
chmod +x scripts/setup-nginx.sh
sudo ./scripts/setup-nginx.sh
```

### 3. Manual Setup (if script fails)

#### Install Nginx
```bash
sudo apt update
sudo apt install -y nginx
```

#### Copy Configuration File
```bash
sudo cp nginx.conf /etc/nginx/sites-available/manhattan-my-way
sudo ln -s /etc/nginx/sites-available/manhattan-my-way /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

#### Test and Start
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### Configure Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 'Nginx Full'
```

## Verification

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Check Port Listening
```bash
sudo netstat -tlnp | grep :80
```

### Check Container Status
```bash
cd /tmp/team9-deploy/staging
docker-compose ps
```

### Test Local Connectivity
```bash
curl http://localhost:3030
curl http://localhost:5000
curl http://localhost
```

## Application Access

After setup, the application will be available at:
- **Main Application**: http://137.43.49.26
- **ML API**: http://137.43.49.26/api/ml/

## Troubleshooting

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### View Container Logs
```bash
docker-compose logs webapp
docker-compose logs ml-api
```

### Restart Services
```bash
# Restart containers
docker-compose restart

# Restart Nginx
sudo systemctl restart nginx
```

### Check Configuration
```bash
# Test Nginx configuration
sudo nginx -t

# View active sites
ls -la /etc/nginx/sites-enabled/
```

## Configuration Details

The Nginx configuration file (`nginx.conf`) includes:
- **Root path `/`**: Forwards to Next.js application (localhost:3030)
- **API path `/api/ml/`**: Forwards to ML API (localhost:5000)
- **Static file caching**: Optimizes Next.js static resources
- **CORS support**: Allows cross-origin API requests
- **Gzip compression**: Improves transfer performance

This setup solves network firewall/port mapping issues, allowing external users to access the application through the standard HTTP port (80).
