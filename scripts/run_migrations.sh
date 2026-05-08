#!/bin/bash

# Run Alembic migrations

# Check if alembic is available
if ! command -v alembic &> /dev/null
then
    echo "alembic could not be found"
    exit 1
fi

# Run migrations
alembic upgrade head

echo "Migrations completed"