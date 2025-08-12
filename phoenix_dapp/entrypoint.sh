#!/bin/sh
set -e


# Wait for postgres
until pg_isready -h postgres_db -p 5432 -U postgres; do
  echo "Waiting for postgres..."
  sleep 2
done

echo "PostgreSQL is ready!"

# Force update dependencies to resolve any lock file issues
mix deps.get --force

# Create database if it does not exist
mix ecto.create

# Start Phoenix server
mix phx.server

