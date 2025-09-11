using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Backend.Models;

namespace Backend.Middleware;

public class DevelopmentAuthBypassMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DevelopmentAuthBypassMiddleware> _logger;
    private const string BypassHeaderName = "X-Development-User";
    private const string TestUserId = "test-user-id";

    public DevelopmentAuthBypassMiddleware(RequestDelegate next, ILogger<DevelopmentAuthBypassMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only enable in Development environment
        if (context.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
        {
            if (context.Request.Headers.ContainsKey(BypassHeaderName))
            {
                var bypassUser = context.Request.Headers[BypassHeaderName].ToString();
                
                if (!string.IsNullOrEmpty(bypassUser))
                {
                    _logger.LogWarning("Development auth bypass activated for user: {User}", bypassUser);
                    
                    // Create a fake identity for the bypassed user
                    var claims = new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, TestUserId),
                        new Claim(ClaimTypes.Name, bypassUser),
                        new Claim(ClaimTypes.Email, $"{bypassUser}@test.local"),
                        new Claim("firstName", "Test"),
                        new Claim("lastName", "User"),
                        new Claim("bypass", "true")
                    };

                    var identity = new ClaimsIdentity(claims, "Development");
                    var principal = new ClaimsPrincipal(identity);
                    
                    context.User = principal;
                }
            }
        }

        await _next(context);
    }
}