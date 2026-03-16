namespace Trackr.API.Models;

public class SavedJob
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
