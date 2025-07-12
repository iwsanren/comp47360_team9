@echo off
REM GitLab Runner Installation and Setup Script for Windows

echo === GitLab Runner Installation Script ===
echo This script will download and install GitLab Runner on Windows
echo.

REM Create runner directory
if not exist "C:\GitLab-Runner" mkdir "C:\GitLab-Runner"
cd /d "C:\GitLab-Runner"

echo 1. Downloading GitLab Runner...
REM Download GitLab Runner
powershell -Command "Invoke-WebRequest -Uri 'https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-windows-amd64.exe' -OutFile 'gitlab-runner.exe'"

if exist "gitlab-runner.exe" (
    echo ✓ GitLab Runner downloaded successfully
) else (
    echo ✗ Failed to download GitLab Runner
    pause
    exit /b 1
)

echo.
echo 2. Installing GitLab Runner service...
REM Install GitLab Runner as a service
gitlab-runner.exe install

echo.
echo 3. Starting GitLab Runner service...
REM Start the service
gitlab-runner.exe start

echo.
echo 4. Adding GitLab Runner to PATH...
REM Add to PATH (for current session)
set "PATH=%PATH%;C:\GitLab-Runner"

echo.
echo === Next Steps ===
echo.
echo GitLab Runner has been installed. Now you need to register it:
echo.
echo 1. Go to your GitLab project: https://csgitlab.ucd.ie/ZhaofangHe/comp47360_team9
echo 2. Go to Settings ^> CI/CD ^> Runners
echo 3. Find the registration token
echo 4. Run this command in a new Command Prompt as Administrator:
echo.
echo    C:\GitLab-Runner\gitlab-runner.exe register
echo.
echo 5. When prompted, enter:
echo    - GitLab instance URL: https://csgitlab.ucd.ie/
echo    - Registration token: [copy from GitLab project settings]
echo    - Description: team9-windows-runner
echo    - Tags: docker,windows
echo    - Executor: docker
echo    - Default Docker image: alpine:latest
echo.
echo After registration, restart the runner:
echo    C:\GitLab-Runner\gitlab-runner.exe restart
echo.
pause
