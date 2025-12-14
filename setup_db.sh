#!/bin/bash
set -e

# Start PostgreSQL
sudo service postgresql start

# Wait for it to start
sleep 5

# Create user and database
psql -U postgres -c "CREATE USER maeple_user WITH PASSWORD 'maeple_beta_2025';" || true
psql -U postgres -c "CREATE DATABASE maeple OWNER maeple_user;" || true
psql -U postgres -c "ALTER USER maeple_user CREATEDB;" || true

# Initialize schema
psql -U postgres -d maeple -f local_schema.sql || true

# Grant permissions to maeple_user
psql -U postgres -d maeple -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO maeple_user;" || true
psql -U postgres -d maeple -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO maeple_user;" || true

echo "Database setup complete."
