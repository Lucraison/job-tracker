namespace Trackr.API.Models;

public class ApplicationDto
{
    public int Id { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Notes { get; set; }
    public DateTime AppliedAt { get; set; }
}
