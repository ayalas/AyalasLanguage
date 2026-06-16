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