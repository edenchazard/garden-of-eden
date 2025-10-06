#!/bin/bash
set -e

echo "Setting up test environment..."

# Start test containers
docker compose -f docker-compose.test.yml up -d

# Wait for database to be ready
echo "Waiting for test database to be ready..."
sleep 10

# Create test database if it doesn't exist
echo "Setting up test database..."
docker compose -f docker-compose.test.yml exec -T testdb mysql -u root -pTestRootPassword123 -e "CREATE DATABASE IF NOT EXISTS hatchery_test;" || echo "Database already exists"

# Wait a bit more for the app to be ready
echo "Waiting for test app to be ready..."
sleep 5

echo "Test environment is ready!"