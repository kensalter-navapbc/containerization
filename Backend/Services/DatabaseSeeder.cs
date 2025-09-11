using Microsoft.AspNetCore.Identity;
using Backend.Models;
using Backend.Constants;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class DatabaseSeeder
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly WeatherContext _context;
    private readonly ILogger<DatabaseSeeder> _logger;
    
    public DatabaseSeeder(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, WeatherContext context, ILogger<DatabaseSeeder> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        await SeedRolesAsync();
        await SeedUsersAsync();
        await SeedWeatherForecastsAsync();
    }

    private async Task SeedRolesAsync()
    {
        var roles = new[] { Roles.Admin, Roles.User, Roles.Guest };
        
        foreach (var roleName in roles)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                var role = new IdentityRole(roleName);
                var result = await _roleManager.CreateAsync(role);
                
                if (result.Succeeded)
                {
                    _logger.LogInformation("Role created successfully: {Role}", roleName);
                }
                else
                {
                    _logger.LogError("Failed to create role {Role}: {Errors}", roleName,
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }
    }

    private async Task SeedUsersAsync()
    {
        await CreateUserAsync("admin@weatherapp.local", "Admin123!", "Admin", "User", Roles.Admin);
        await CreateUserAsync("user@weatherapp.local", "User123!", "Regular", "User", Roles.User);
        await CreateUserAsync("guest@weatherapp.local", "Guest123!", "Guest", "User", Roles.Guest);
    }

    private async Task CreateUserAsync(string email, string password, string firstName, string lastName, string roleName)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        
        if (existingUser == null)
        {
            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, password);
            
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, roleName);
                _logger.LogInformation("User created successfully: {Email} with role {Role}", email, roleName);
                _logger.LogInformation("User credentials: {Email} / {Password}", email, password);
            }
            else
            {
                _logger.LogError("Failed to create user {Email}: {Errors}", email,
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            var userRoles = await _userManager.GetRolesAsync(existingUser);
            if (!userRoles.Contains(roleName))
            {
                await _userManager.AddToRoleAsync(existingUser, roleName);
                _logger.LogInformation("Added role {Role} to existing user: {Email}", roleName, email);
            }
            _logger.LogInformation("User already exists: {Email}", email);
        }
    }

    private async Task SeedWeatherForecastsAsync()
    {
        try
        {
            // Check if weather data already exists
            var existingCount = await _context.WeatherForecasts.CountAsync();
            if (existingCount > 0)
            {
                _logger.LogInformation("Weather forecast data already exists ({Count} records). Skipping seeding.", existingCount);
                return;
            }

            _logger.LogInformation("Seeding weather forecast data...");

            var weatherSummaries = new[]
            {
                "Sunny", "Partly Cloudy", "Cloudy", "Overcast",
                "Light Rain", "Heavy Rain", "Thunderstorms",
                "Light Snow", "Heavy Snow", "Freezing",
                "Bracing", "Chilly", "Cool", "Mild",
                "Warm", "Balmy", "Hot", "Sweltering",
                "Scorching", "Windy", "Foggy", "Clear"
            };

            var random = new Random();
            var startDate = DateOnly.FromDateTime(DateTime.Today);
            var weatherForecasts = new List<WeatherForecast>();

            // Generate 30 days of future weather data
            for (int i = 1; i <= 30; i++)
            {
                var date = startDate.AddDays(i);
                var month = date.Month;
                
                // Generate seasonal base temperature (assuming Northern Hemisphere)
                int baseTemp = month switch
                {
                    12 or 1 or 2 => -5,    // Winter
                    3 or 4 or 5 => 15,     // Spring
                    6 or 7 or 8 => 25,     // Summer
                    _ => 10                // Fall
                };

                // Add randomness to temperature
                var tempC = baseTemp + random.Next(-10, 11);
                var tempF = 32 + (tempC * 9 / 5);

                // Select appropriate weather summary based on temperature
                var availableSummaries = tempC switch
                {
                    <= 0 => new[] { "Freezing", "Heavy Snow", "Light Snow", "Bracing" },
                    > 0 and <= 10 => new[] { "Chilly", "Cool", "Cloudy", "Overcast", "Light Rain" },
                    > 10 and <= 20 => new[] { "Mild", "Partly Cloudy", "Cloudy", "Light Rain", "Windy" },
                    > 20 and <= 30 => new[] { "Warm", "Sunny", "Partly Cloudy", "Clear" },
                    _ => new[] { "Hot", "Sunny", "Sweltering", "Scorching" }
                };

                var summary = availableSummaries[random.Next(availableSummaries.Length)];

                weatherForecasts.Add(new WeatherForecast
                {
                    Date = date,
                    TemperatureC = tempC,
                    TemperatureF = tempF,
                    Summary = summary
                });
            }

            // Generate 7 days of historical data for testing
            for (int i = 1; i <= 7; i++)
            {
                var date = startDate.AddDays(-i);
                var tempC = 15 + random.Next(-5, 11);
                var tempF = 32 + (tempC * 9 / 5);
                var summary = weatherSummaries[random.Next(weatherSummaries.Length)];

                weatherForecasts.Add(new WeatherForecast
                {
                    Date = date,
                    TemperatureC = tempC,
                    TemperatureF = tempF,
                    Summary = summary
                });
            }

            // Add all weather forecasts to the database
            await _context.WeatherForecasts.AddRangeAsync(weatherForecasts);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully seeded {Count} weather forecast records", weatherForecasts.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed weather forecast data");
            throw;
        }
    }
}