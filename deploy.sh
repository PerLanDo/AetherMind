#!/bin/bash

# AetherMind Production Deployment Script
echo "🚀 Starting AetherMind deployment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure your environment variables."
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
required_vars=("DATABASE_URL" "SESSION_SECRET" "GROK_4_FAST_FREE_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set."
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build client application
echo "🏗️  Building client application..."
cd client
npm run build
cd ..

echo "✅ Client build completed"

# Run database migrations (if any)
echo "🗄️  Running database migrations..."
# npm run db:migrate

# Start the application
echo "🎉 Starting AetherMind..."
npm start