using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Trackr.API.Data;
using Trackr.API.Models;

namespace Trackr.API.Controllers;

[ApiController]
[Route("api/saved-jobs")]
[Authorize]
public class SavedJobsController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var jobs = await db.SavedJobs
            .Where(j => j.UserId == UserId)
            .OrderByDescending(j => j.SavedAt)
            .ToListAsync();
        return Ok(jobs);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SavedJobRequest req)
    {
        var job = new SavedJob { Url = req.Url, Note = req.Note, UserId = UserId };
        db.SavedJobs.Add(job);
        await db.SaveChangesAsync();
        return Ok(job);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var job = await db.SavedJobs.FirstOrDefaultAsync(j => j.Id == id && j.UserId == UserId);
        if (job == null) return NotFound();
        db.SavedJobs.Remove(job);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record SavedJobRequest(string Url, string? Note);
