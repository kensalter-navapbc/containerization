# WeatherApp Database (macOS ARM Compatible)

This directory contains the Azure SQL Edge database setup for the WeatherApp containerization project, specifically designed for macOS with Apple Silicon (ARM processors).

## Overview

The database is configured with:
- **Azure SQL Edge** (ARM-compatible) running in a container
- **WeatherApp** database with a `WeatherForecast` table
- **37 days of sample weather data** (7 historical + 30 future days)
- **Realistic seasonal temperature variations**
- **Persistent data volumes** for data storage
- **Simple, reliable initialization** process

## Database Schema

### WeatherForecast Table
```sql
CREATE TABLE [dbo].[WeatherForecast] (
    [Id] int IDENTITY(1,1) PRIMARY KEY,
    [Date] date NOT NULL,
    [TemperatureC] int NOT NULL,
    [TemperatureF] int NOT NULL,
    [Summary] nvarchar(100) NOT NULL,
    [CreatedAt] datetime2 DEFAULT GETUTCDATE(),
    [UpdatedAt] datetime2 DEFAULT GETUTCDATE()
);
```

## Quick Start (Recommended)

### Option 1: Automated Setup
```bash
cd /Users/ken/Source/containerization/database

# Clean up any existing setup
docker-compose down -v

# Start the database container
docker-compose up -d

# Wait for it to be healthy (check with docker ps)
docker ps
```

## Connection Details

Once running, connect using:
- **Server**: `localhost:1433`
- **Database**: `WeatherApp`
- **Username**: `sa`
- **Password**: `YourStrong!Passw0rd`

## Verification Commands

### Check if container is healthy:
```bash
docker ps
# Should show (healthy) status
```

### Test database connection:
```bash
docker exec -it weatherapp-database /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd'
```

### View sample data:
```sql
USE WeatherApp;
SELECT TOP 10 * FROM WeatherForecast ORDER BY Date;
GO
```

### Check data statistics:
```sql
USE WeatherApp;
SELECT COUNT(*) as TotalRecords FROM WeatherForecast;
SELECT MIN(Date) as EarliestDate, MAX(Date) as LatestDate FROM WeatherForecast;
GO
```

## File Structure

```
database/
├── Dockerfile                    # Azure SQL Edge container
├── docker-compose.yml           # Container orchestration
├── scripts/
│   ├── 01-create-database.sql    # Database and table creation
│   ├── 02-insert-sample-data.sql # Sample data insertion
│   └── 03-verify-data.sql        # Data verification queries
├── .env                         # Environment variables
└── README.md                   # This file
```

## Troubleshooting

### Container fails to start
```bash
# Check container logs
docker logs weatherapp-database

# Ensure port 1433 is available
lsof -i :1433

# Clean restart
docker-compose down -v
docker-compose up -d
```

### Database initialization fails
```bash
# Check if SQL Server is ready
docker exec weatherapp-database /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'YourStrong!Passw0rd' -Q "SELECT 1"

# Check container logs
docker logs weatherapp-database --tail 50
```

### Connection issues
```bash
# Verify container is healthy
docker inspect weatherapp-database --format='{{.State.Health.Status}}'

# Test connection from host
telnet localhost 1433

# Check network
docker network ls
docker network inspect weatherapp-network
```

### Reset everything
```bash
# Complete cleanup
docker-compose down -v
docker system prune -f
docker volume prune -f

docker-compose up -d

```

## macOS ARM Notes

- Uses Azure SQL Edge (compatible with Apple Silicon)
- No platform specification needed in docker-compose
- Fully compatible with M1/M2/M3 Macs
- Performance optimized for ARM architecture

## Future Integration

This database is ready for integration with your .NET Backend API:
1. Update connection string to point to `localhost:1433`
2. Replace random weather data generation with database queries
3. Add Entity Framework or Dapper for data access
4. Implement CRUD operations for weather management

The database structure matches your existing WeatherForecast model perfectly.