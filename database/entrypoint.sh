#!/bin/bash
set -e

echo "Starting WeatherApp Database Container..."

# Check and set permissions if needed
if [ "$(id -u)" = "0" ]; then
    echo "Running as root, switching to mssql user..."
    exec su-exec mssql "$0" "$@"
fi

echo "Running as mssql user ($(id -u):$(id -g))"

# Start SQL Server in the background
echo "Starting SQL Server..."
/opt/mssql/bin/sqlservr &
SQL_SERVER_PID=$!

# Function to check if SQL Server is ready
wait_for_sql_server() {
    local max_attempts=60
    local attempt=0
    
    echo "Waiting for SQL Server to become ready..."
    while [ $attempt -lt $max_attempts ]; do
        if /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P "$MSSQL_SA_PASSWORD" -Q "SELECT 1" > /dev/null 2>&1; then
            echo "SQL Server is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo "Attempt $attempt/$max_attempts: Waiting for SQL Server..."
        sleep 3
    done
    
    echo "ERROR: SQL Server failed to start within expected time"
    return 1
}

# Function to run database initialization
initialize_database() {
    echo "Running database initialization..."
    
    # Create database
    echo "Creating database..."
    if /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P "$MSSQL_SA_PASSWORD" -i /opt/mssql-scripts/01-create-database.sql; then
        echo "✓ Database created successfully"
        echo "✓ Database initialization completed!"
        echo "Note: Sample data will be seeded by the .NET backend application"
        return 0
    else
        echo "✗ Failed to create database"
        return 1
    fi
}

# Wait for SQL Server to be ready and initialize database
if wait_for_sql_server; then
    echo "SQL Server is ready. Running database initialization..."
    
    if initialize_database; then
        echo "Database setup completed successfully!"
    else
        echo "Database initialization failed"
        exit 1
    fi
else
    echo "SQL Server startup failed"
    exit 1
fi

echo ""
echo "════════════════════════════════════════"
echo "  WeatherApp Database is ready!"
echo "════════════════════════════════════════"
echo "  Server: localhost,1433"
echo "  Database: WeatherApp"
echo "════════════════════════════════════════"
echo ""

# Keep the container running by waiting for SQL Server
wait $SQL_SERVER_PID