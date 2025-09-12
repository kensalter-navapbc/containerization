using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Backend.Middleware;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Weather App API", 
        Version = "v1",
        Description = "A containerized weather application API with JWT authentication"
    });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Just enter your JWT token below (without 'Bearer' prefix).\r\n\r\nExample: \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Add Entity Framework
// Choose connection string based on environment
var isRunningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true" ||
                          Environment.GetEnvironmentVariable("CONTAINER") == "true";

var connectionStringName = isRunningInContainer ? "ContainerConnection" : "DefaultConnection";
var connectionString = builder.Configuration.GetConnectionString(connectionStringName) ?? 
    "Server=localhost,1433;Database=WeatherApp;User Id=SA;Password=${SQL_SA_PASSWORD};TrustServerCertificate=true;";

// Replace environment variable placeholders with actual values
var sqlPassword = Environment.GetEnvironmentVariable("SQL_SA_PASSWORD") ?? 
                 Environment.GetEnvironmentVariable("MSSQL_SA_PASSWORD") ?? 
                 "YourStrong!Passw0rd";
var sqlServer = Environment.GetEnvironmentVariable("SQL_SERVER_HOST") ?? 
               (isRunningInContainer ? "weatherapp-database" : "localhost");

connectionString = connectionString.Replace("${SQL_SA_PASSWORD}", sqlPassword);
connectionString = connectionString.Replace("weatherapp-database", sqlServer).Replace("localhost", sqlServer);

builder.Services.AddDbContext<WeatherContext>(options =>
    options.UseSqlServer(connectionString));

// Add Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<WeatherContext>()
.AddDefaultTokenProviders();

// Add JWT Authentication
var jwtKey = builder.Configuration["Jwt:SecretKey"] ?? "your-super-secret-jwt-key-that-is-long-enough-for-security";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "WeatherApp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "WeatherApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Add custom services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<DatabaseSeeder>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:4200", 
                    "https://localhost:5079",
                    "http://localhost:5237",
                    "https://localhost:7113"
                  )
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Ensure database is created and migrated
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    
    try
    {
        logger.LogInformation("Checking database connection and applying migrations...");
        logger.LogInformation("SQL Server connection: "+connectionString);


        
        var context = services.GetRequiredService<WeatherContext>();
        
        // Check if database exists with retry logic
        var canConnect = false;
        var maxRetries = 10;
        var retryDelay = TimeSpan.FromSeconds(5);
        
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                logger.LogInformation($"Attempting database connection (attempt {attempt}/{maxRetries})...");
                canConnect = await context.Database.CanConnectAsync();
                if (canConnect)
                {
                    logger.LogInformation("Database connection successful!");
                    break;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning($"Database connection attempt {attempt} failed: {ex.Message}");
            }
            
            if (attempt < maxRetries)
            {
                logger.LogInformation($"Retrying in {retryDelay.TotalSeconds} seconds...");
                await Task.Delay(retryDelay);
                retryDelay = TimeSpan.FromSeconds(Math.Min(retryDelay.TotalSeconds * 2, 60)); // Exponential backoff, max 60s
            }
        }
        
        // Now that we have a connection, check if we need to create or migrate the database
        if (!await context.Database.CanConnectAsync())
        {
            logger.LogInformation("Database does not exist, creating database with all tables...");
            await context.Database.EnsureCreatedAsync();
            logger.LogInformation("Database created successfully");
        }
        else
        {
            logger.LogInformation("Database exists, checking for migrations...");
            
            // Try to apply migrations, but handle the case where tables already exist
            try
            {
                var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
                if (pendingMigrations.Any())
                {
                    logger.LogInformation("Applying {Count} pending migrations", pendingMigrations.Count());
                    await context.Database.MigrateAsync();
                    logger.LogInformation("Database migrations applied successfully");
                }
                else
                {
                    logger.LogInformation("Database is up to date, no migrations needed");
                }
            }
            catch (Exception migrationEx) when (migrationEx.Message.Contains("already an object named"))
            {
                logger.LogWarning("Migration conflict detected (table already exists).");
                
                // // Check if Identity tables exist and create them if missing
                // var identityTablesExist = await context.Database.SqlQueryRaw<int>(
                //     @"SELECT COUNT(*) AS Value FROM INFORMATION_SCHEMA.TABLES 
                //       WHERE TABLE_NAME IN ('AspNetUsers', 'AspNetRoles', 'AspNetUserRoles', 'AspNetUserClaims', 'AspNetUserLogins', 'AspNetUserTokens', 'AspNetRoleClaims')"
                // ).FirstOrDefaultAsync();
                
                // if (identityTablesExist < 7)
                // {
                //     logger.LogInformation("Creating missing Identity tables...");
                    
                //     // Create Identity tables manually
                //     await context.Database.ExecuteSqlRawAsync(@"
                //         IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AspNetRoles')
                //         CREATE TABLE [AspNetRoles] (
                //             [Id] nvarchar(450) NOT NULL,
                //             [Name] nvarchar(256) NULL,
                //             [NormalizedName] nvarchar(256) NULL,
                //             [ConcurrencyStamp] nvarchar(max) NULL,
                //             CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
                //         );
                //     ");
                    
                //     await context.Database.ExecuteSqlRawAsync(@"
                //         IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AspNetUsers')
                //         CREATE TABLE [AspNetUsers] (
                //             [Id] nvarchar(450) NOT NULL,
                //             [FirstName] nvarchar(max) NULL,
                //             [LastName] nvarchar(max) NULL,
                //             [CreatedAt] datetime2 NOT NULL,
                //             [UpdatedAt] datetime2 NOT NULL,
                //             [UserName] nvarchar(256) NULL,
                //             [NormalizedUserName] nvarchar(256) NULL,
                //             [Email] nvarchar(256) NULL,
                //             [NormalizedEmail] nvarchar(256) NULL,
                //             [EmailConfirmed] bit NOT NULL,
                //             [PasswordHash] nvarchar(max) NULL,
                //             [SecurityStamp] nvarchar(max) NULL,
                //             [ConcurrencyStamp] nvarchar(max) NULL,
                //             [PhoneNumber] nvarchar(max) NULL,
                //             [PhoneNumberConfirmed] bit NOT NULL,
                //             [TwoFactorEnabled] bit NOT NULL,
                //             [LockoutEnd] datetimeoffset NULL,
                //             [LockoutEnabled] bit NOT NULL,
                //             [AccessFailedCount] int NOT NULL,
                //             CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
                //         );
                //     ");
                    
                //     await context.Database.ExecuteSqlRawAsync(@"
                //         IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AspNetUserRoles')
                //         CREATE TABLE [AspNetUserRoles] (
                //             [UserId] nvarchar(450) NOT NULL,
                //             [RoleId] nvarchar(450) NOT NULL,
                //             CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
                //             CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
                //             CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                //         );
                //     ");
                    
                //     await context.Database.ExecuteSqlRawAsync(@"
                //         IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AspNetUserClaims')
                //         CREATE TABLE [AspNetUserClaims] (
                //             [Id] int IDENTITY(1,1) NOT NULL,
                //             [UserId] nvarchar(450) NOT NULL,
                //             [ClaimType] nvarchar(max) NULL,
                //             [ClaimValue] nvarchar(max) NULL,
                //             CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
                //             CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                //         );
                //     ");
                    
                //     await context.Database.ExecuteSqlRawAsync(@"
                //         IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AspNetUserLogins')
                //         CREATE TABLE [AspNetUserLogins] (
                //             [LoginProvider] nvarchar(450) NOT NULL,
                //             [ProviderKey] nvarchar(450) NOT NULL,
                //             [ProviderDisplayName] nvarchar(max) NULL,
                //             [UserId] nvarchar(450) NOT NULL,
                //             CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
                //             CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                //         );
                //     ");
                    
                //     await context.Database.ExecuteSqlRawAsync(@"
                //         IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AspNetUserTokens')
                //         CREATE TABLE [AspNetUserTokens] (
                //             [UserId] nvarchar(450) NOT NULL,
                //             [LoginProvider] nvarchar(450) NOT NULL,
                //             [Name] nvarchar(450) NOT NULL,
                //             [Value] nvarchar(max) NULL,
                //             CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
                //             CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                //         );
                //     ");
                    
                //     await context.Database.ExecuteSqlRawAsync(@"
                //         IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AspNetRoleClaims')
                //         CREATE TABLE [AspNetRoleClaims] (
                //             [Id] int IDENTITY(1,1) NOT NULL,
                //             [RoleId] nvarchar(450) NOT NULL,
                //             [ClaimType] nvarchar(max) NULL,
                //             [ClaimValue] nvarchar(max) NULL,
                //             CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
                //             CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
                //         );
                //     ");
                    
                //     // Create indexes
                //     await context.Database.ExecuteSqlRawAsync(@"
                //         IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AspNetRoles_NormalizedName' AND object_id = OBJECT_ID('AspNetRoles'))
                //         CREATE UNIQUE INDEX [IX_AspNetRoles_NormalizedName] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL;
                //     ");
                    
                //     await context.Database.ExecuteSqlRawAsync(@"
                //         IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AspNetUsers_NormalizedEmail' AND object_id = OBJECT_ID('AspNetUsers'))
                //         CREATE INDEX [IX_AspNetUsers_NormalizedEmail] ON [AspNetUsers] ([NormalizedEmail]);
                        
                //         IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AspNetUsers_NormalizedUserName' AND object_id = OBJECT_ID('AspNetUsers'))
                //         CREATE UNIQUE INDEX [IX_AspNetUsers_NormalizedUserName] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL;
                //     ");
                // }
                
                // logger.LogInformation("Identity tables created successfully");
            }
        }

        // Seed roles and users in development environment
        if (app.Environment.IsDevelopment())
        {
            var seeder = services.GetRequiredService<DatabaseSeeder>();
            await seeder.SeedAsync();
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while migrating the database");
        throw;
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Weather App API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "Weather App API - Swagger UI";
        c.DefaultModelsExpandDepth(-1); // Hide models section by default
        c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List); // Expand operation list by default
    });
}

// Use CORS before HTTPS redirection
app.UseCors("AllowAngular");

app.UseHttpsRedirection();

// Use development auth bypass middleware (only in Development environment)
app.UseMiddleware<DevelopmentAuthBypassMiddleware>();

// Use Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
