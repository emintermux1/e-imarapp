#!/bin/bash

# Initialize database and enable PostGIS extension

# Check if psql is available
if ! command -v psql &> /dev/null
then
    echo "psql could not be found"
    exit 1
fi

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-eimar}
DB_USER=${DB_USER:-eimar}
DB_PASSWORD=${DB_PASSWORD:-eimar}

# Export password for psql
export PGPASSWORD=$DB_PASSWORD

# Create database if it doesn't exist
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

# Enable PostGIS extension
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis"

echo "Database initialized and PostGIS extension enabled"