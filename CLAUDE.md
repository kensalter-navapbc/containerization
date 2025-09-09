# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a containerized weather application demonstrating full-stack development with .NET and Angular. The project consists of:

- **Backend**: .NET 8 Web API with Entity Framework Core and SQL Server integration
- **Frontend**: Angular 17 SPA with TypeScript
- **Database**: Azure SQL Edge containerized database with sample weather data
- **Architecture**: Three-tier containerized application ready for deployment

## Architecture

### Solution Structure
The Visual Studio solution (`Containerization.sln`) contains two main projects:
- `Backend/Backend.csproj` - .NET 8 Web API with Entity Framework Core
- `frontend/FrontEnd.csproj` - .NET 8 web host for Angular SPA

### Frontend Architecture
- Angular 17 application located in `frontend/ClientApp/`
- Uses Angular CLI for build and development
- Integrated with ASP.NET Core SPA hosting
- TypeScript with modern Angular features

### Database Architecture
- Azure SQL Edge container (ARM-compatible for macOS)
- WeatherApp database with WeatherForecast table
- 37 days of sample data (7 historical + 30 future)
- Persistent volume storage
- Network: `weatherapp-network`

## Development Commands

### Backend Development
```bash
# Build the solution
dotnet build

# Run backend API (from Backend directory)
cd Backend
dotnet run

# Restore packages
dotnet restore
```

### Frontend Development
```bash
# Navigate to Angular app
cd frontend/ClientApp

# Install dependencies
npm install

# Start development server (accessible on all network interfaces)
npm start  # Runs on port 4200

# Build for production
npm run build

# Run tests
npm test
```

### Database Operations
```bash
# Start database container
cd database
docker-compose up -d

# Check container health
docker ps

# Connect to database
docker exec -it weatherapp-database /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd'

# View sample data
docker exec -it weatherapp-database /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd' -Q "USE WeatherApp; SELECT TOP 10 * FROM WeatherForecast ORDER BY Date;"

# Stop and cleanup
docker-compose down -v
```

### Full Stack Development
```bash
# Start database first
cd database && docker-compose up -d

# In separate terminal: start backend
cd Backend && dotnet run

# In separate terminal: start frontend
cd frontend/ClientApp && npm start
```

## Database Connection Details

- **Server**: `localhost:1433`
- **Database**: `WeatherApp`
- **Username**: `sa`  
- **Password**: `YourStrong!Passw0rd`
- **Container**: `weatherapp-database`
- **Network**: `weatherapp-network`

## Key Technologies

- **.NET 8**: Backend API framework
- **Entity Framework Core 9.0**: ORM with SQL Server provider
- **Angular 17**: Frontend SPA framework
- **Azure SQL Edge**: ARM-compatible SQL Server container
- **Docker Compose**: Container orchestration
- **Swagger**: API documentation (via Swashbuckle)

## Project Integration Points

The application is designed for database integration:
1. Backend includes Entity Framework Core and SQL Server packages
2. Database provides WeatherForecast table matching typical .NET model structure
3. Frontend Angular app is configured for API integration
4. All components use containerization for consistent deployment

## macOS ARM Compatibility

This project is fully optimized for Apple Silicon (M1/M2/M3):
- Azure SQL Edge container for ARM compatibility
- No platform-specific Docker configurations needed
- All development tools support ARM architecture natively