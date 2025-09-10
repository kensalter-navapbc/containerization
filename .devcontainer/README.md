# Dev Container Setup

This project includes a complete dev container configuration that provides all necessary tools for development without requiring local installation of .NET, Node.js, or other dependencies.

## What's Included

- **.NET 8 SDK** - For backend API development
- **Node.js 20 & npm** - For Angular frontend development
- **Angular CLI 17** - Pre-installed globally
- **SQL Server tools** - For database connectivity
- **VS Code extensions** - C#, Angular, TypeScript, SQL Server tools
- **Database connection** - Automatic connection to the SQL Server container

## Quick Start

1. **Prerequisites**: Only Docker and VS Code with the Dev Containers extension
2. **Clone the repository**
3. **Open in VS Code** and click "Reopen in Container" when prompted
4. **Wait for setup** - First time will take 5-10 minutes to build

## Development Workflow

Once the container starts:

```bash
# Backend development (from /workspace/Backend)
dotnet run

# Frontend development (from /workspace/frontend/ClientApp)
npm start

# Database is automatically available at localhost:1433
```

## Port Forwarding

The following ports are automatically forwarded:
- **1433** - SQL Server database
- **4200** - Angular dev server
- **5000** - Backend HTTP
- **5001** - Backend HTTPS

## Database Access

Connect to the database using:
- **Server**: localhost:1433
- **Database**: WeatherApp
- **Username**: sa
- **Password**: YourStrong!Passw0rd

Or use the command line:
```bash
sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd' -Q "USE WeatherApp; SELECT * FROM WeatherForecast;"
```

## Benefits

- **Zero local setup** - Only Docker required
- **Consistent environment** - Same tools and versions for all developers
- **Isolated dependencies** - No conflicts with local installations
- **Pre-configured** - All extensions and settings ready to go
- **Database included** - Full stack ready immediately