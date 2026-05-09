#!/bin/bash
# Run Alembic migrations

set -e

echo "Running database migrations..."

# Run Alembic migrations
alembic upgrade head

echo "Migrations completed successfully!"