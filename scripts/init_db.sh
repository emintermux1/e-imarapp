#!/bin/bash
# Initialize database with Alembic migrations

set -e

echo "Initializing database..."

# Run Alembic migrations
alembic upgrade head

echo "Database initialized successfully!"