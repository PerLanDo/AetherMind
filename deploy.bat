@echo off
REM AetherMind Production Deployment Script for Windows
echo 🚀 Starting AetherMind deployment...

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found. Please copy .env.example to .env and configure your environment variables.
    exit /b 1
)

echo ✅ Environment file found

REM Install dependencies
echo 📦 Installing dependencies...
call npm ci --only=production
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Build client application
echo 🏗️  Building client application...
cd client
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build client
    exit /b 1
)
cd ..

echo ✅ Client build completed

REM Start the application
echo 🎉 Starting AetherMind...
call npm start