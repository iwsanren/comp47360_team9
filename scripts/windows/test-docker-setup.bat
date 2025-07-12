@echo off
REM Test script to validate docker-compose setup locally on Windows
REM This mimics what the CI/CD pipeline does

echo === Testing Docker Compose Setup ===

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Creating a sample .env file for testing...
    (
        echo OPENWEATHER_API_KEY=your_openweather_key_here
        echo GOOGLE_MAPS_API_KEY=your_google_maps_key_here
        echo NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_key_here
        echo NODE_ENV=development
        echo FLASK_ENV=production
    ) > .env
    echo Sample .env file created. Please update with real API keys.
)

echo.
echo Current .env file contents:
type .env
echo.

echo Testing docker-compose build...
docker-compose build

if %errorlevel% neq 0 (
    echo Docker compose build failed!
    pause
    exit /b 1
)

echo Docker compose build successful!
echo.

echo Testing docker-compose up (detached)...
docker-compose up -d

if %errorlevel% neq 0 (
    echo Docker compose up failed!
    pause
    exit /b 1
)

echo Docker compose up successful!
echo.

echo Container status:
docker-compose ps

echo.
echo Service URLs:
echo   - Webapp: http://localhost:3030
echo   - ML API: http://localhost:5000

echo.
echo To test the services:
echo   - Open http://localhost:3030 in your browser
echo   - Test ML API: curl http://localhost:5000

echo.
echo To stop the services:
echo   docker-compose down

echo.
echo === Test Complete ===
pause
