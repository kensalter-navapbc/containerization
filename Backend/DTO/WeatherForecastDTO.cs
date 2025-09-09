using System.ComponentModel.DataAnnotations;

public class WeatherForecastDTO
{
    
    [Required]
    public DateOnly Date { get; set; }
    
    [Required]
    public int TemperatureC { get; set; }
    
    [Required]
    public int TemperatureF { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Summary { get; set; } = string.Empty;
    
}