@echo off
echo Opening HTTPS setup script for editing...
echo.
echo The script is located at: scripts\setup\setup-https.sh
echo.
echo Current domain configuration:
findstr "DOMAIN=" scripts\setup\setup-https.sh
findstr "EMAIL=" scripts\setup\setup-https.sh
echo.
echo To edit the file, you can use:
echo 1. VS Code: code scripts\setup\setup-https.sh
echo 2. Notepad: notepad scripts\setup\setup-https.sh
echo 3. Any text editor of your choice
echo.
echo Current configuration looks correct:
echo - DOMAIN="lunaroutes.duckdns.org"
echo - EMAIL="hzfang0421@gmail.com"
echo.
echo Press any key to open in VS Code, or Ctrl+C to cancel...
pause >nul
code scripts\setup\setup-https.sh
