using System.Security.Cryptography;

namespace AyalasLanguageAPI.Utils;
public static class Utils
{
    internal static async Task SendEmail(string to, string subject, string body, IConfiguration config, ILogger<Program> logger)
    {
        string? sender = config.GetValue<string>("EmailSettings:Sender");
        
        if (sender == null)
        {
            throw new Exception("Config error: missing EmailConfirmation configurations.");
        }
        //todo: implement
        logger.LogTrace("Email fake send:\nTo:{To}\nFrom:{From}\nSubject:{Subject}\nContent:{Body}", to, sender, subject, body );
    }

    public static (string RawToken, string HashedToken) GenerateToken()
    {
        // 1. Generate a cryptographically secure random byte array
        byte[] tokenBytes = new byte[64];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }

        // 2. Convert to a URL-safe Base64 string
        string rawToken = Convert.ToBase64String(tokenBytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('='); // Removes the padding character

        // 3. Hash the raw token for safe database storage (using BCrypt)
        string hashedToken = BCrypt.Net.BCrypt.HashPassword(rawToken);

        return (rawToken, hashedToken);
    }
}