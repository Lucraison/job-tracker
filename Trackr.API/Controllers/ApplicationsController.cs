using System.ComponentModel.DataAnnotations;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Trackr.API.Data;
using Trackr.API.Models;

namespace Trackr.API.Controllers;

[ApiController]
[Route("api/applications")]
[Authorize]
public class ApplicationsController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static ApplicationDto ToDto(Application app) => new()
    {
        Id = app.Id,
        Company = app.Company,
        Role = app.Role,
        Status = app.Status,
        Url = app.Url,
        Notes = app.Notes,
        AppliedAt = app.AppliedAt
    };

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] string? sort,
        [FromQuery] string? dir,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = db.Applications.Where(a => a.UserId == UserId && a.DeletedAt == null);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(a => a.Company.Contains(search) || a.Role.Contains(search));

        bool descending = dir?.ToLower() != "asc";
        query = sort?.ToLower() switch
        {
            "company" => descending ? query.OrderByDescending(a => a.Company) : query.OrderBy(a => a.Company),
            "role"    => descending ? query.OrderByDescending(a => a.Role)    : query.OrderBy(a => a.Role),
            "status"  => descending ? query.OrderByDescending(a => a.Status)  : query.OrderBy(a => a.Status),
            _         => descending ? query.OrderByDescending(a => a.AppliedAt) : query.OrderBy(a => a.AppliedAt)
        };

        var total = await query.CountAsync();
        var apps = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(total / (double)pageSize),
            items = apps.Select(ToDto)
        });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        var apps = await db.Applications
            .Where(a => a.UserId == UserId && a.DeletedAt == null)
            .OrderByDescending(a => a.AppliedAt)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Company,Role,Status,Applied,URL,Notes");
        foreach (var app in apps)
        {
            sb.AppendLine($"\"{app.Company}\",\"{app.Role}\",\"{app.Status}\",\"{app.AppliedAt:yyyy-MM-dd}\",\"{app.Url}\",\"{app.Notes?.Replace("\"", "\"\"")}\"");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", "applications.csv");
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var app = await db.Applications.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId && a.DeletedAt == null);
        if (app == null) return NotFound();
        return Ok(ToDto(app));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ApplicationRequest req)
    {
        var app = new Application
        {
            Company = req.Company,
            Role = req.Role,
            Status = req.Status ?? "applied",
            Url = req.Url,
            Notes = req.Notes,
            UserId = UserId
        };
        db.Applications.Add(app);
        await db.SaveChangesAsync();
        return Ok(ToDto(app));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ApplicationRequest req)
    {
        var app = await db.Applications.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId && a.DeletedAt == null);
        if (app == null) return NotFound();

        app.Company = req.Company;
        app.Role = req.Role;
        app.Status = req.Status ?? app.Status;
        app.Url = req.Url;
        app.Notes = req.Notes;

        await db.SaveChangesAsync();
        return Ok(ToDto(app));
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusRequest req)
    {
        var app = await db.Applications.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId && a.DeletedAt == null);
        if (app == null) return NotFound();

        app.Status = req.Status;
        await db.SaveChangesAsync();
        return Ok(ToDto(app));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var app = await db.Applications.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId && a.DeletedAt == null);
        if (app == null) return NotFound();

        app.DeletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var apps = await db.Applications
            .Where(a => a.UserId == UserId && a.DeletedAt == null)
            .ToListAsync();

        return Ok(new
        {
            total = apps.Count,
            applied = apps.Count(a => a.Status == "applied"),
            interview = apps.Count(a => a.Status == "interview"),
            offer = apps.Count(a => a.Status == "offer"),
            rejected = apps.Count(a => a.Status == "rejected")
        });
    }
}

public class ApplicationRequest
{
    [Required, MaxLength(100)]
    public string Company { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Role { get; set; } = string.Empty;

    [RegularExpression("^(applied|interview|offer|rejected)$", ErrorMessage = "Status must be: applied, interview, offer, or rejected")]
    public string? Status { get; set; }

    public string? Url { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class StatusRequest
{
    [Required]
    [RegularExpression("^(applied|interview|offer|rejected)$", ErrorMessage = "Status must be: applied, interview, offer, or rejected")]
    public string Status { get; set; } = string.Empty;
}
