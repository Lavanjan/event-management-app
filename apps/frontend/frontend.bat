@echo off
setlocal enabledelayedexpansion

REM ========================================
REM Build and push Docker image for frontend
REM ========================================

REM Read version from version.txt
set /p VERSION=<version.txt

REM Docker Hub username and app name
set USERNAME=yathupiraba
set APP_NAME=eventbooking

REM Environment variables for Vite build
set VITE_API_BASE_URL=/api
set VITE_API_URL=/api
set VITE_API_PROXY_TARGET=http://147.93.179.153:3004
set VITE_API_TIMEOUT=30000
set VITE_PORT=4201
set VITE_APP_NAME=Event Management System
set VITE_APP_VERSION=1.0.0
set VITE_APP_ENVIRONMENT=production
set VITE_ENABLE_CSRF=true
set VITE_ENABLE_REQUEST_LOGGING=true
set VITE_ENABLE_PAYMENT_MODULE=true
set VITE_ENABLE_ROLE_MANAGEMENT=true
set VITE_ENABLE_ADVANCED_PERMISSIONS=true
set VITE_ENABLE_MOCK_DATA=false
set VITE_ENABLE_DEBUG_MODE=false
set BACKEND_URL=http://147.93.179.153:3004

echo.
echo =======================================
echo Checking existing image: %USERNAME%/%APP_NAME%-frontend:version%VERSION%
echo =======================================

docker image inspect %USERNAME%/%APP_NAME%-frontend:version%VERSION% >nul 2>&1
if %errorlevel%==0 (
    echo ⚠️  Image version%VERSION% already exists locally.
    echo Please update version.txt to a new version before building.
    pause
    exit /b 1
)

echo.
echo =======================================
echo Building Docker image: %APP_NAME%-frontend version %VERSION%
echo =======================================

docker build ^
  --build-arg VITE_API_BASE_URL=%VITE_API_BASE_URL% ^
  --build-arg VITE_API_URL=%VITE_API_URL% ^
  --build-arg VITE_API_PROXY_TARGET=%VITE_API_PROXY_TARGET% ^
  --build-arg VITE_API_TIMEOUT=%VITE_API_TIMEOUT% ^
  --build-arg VITE_PORT=%VITE_PORT% ^
  --build-arg VITE_APP_NAME="%VITE_APP_NAME%" ^
  --build-arg VITE_APP_VERSION=%VITE_APP_VERSION% ^
  --build-arg VITE_APP_ENVIRONMENT=%VITE_APP_ENVIRONMENT% ^
  --build-arg VITE_ENABLE_CSRF=%VITE_ENABLE_CSRF% ^
  --build-arg VITE_ENABLE_REQUEST_LOGGING=%VITE_ENABLE_REQUEST_LOGGING% ^
  --build-arg VITE_ENABLE_PAYMENT_MODULE=%VITE_ENABLE_PAYMENT_MODULE% ^
  --build-arg VITE_ENABLE_ROLE_MANAGEMENT=%VITE_ENABLE_ROLE_MANAGEMENT% ^
  --build-arg VITE_ENABLE_ADVANCED_PERMISSIONS=%VITE_ENABLE_ADVANCED_PERMISSIONS% ^
  --build-arg VITE_ENABLE_MOCK_DATA=%VITE_ENABLE_MOCK_DATA% ^
  --build-arg VITE_ENABLE_DEBUG_MODE=%VITE_ENABLE_DEBUG_MODE% ^
  --build-arg BACKEND_URL=%BACKEND_URL% ^
  -t %USERNAME%/%APP_NAME%-frontend:version%VERSION% ^
  .

if %errorlevel% neq 0 (
    echo ❌ Build failed. Version not incremented.
    pause
    exit /b 1
)

echo.
echo =======================================
echo Pushing image to Docker Hub...
echo =======================================

docker push %USERNAME%/%APP_NAME%-frontend:version%VERSION%
if %errorlevel% neq 0 (
    echo ❌ Push failed. Version not incremented.
    pause
    exit /b 1
)

REM Increment version by 0.1 (e.g., 1.0 → 1.1)
for /f "tokens=1,2 delims=." %%a in ("%VERSION%") do (
    set /a MAJOR=%%a
    set /a MINOR=%%b+1
)
set NEXT_VERSION=%MAJOR%.%MINOR%

echo %NEXT_VERSION% > version.txt

echo.
echo =======================================
echo ✅ Frontend image pushed successfully: version %VERSION%
echo Next version set to: %NEXT_VERSION%
echo =======================================
pause
