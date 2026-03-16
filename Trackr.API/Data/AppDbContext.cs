using Microsoft.EntityFrameworkCore;
using Trackr.API.Models;

namespace Trackr.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
}
