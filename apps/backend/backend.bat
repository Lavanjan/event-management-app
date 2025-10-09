@echo off
setlocal enabledelayedexpansion

REM ========================================
REM Build and push Docker image for backend
REM ========================================

REM Read version from version.txt
set /p VERSION=<version.txt

REM Docker Hub username and app name
set USERNAME=yathupiraba
set APP_NAME=eventbooking

echo.
echo =======================================
echo Checking existing image: %USERNAME%/%APP_NAME%-backend:version%VERSION%
echo =======================================

docker image inspect %USERNAME%/%APP_NAME%-backend:version%VERSION% >nul 2>&1
if %errorlevel%==0 (
    echo ⚠️  Image version%VERSION% already exists locally.
    echo Please update version.txt to a new version before building.
    pause
    exit /b 1
)

echo.
echo =======================================
echo Building Docker image: %APP_NAME%-backend version %VERSION%
echo =======================================

docker build -t %USERNAME%/%APP_NAME%-backend:version%VERSION% .
if %errorlevel% neq 0 (
    echo ❌ Build failed. Version not incremented.
    pause
    exit /b 1
)

echo.
echo =======================================
echo Pushing image to Docker Hub...
echo =======================================

docker push %USERNAME%/%APP_NAME%-backend:version%VERSION%
if %errorlevel% neq 0 (
    echo ❌ Push failed. Version not incremented.
    pause
    exit /b 1
)

REM Increment version by 0.1
for /f "tokens=1,2 delims=." %%a in ("%VERSION%") do (
    set /a MAJOR=%%a
    set /a MINOR=%%b+1
)
set NEXT_VERSION=%MAJOR%.%MINOR%

echo %NEXT_VERSION% > version.txt

echo.
echo =======================================
echo ✅ Backend image pushed successfully: version %VERSION%
echo Next version set to: %NEXT_VERSION%
echo =======================================
pause
