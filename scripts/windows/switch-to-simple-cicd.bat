@echo off
echo ================================
echo GitLab CI/CD Quick Switch Script
echo ================================
echo.

echo Switching to simplified CI/CD configuration...
echo.

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ERROR: docker-compose.yml not found. 
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Backup current CI configuration
if exist ".gitlab-ci.yml" (
    echo Backing up current .gitlab-ci.yml to .gitlab-ci-standard.yml...
    move ".gitlab-ci.yml" ".gitlab-ci-standard.yml" >nul
    if errorlevel 1 (
        echo ERROR: Failed to backup .gitlab-ci.yml
        pause
        exit /b 1
    )
    echo ✅ Backup completed
) else (
    echo WARNING: .gitlab-ci.yml not found
)

REM Switch to simplified configuration
if exist ".gitlab-ci-simple.yml" (
    echo Switching to simplified CI/CD configuration...
    move ".gitlab-ci-simple.yml" ".gitlab-ci.yml" >nul
    if errorlevel 1 (
        echo ERROR: Failed to switch CI configuration
        pause
        exit /b 1
    )
    echo ✅ Switched to simplified CI/CD
) else (
    echo ERROR: .gitlab-ci-simple.yml not found
    pause
    exit /b 1
)

echo.
echo ================================
echo Setup completed successfully! 
echo ================================
echo.
echo Next steps:
echo 1. Configure GitLab CI/CD variables at:
echo    https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9/-/settings/ci_cd
echo.
echo 2. Required variables:
echo    - DEPLOY_SERVER: 137.43.49.26
echo    - DEPLOY_USER: student  
echo    - SSH_PRIVATE_KEY: (your private key)
echo    - OPENWEATHER_API_KEY: (your API key)
echo    - GOOGLE_MAPS_API_KEY: (your API key)
echo    - NEXT_PUBLIC_MAPBOX_API_KEY: (your API key)
echo.
echo 3. Generate SSH key (if not already done):
echo    ssh-keygen -t rsa -b 4096 -C "gitlab-ci@team9"
echo    ssh-copy-id student@137.43.49.26
echo.
echo 4. Test deployment:
echo    git add .
echo    git commit -m "Switch to simplified CI/CD"
echo    git push origin develop
echo.
echo For detailed instructions, see: docs/quick-setup-guide.md
echo.
pause
