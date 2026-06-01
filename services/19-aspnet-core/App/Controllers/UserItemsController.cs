using System.Security.Claims;
using App.Data;
using App.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("users/me/items")]
[Authorize]
public class UserItemsController(AppDbContext db) : ControllerBase
{
    // GET /users/me/items
    [HttpGet]
    public async Task<IActionResult> GetItems(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var items = await db.Items
            .AsNoTracking()
            .Where(i => i.UserId == userId.Value)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new ItemResponse(i.Id, i.Title, i.Description, i.UserId, i.CreatedAt, i.UpdatedAt))
            .ToListAsync(ct);

        return Ok(items);
    }

    // POST /users/me/items
    [HttpPost]
    public async Task<IActionResult> CreateItem([FromBody] CreateItemRequest? req, CancellationToken ct)
    {
        if (req is null || string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Title is required." });

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var item = new Item
        {
            Title = req.Title.Trim(),
            Description = req.Description?.Trim(),
            UserId = userId.Value,
        };

        db.Items.Add(item);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(
            nameof(GetItem),
            new { id = item.Id },
            new ItemResponse(item.Id, item.Title, item.Description, item.UserId, item.CreatedAt, item.UpdatedAt));
    }

    // GET /users/me/items/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetItem(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var item = await db.Items
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId.Value, ct);

        if (item is null) return NotFound();

        return Ok(new ItemResponse(item.Id, item.Title, item.Description, item.UserId, item.CreatedAt, item.UpdatedAt));
    }

    // PUT /users/me/items/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateItemRequest? req, CancellationToken ct)
    {
        if (req is null) return BadRequest(new { error = "Request body is required." });

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var item = await db.Items
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId.Value, ct);

        if (item is null) return NotFound();

        if (req.Title is not null)
        {
            if (string.IsNullOrWhiteSpace(req.Title))
                return BadRequest(new { error = "Title cannot be empty." });
            item.Title = req.Title.Trim();
        }

        if (req.Description is not null)
            item.Description = req.Description.Trim();

        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(new ItemResponse(item.Id, item.Title, item.Description, item.UserId, item.CreatedAt, item.UpdatedAt));
    }

    // DELETE /users/me/items/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var item = await db.Items
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId.Value, ct);

        if (item is null) return NotFound();

        db.Items.Remove(item);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    private Guid? GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}

// ---- DTOs ----

public record CreateItemRequest(string? Title, string? Description);

public record UpdateItemRequest(string? Title, string? Description);

public record ItemResponse(
    Guid Id,
    string Title,
    string? Description,
    Guid UserId,
    DateTime CreatedAt,
    DateTime UpdatedAt);
