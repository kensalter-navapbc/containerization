using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("WeatherForecast")]
public class WeatherForecast
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public DateOnly Date { get; set; }
    
    [Required]
    public int TemperatureC { get; set; }
    
    [Required]
    public int TemperatureF { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Summary { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime UpdatedAt { get; set; }
}