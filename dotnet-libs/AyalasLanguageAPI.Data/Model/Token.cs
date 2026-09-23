using System;
using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Data.Model;

public class Token
{
    [Key]
    public int TokenId { get; set; }

    [Required]
    public int UserId { get; set; }
    public virtual User User { get; set; } = null!;

    public byte AppId { get; set; } = 0;

    /// <summary>
    /// Hex-encoded SHA-256 hash of the bearer/cookie token.
    /// </summary>
    [Required, StringLength(64)]
    public string TokenHash { get; set; } = null!;

    [StringLength(256)]
    public string? UserAgent { get; set; }

    public DateTime ExpiresOn { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }
}