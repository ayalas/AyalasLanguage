using System;
using System.Security.Cryptography;
using System.Text;

namespace AyalasLanguageAPI.Auth;

public static class TokenGenerator
{
    /// <summary>
    /// Generates a cryptographically strong 256-bit URL-safe token.
    /// </summary>
    public static string GenerateToken()
    {
        byte[] bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Computes a deterministic SHA-256 hex string representation of the token for storage/lookup.
    /// </summary>
    public static string HashToken(string token)
    {
        byte[] inputBytes = Encoding.UTF8.GetBytes(token);
        byte[] hashBytes = SHA256.HashData(inputBytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}