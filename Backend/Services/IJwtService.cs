using Backend.Models;
using System.Security.Claims;

namespace Backend.Services;

public interface IJwtService
{
    Task<string> GenerateTokenAsync(ApplicationUser user);
    ClaimsPrincipal? ValidateToken(string token);
}