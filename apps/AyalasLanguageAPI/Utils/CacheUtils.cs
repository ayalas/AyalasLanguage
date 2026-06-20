using AyalasLanguageAPI.Data;
using Microsoft.Extensions.Caching.Memory;

namespace AyalasLanguageAPI.Utils
{
    public class ProtectByCountCache
    {
        public required DateTime ExpiresOn { get; set; }
        public required int Counter { get; set; }
    }

    internal static class CacheUtils
    {
        public static async Task<T?> GetAppDataFromCache<T>(this AyalasLanguageDbContext db, string cacheKey, IMemoryCache cache, Func<AyalasLanguageDbContext, Task<T>> getDataCallback)
        {
            if (cache.TryGetValue(cacheKey, out T? dataFromCache))
            {
                if (dataFromCache != null) {
                    return dataFromCache;
                }
            }
            
            if (getDataCallback != null)
            {
                T? dataFromCallback = await getDataCallback(db);

                DateTime dtNow = DateTime.UtcNow;
                var expires = dtNow.AddMinutes(Constants.APP_DATA_CACHE_MINUTES);
                cache.Set(cacheKey, dataFromCallback, expires - dtNow);

                return dataFromCallback;
            }
            
            return default;
        }
        public static bool ProtectByCacheCount(string cacheKey, IMemoryCache cache, int maxCount)
        {
            if (cache.TryGetValue(cacheKey, out ProtectByCountCache? objCountProtection))
            {
                if (objCountProtection != null && objCountProtection.Counter > maxCount)
                {
                    return false;
                }
            }
            return true;
        }

        public static void AddToCountProtection(string cacheKey, IMemoryCache cache, int minutesExpiration)
        {
            DateTime dtNow = DateTime.UtcNow;
            if (cache.TryGetValue(cacheKey, out ProtectByCountCache? objCountProtection) && objCountProtection != null)
            {               
                if (objCountProtection.ExpiresOn.CompareTo(dtNow) > 0)
                {
                    objCountProtection.Counter = objCountProtection.Counter + 1;
                    cache.Set(cacheKey, objCountProtection, objCountProtection.ExpiresOn - dtNow);
                }
            }
            else
            {
                var expires = DateTime.UtcNow.AddMinutes(minutesExpiration);
                cache.Set(cacheKey, new ProtectByCountCache
                {
                    Counter = 1,
                    ExpiresOn = expires
                }, expires - dtNow);
            }
        }
    }
}