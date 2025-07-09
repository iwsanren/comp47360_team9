# CI/CD Pipeline Fix Summary

## 🎯 Problems Solved

### 1. Missing .env File Issue
The CI/CD pipeline was failing because the `.env` file was not available in the deployment directory. This happened because:
1. `.env` is in `.gitignore` (correctly, for security)
2. `cp -r . /deployment/dir/` doesn't copy ignored files
3. `docker-compose.yml` uses `env_file: .env` but the file was missing

### 2. Container Network Binding Issue ⚠️ **CRITICAL**
Services were not accessible from outside Docker containers because:
1. **Next.js dev server** only bound to localhost (127.0.0.1) inside container
2. **Flask app** only bound to localhost (127.0.0.1) inside container
3. External requests to http://137.43.49.26:3030 couldn't reach the services

## ✅ Solutions Implemented

### 1. Fixed docker-compose.prod.yml
- **Removed** problematic volume mounts that caused deployment issues
- **Added** `env_file: .env` configuration for both services
- **Updated** environment variables to match staging config

### 2. Updated .gitlab-ci.yml
- **Added** automatic `.env` file creation in deployment directory
- **Included** all required environment variables:
  - `OPENWEATHER_API_KEY`
  - `GOOGLE_MAPS_API_KEY` 
  - `NEXT_PUBLIC_MAPBOX_API_KEY`
  - `NODE_ENV`
  - `FLASK_ENV`
- **Separated** staging and production deployment directories
- **Added** extensive debugging and connectivity tests

### 3. Fixed Container Network Binding ⚠️ **CRITICAL FIX**
- **webapp/Dockerfile**: Changed CMD to `["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]`
- **ml/app.py**: Changed to `app.run(host='0.0.0.0', port=5000, debug=True)`
- Now both services bind to all interfaces (0.0.0.0) instead of just localhost
- **Added** automatic `.env` file creation in deployment directory
- **Included** all required environment variables:
  - `OPENWEATHER_API_KEY`
  - `GOOGLE_MAPS_API_KEY` 
  - `NEXT_PUBLIC_MAPBOX_API_KEY`
  - `NODE_ENV`
  - `FLASK_ENV`
- **Separated** staging and production deployment directories
- **Added** debug output to show .env file contents

### 3. Created Testing Scripts
- `scripts/test-docker-setup.sh` - Linux/Mac testing
- `scripts/test-docker-setup.bat` - Windows testing
- Both scripts validate the docker-compose setup locally

## 🧪 How to Test

### Local Testing (Before Push)
```bash
# Linux/Mac
./scripts/test-docker-setup.sh

# Windows
scripts\test-docker-setup.bat
```

### CI/CD Testing
1. **Staging**: Push to `develop` branch
   - Deploys to http://137.43.49.26:3030
   - Uses `/tmp/team9-deploy/staging/`

2. **Production**: Manual deploy from `main` branch
   - Deploys to http://137.43.49.26:8080
   - Uses `/tmp/team9-deploy/production/`

## 🔍 Debugging

### Check CI/CD Logs
Look for these sections in GitLab CI/CD logs:
```
Creating .env file with environment variables...
.env file created:
OPENWEATHER_API_KEY=***
GOOGLE_MAPS_API_KEY=***
...
```

### Check Container Status
The pipeline shows container status:
```
Container status:
Name                    Command               State           Ports
ml-api_1               python app.py            Up      0.0.0.0:5000->5000/tcp
webapp_1               npm start                Up      0.0.0.0:3030->3000/tcp
```

### Manual Verification on Server
```bash
# SSH to server
ssh root@137.43.49.26

# Check deployment directory
ls -la /tmp/team9-deploy/staging/
cat /tmp/team9-deploy/staging/.env

# Check containers
docker ps
docker-compose -f /tmp/team9-deploy/staging/docker-compose.yml ps
```

## 🚀 Next Steps

1. **Push to develop branch** to test staging deployment
2. **Verify services are accessible** at http://137.43.49.26:3030
3. **Test API endpoints** (weather, maps, ML predictions)
4. **Create merge request** to main branch for production deployment

## 📝 Key Files Changed

- `.gitlab-ci.yml` - Fixed .env file handling + added connectivity tests
- `docker-compose.prod.yml` - Removed volumes, added env_file
- `webapp/Dockerfile` - **CRITICAL**: Fixed host binding to 0.0.0.0
- `ml/app.py` - **CRITICAL**: Fixed Flask host binding to 0.0.0.0
- `CI-CD-FIX-SUMMARY.md` - Updated documentation

## 🚨 Why the Website Wasn't Working

The main issue was **network binding**:
- Next.js dev server was only listening on `localhost` inside the container
- Flask app was only listening on `localhost` inside the container  
- External requests to `http://137.43.49.26:3030` couldn't reach the services
- **Solution**: Both services now bind to `0.0.0.0` (all network interfaces)

The pipeline should now successfully deploy both staging and production environments with all services accessible from external IPs.
