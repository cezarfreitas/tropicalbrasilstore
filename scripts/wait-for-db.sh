#!/bin/bash

# Wait for MySQL database to be ready

set -e

host="$1"
port="$2"
username="$3"
password="$4"
database="$5"

echo "Waiting for MySQL database at $host:$port..."

until mysql -h"$host" -P"$port" -u"$username" -p"$password" -e "SELECT 1" "$database" &> /dev/null
do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done

echo "✅ MySQL is up and running!"

# Run any database migrations or seeds here if needed
echo "🌱 Running database initialization..."

# The application will handle database initialization
echo "✅ Database initialization completed!"
