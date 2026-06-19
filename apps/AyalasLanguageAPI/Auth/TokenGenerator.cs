using System.Security.Cryptography;

namespace AyalasLanguageAPI.Auth;

public static class TokenGenerator
{
    public static string GenerateToken()
    {
        return RandomNumberGenerator.GetHexString(512);
    }
}
