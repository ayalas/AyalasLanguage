using System;
using AyalasLanguageAPI.Data;
using Microsoft.AspNetCore.Authentication;

namespace AyalasLanguageAPI.Auth;

public class CacheAuthOptions : AuthenticationSchemeOptions
{
    public string CookieName { get; set; } = Constants.APP_COOKIE_NAME;
}
