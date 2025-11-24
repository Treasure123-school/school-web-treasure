#!/bin/bash

# ===========================================
# Docker Services Start Script
# ===========================================

echo "🚀 Starting Treasure-Home School Management System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Start services
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📌 Service URLs:"
echo "   • PostgreSQL: postgresql://localhost:5432"
echo "   • MinIO API: http://localhost:9000"
echo "   • MinIO Console: http://localhost:9001"
echo "   • Redis: redis://localhost:6379"
echo ""
echo "💡 MinIO Console Login:"
echo "   • Username: minioadmin"
echo "   • Password: minioadmin"
echo ""
echo "🔧 To view logs: docker-compose logs -f"
echo "🛑 To stop services: docker-compose down"
