using System.ComponentModel.DataAnnotations;

namespace Backend.DTO;

public record LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; init; } = string.Empty;
}

public record RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; init; } = string.Empty;

    [Required]
    [Compare("Password")]
    public string ConfirmPassword { get; init; } = string.Empty;

    public string? FirstName { get; init; }
    public string? LastName { get; init; }

    [Required]
    public string Role { get; init; } = string.Empty;
}

public record AuthResponse
{
    public string Token { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public DateTime Expires { get; init; }
    public string Role { get; init; } = string.Empty;

}

public record GetUserResponse
{
    public string Id { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public DateTime CreatedAt { get; init; }
    public string Role { get; init; } = string.Empty;

}

public record RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; init; } = string.Empty;
}