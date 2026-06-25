using System;

namespace AyalasLanguageAPI.Data;

public enum UserRoleEnum
{
    Learner = 1,
    ContentCreator = 2,
    Admin = 3
}

public enum UserAccessEnum
{
    Learner = 1,
    CanEdit = 2
}

public enum ContentStatusEnum
{
    Draft = 0,
    Approved = 1,
    Removed = 2
}

public enum UserProgressEnum
{
    NotStarted = 0,
    Done = 1,
    InProgress = 2
}


public enum ExerciseTypesEnum
{
    FromKnownToTarget = 1,
    FromTargetToKnown = 2,
    FillInTheBlanks = 3,
    Matching = 4,
    FromKnownToTargetBucket = 5,
    CommonResponsesBucket = 6,
    CommonResponses = 7,
    FromTargetToKnownBucket = 8,
    MatchingToSpoken = 9
}

public enum DashboardRangeFilter {
    AllTime = 0,
    LastDay = 1,
    SevenDays = 2,
    ThirtyDays = 3
}

public enum LogTypeEnum
{
    AutoAIFailure = 1,
    ExerciseDataValidationFailed = 2
}

public enum LanguageEnum
{
    English = 1,
    Arabic = 2,
    Danish = 3,
    Spanish = 4,
    French = 5,
    German = 6,
    Japanese = 7,
    MandarinChinese = 8,
    Hindi = 9,
    Portuguese = 10,
    Russian = 11,
    Bengali = 12,
    Korean = 13,
    Italian = 14,
    Turkish = 15,
    Vietnamese = 16,
    Telugu = 17,
    Marathi = 18,
    Tamil = 19,
    Urdu = 20,
    Greek = 21,
    Dutch = 22,
    Swedish = 23,
    Norwegian = 24,
    Polish = 25,
    Finnish = 26,
    Czech = 27,
    Hungarian = 28,
    Thai = 29,
    Indonesian = 30,
    Romanian = 31,
    Ukrainian = 32,
    Hebrew = 33,
    Malay = 34,
    Persian = 35,
    Slovak = 36,
    Catalan = 37
}

public static class Constants
{
    public const string BLANKS = "___";
    public const int PAGE_SIZE = 100;
    public const int MATCH_MIN_COUNT = 5;
    public const int MATCH_MAX_COUNT = 8;
    public const int BUCKET_EXTRA_MIN_COUNT = 1;
    public const int BUCKET_EXTRA_MAX_COUNT = 5;

    //cache protections
    public const string LANGUAGE_SET_CACHE_KEY = "LanguageSet";
    public const int APP_DATA_CACHE_MINUTES = 240;
    public const int CACHE_PROTECTION_MINUTES = 1440;
    public const int MAX_MESSAGE_PUBLIC_CONTACT_US = 500;
    
    public const string CONTACT_US_COUNT_CACHE_KEY = "ContactUsCountPerPeriod";
    public const int MAX_CONTACT_US_PER_PERIOD = 500;

    public const string UNCONFIRMED_ACCOUNT_CHANGE_COUNT_CACHE_KEY = "UnconfirmAccountChangeCountPerPeriod";
    public const string REGISTER_COUNT_CACHE_KEY = "RegisterCountPerPeriod";
    public const int MAX_REGISTER_PER_PERIOD = 1000;

    public const string LOG_COUNT_CACHE_KEY = "LogCountPerPeriod";
    public const int MAX_LOG_PER_PERIOD = 100;


    public const string LOGIN_COUNT_CACHE_KEY = "LoginCountPerPeriod";
    
    public const int MAX_LOGIN_PER_PERIOD = 10000;

    public const string ADMIN_LOGIN_COUNT_CACHE_KEY = "AdminLoginCountPerPeriod";
    public const int MAX_ADMIN_LOGIN_PER_PERIOD = 50;

    public const string FORGOT_COUNT_CACHE_KEY = "ForgotCountPerPeriod";
    public const int MAX_FORGOT_PER_PERIOD = 75;
    

    public const int VERIFY2FA_TOKEN_EXPIRES_MINUTES = 10;
    public const int VERIFY2FA_TOKEN_MAX_RETRY = 2; //in-memoty defence mechanism
    
    //2FA code

    public const int MIN_2FA_CODE = 100000;
    public const int MAX_2FA_CODE = 999999;

    
    //Brand
    public const string BRAND_NAME = "langapp.xyz";
    public const string APP_COOKIE_NAME = "LangAppXyzCookie";
    public const string ADMIN_APP_COOKIE_NAME = "AdminLangAppXyzCookie";

    public const string CONFIG_BYPASS_SECURE_COOKIES_KEY = "BypassSecureCookies";

    //links in emails
    public const string CLIENT_RELATIVE_PATH_CONFIRM_EMAIL = "confirm/";
    public const string CLIENT_RELATIVE_PATH_RESET_PASSWORD = "reset/";
}
