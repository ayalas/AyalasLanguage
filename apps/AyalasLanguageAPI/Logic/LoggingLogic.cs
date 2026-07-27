using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using AyalasLanguageAPI.DTOs;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.EntityFrameworkCore;
using AyalasLanguageAPI.Data.Logging;
using Microsoft.AspNetCore.Components.Server;

namespace AyalasLanguageAPI.Logic;

internal static class LoggingLogic
{
    internal static async Task CreateLogInternal<T>(this AyalasLanguageDbContext db, int userId, LogTypeEnum logType, T obj)
    {
        if (obj is LoggingBase baseLog && baseLog.CallStack == string.Empty)
        {
            baseLog.CallStack = Environment.StackTrace;
        }

        var desc = System.Text.Json.JsonSerializer.Serialize<T>(obj);
        desc = desc.Replace("\\u0022", "");
        desc = desc.Replace("\\u00601", "");

        Log rec = new()
        {
            UserId = userId,
            LogType = (int)logType,
            Description = desc
        };
        db.Logs.Add(rec);
        await db.SaveChangesAsync();
    }
}