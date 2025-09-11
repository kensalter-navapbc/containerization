using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.Constants;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class WeatherController : ControllerBase
{
    private readonly WeatherContext _context;
    
    public WeatherController(WeatherContext context)
    {
        _context = context;
    }
    
    [HttpGet("forecast")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.User},{Roles.Guest}")]
    public async Task<ActionResult<IEnumerable<WeatherForecastDTO>>> GetWeatherForecast()
    {
        var forecasts = await _context.WeatherForecasts
            .OrderBy(w => w.Date)
            .Take(10)
            .ToListAsync();
        
        return Ok(forecasts.Select(f => new WeatherForecastDTO
        {
            Date = f.Date,
            TemperatureC = f.TemperatureC,
            TemperatureF = f.TemperatureF,
            Summary = f.Summary
        }).ToArray());
    }
    
    [HttpGet("forecast/{id}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.User},{Roles.Guest}")]
    public async Task<ActionResult<WeatherForecastDTO>> GetWeatherForecast(int id)
    {
        var forecast = await _context.WeatherForecasts.FindAsync(id);
        
        if (forecast == null)
        {
            return NotFound();
        }
        
        return Ok(new
        {
            Date = forecast.Date,
            TemperatureC = forecast.TemperatureC,
            TemperatureF = forecast.TemperatureF,
            Summary = forecast.Summary
        });
    }

    [HttpDelete("forecast/{id}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.User}")]
    public async Task<ActionResult> DeleteWeatherForecast(int id)
    {
        var forecast = await _context.WeatherForecasts.FindAsync(id);

        if (forecast == null)
        {
            return NotFound();
        }

        _context.WeatherForecasts.Remove(forecast);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("forecast")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.User}")]
    public async Task<ActionResult<WeatherForecastDTO>> CreateWeatherForecast(WeatherForecastDTO model)
    {
        var forecast = new WeatherForecast()
        {
            Date = model.Date,
            TemperatureC = model.TemperatureC,
            TemperatureF = model.TemperatureF,
            Summary = model.Summary,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.WeatherForecasts.Add(forecast);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(CreateWeatherForecast), forecast);

    }
    
    [HttpGet("forecast/range")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.User},{Roles.Guest}")]
    public async Task<ActionResult<IEnumerable<WeatherForecastDTO>>> GetWeatherForecastByDateRange(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int limit = 30)
    {
        var query = _context.WeatherForecasts.AsQueryable();
        
        if (startDate.HasValue)
        {
            query = query.Where(w => w.Date >= DateOnly.FromDateTime(startDate.Value));
        }
        
        if (endDate.HasValue)
        {
            query = query.Where(w => w.Date <= DateOnly.FromDateTime(endDate.Value));
        }
        
        var forecasts = await query
            .OrderBy(w => w.Date)
            .Take(Math.Min(limit, 100))
            .ToListAsync();
        
        return Ok(forecasts.Select(f => new WeatherForecastDTO
        {
            Date = f.Date,
            TemperatureC = f.TemperatureC,
            TemperatureF = f.TemperatureF,
            Summary = f.Summary
        }).ToArray());
    }
}