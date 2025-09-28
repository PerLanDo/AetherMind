#!/bin/bash

# ScholarSync Vercel Deployment Script

echo "🚀 Starting ScholarSync Vercel Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the application
echo "🔨 Building application..."
npm run build:client

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set up your environment variables in Vercel dashboard"
echo "2. Configure your database (Neon recommended)"
echo "3. Test your deployment"
echo ""
echo "Visit your Vercel dashboard to manage your deployment."
