@echo off
REM GitLab Runner Diagnosis Script for Windows

echo === GitLab Runner Diagnosis ===
echo Checking GitLab Runner status and configuration...
echo.

REM Check if GitLab Runner is installed
echo 1. Checking GitLab Runner installation:
where gitlab-runner >nul 2>&1
if %errorlevel%==0 (
    echo ✓ GitLab Runner is installed
    gitlab-runner --version
) else (
    echo ✗ GitLab Runner is not installed or not in PATH
    echo Download from: https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-windows-amd64.exe
)
echo.

REM Check GitLab Runner service status
echo 2. Checking GitLab Runner service status:
sc query gitlab-runner >nul 2>&1
if %errorlevel%==0 (
    sc query gitlab-runner | find "RUNNING" >nul
    if %errorlevel%==0 (
        echo ✓ GitLab Runner service is running
    ) else (
        echo ✗ GitLab Runner service is not running
        echo Start with: gitlab-runner start
    )
) else (
    echo ✗ GitLab Runner service is not installed
    echo Install with: gitlab-runner install
)
echo.

REM List registered runners
echo 3. Checking registered runners:
where gitlab-runner >nul 2>&1
if %errorlevel%==0 (
    gitlab-runner list
) else (
    echo Cannot check runners - GitLab Runner not found
)
echo.

REM Check runner configuration
echo 4. Checking runner configuration:
if exist "%USERPROFILE%\.gitlab-runner\config.toml" (
    echo ✓ Config file exists at %USERPROFILE%\.gitlab-runner\config.toml
    echo Current configuration:
    type "%USERPROFILE%\.gitlab-runner\config.toml"
) else (
    echo ✗ Config file not found at %USERPROFILE%\.gitlab-runner\config.toml
)
echo.

REM Check Docker availability
echo 5. Checking Docker availability:
where docker >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Docker is installed
    docker --version
    docker ps >nul 2>&1
    if %errorlevel%==0 (
        echo ✓ Docker is running
    ) else (
        echo ✗ Docker is not running
        echo Start Docker Desktop or Docker service
    )
) else (
    echo ✗ Docker is not installed
)
echo.

echo === Common Solutions ===
echo.
echo If runner is not picking up jobs, try:
echo 1. Check runner tags match job tags in .gitlab-ci.yml
echo 2. Restart runner: gitlab-runner restart
echo 3. Re-register runner if needed
echo 4. Check project settings ^> CI/CD ^> Runners
echo 5. Ensure runner is not paused
echo.
echo To register a new runner:
echo gitlab-runner register
echo   - URL: https://csgitlab.ucd.ie/
echo   - Token: [Get from GitLab project settings]
echo   - Executor: docker
echo   - Default image: alpine:latest
echo   - Tags: docker
echo.
pause
