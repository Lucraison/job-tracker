namespace Trackr.API.Models;

public class Application
{
    public int Id { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = "applied"; // applied, interview, offer, rejected
    public string? Url { get; set; }
    public string? Notes { get; set; }
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
