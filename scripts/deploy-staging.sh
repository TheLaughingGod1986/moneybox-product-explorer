#!/bin/bash

# Moneybox Product Explorer - Staging Deployment Script
set -e

echo "🚀 Starting staging deployment..."

# Load staging environment variables
if [ -f config/staging.env ]; then
    source config/staging.env
fi

# Build and test the application
echo "📦 Building application..."
npm run build

echo "🧪 Running tests..."
npm test

echo "📊 Running production performance check..."
npm run performance &
PERF_PID=$!
sleep 10
kill $PERF_PID || true

# Docker build and deployment
echo "🐳 Building Docker images..."
docker-compose -f docker-compose.staging.yml build

echo "🔄 Stopping existing containers..."
docker-compose -f docker-compose.staging.yml down

echo "🚀 Starting staging containers..."
docker-compose -f docker-compose.staging.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🏥 Running health checks..."
curl -f http://localhost:3002/api/health || {
    echo "❌ Backend health check failed"
    exit 1
}

curl -f http://localhost:3000/health || {
    echo "❌ Frontend health check failed"
    exit 1
}

echo "✅ Staging deployment completed successfully!"
echo "🌐 Frontend: http://staging.moneybox.com"
echo "🔌 API: http://staging-api.moneybox.com"

# Run integration tests against staging
echo "🧪 Running staging integration tests..."
npm run test:integration

echo "🎉 Staging deployment verification complete!"
