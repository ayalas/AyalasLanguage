using System.Security.Cryptography;
using Resend;

namespace AyalasLanguageAPI.Utils;

public static class Utils
{
    internal static async Task SendEmail(string to, string subject, string body, IConfiguration config, ILogger<Program> logger)
    {
        string? sender = config.GetValue<string>("EmailSettings:Sender");

        string? apiKey = config.GetValue<string>("EmailSettings:APIKey"); //use secrets manager

        if (sender == null || apiKey == null)
        {
            throw new Exception("Config error: missing Email configurations.");
        }
        IResend resend = ResendClient.Create(apiKey);

        var resp = await resend.EmailSendAsync(new EmailMessage()
        {
            From = sender,
            To = to,
            Subject = subject,
            HtmlBody = body,
        });

        //todo: log response

        //dummy send for debug
        //logger.LogTrace("Email fake send:\nTo:{To}\nFrom:{From}\nSubject:{Subject}\nContent:{Body}", to, sender, subject, body );
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