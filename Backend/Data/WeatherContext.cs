using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

public class WeatherContext : IdentityDbContext<ApplicationUser>
{
    public WeatherContext(DbContextOptions<WeatherContext> options) : base(options)
    {
    }
    
    public DbSet<WeatherForecast> WeatherForecasts { get; set; } = null!;
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<WeatherForecast>(entity =>
        {
            entity.ToTable("WeatherForecast");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Date).IsRequired();
            entity.Property(e => e.TemperatureC).IsRequired();
            entity.Property(e => e.TemperatureF).IsRequired();
            entity.Property(e => e.Summary).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });
    }
}