@echo off
title Install Node.js and run Warehouse IQ tests
echo ============================================
echo  Step 1: installing Node.js (LTS) with winget
echo  Windows may ask "Do you want to allow..." - click Yes.
echo ============================================
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
set "PATH=%PATH%;C:\Program Files\nodejs"
echo.
echo ============================================
echo  Step 2: running the Warehouse IQ tests
echo ============================================
cd /d "%~dp0"
node tests\run-tests.js
echo.
echo Done. Close and reopen VS Code so its terminal can find "node" too.
pause
