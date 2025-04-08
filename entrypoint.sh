#!/bin/sh
# entrypoint.sh

# Wait for the database to be ready
# Uses netcat (nc) to check if the port is open
echo "Waiting for database at db:5432..."
while ! nc -z db 5432; do
  sleep 1 # wait for 1 second before check again
done
echo "Database is ready!"

echo "Running Prisma migrations..."
npx prisma migrate deploy # Use deploy instead of dev for applying existing migrations

echo "Starting the application..."
# Dockerfile の CMD で指定されたコマンドを実行
exec "$@"
