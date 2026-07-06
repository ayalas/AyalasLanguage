using System;
using AyalasLanguageAPI.Data.Model;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Data;

public class AyalasLanguageDbContext : DbContext
{
    public AyalasLanguageDbContext(DbContextOptions<AyalasLanguageDbContext> options) : base(options) { }

    public DbSet<Language> Languages { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Token> Tokens { get; set; }
    public DbSet<UserLanguage> UserLanguages { get; set; }
    public DbSet<ExerciseType> ExerciseTypes { get; set; }
    public DbSet<LearningPath> LearningPaths { get; set; }
    public DbSet<Exercise> Exercises { get; set; }
    public DbSet<UserProgress> UserProgresses { get; set; }
    public DbSet<UserExerciseType> UserExerciseTypes { get; set; }
    public DbSet<ContactUs> ContactUs { get; set; }
    public DbSet<Log> Logs { get; set; }

    public DbSet<Job> Jobs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Composite Key for UserLanguage
        modelBuilder.Entity<UserLanguage>()
            .HasKey(ul => new { ul.UserId, ul.LanguageId });

        modelBuilder.Entity<UserExerciseType>()
            .HasKey(ul => new { ul.UserId, ul.ExerciseTypeId });

        // Composite Key for UserProgress
        modelBuilder.Entity<UserProgress>()
            .HasKey(up => new { up.UserId, up.LearningPathId });

        modelBuilder.Entity<LearningPath>()
            .HasIndex(p => new { p.KnownLanguageId, p.TargetLanguageId, p.Level, p.Chapter });

        modelBuilder.Entity<ExerciseType>().HasData(
            new ExerciseType { ExerciseTypeId = (int)ExerciseTypesEnum.FromKnownToTarget, Name = "From known to target language" },
            new ExerciseType { ExerciseTypeId = (int)ExerciseTypesEnum.FromTargetToKnown, Name = "From target to known language" },
            new ExerciseType { ExerciseTypeId = (int)ExerciseTypesEnum.FillInTheBlanks, Name = "Fill in the blank" },
            new ExerciseType { ExerciseTypeId = (int)ExerciseTypesEnum.Matching, Name = "Matching" },
            new ExerciseType { ExerciseTypeId = (int)ExerciseTypesEnum.FromKnownToTargetBucket, Name = "From known to target language - bucket list" },
            new ExerciseType { ExerciseTypeId = (int)ExerciseTypesEnum.CommonResponsesBucket, Name = "Common responses - bucket list" },
            new ExerciseType { ExerciseTypeId = (int)ExerciseTypesEnum.CommonResponses, Name = "Common responses" },
            new ExerciseType { ExerciseTypeId = (int)ExerciseTypesEnum.FromTargetToKnownBucket, Name = "From target to known language - bucket list" },
            new ExerciseType { ExerciseTypeId = (int)ExerciseTypesEnum.MatchingToSpoken, Name = "Matching to spoken word" }
        );

        // Seed common languages
        modelBuilder.Entity<Language>().HasData(
            new Language { LanguageId = (int)LanguageEnum.English, Code = "en", EnglishName = "English", NativeName = "English" },
            new Language { LanguageId = (int)LanguageEnum.Arabic, Code = "ar", EnglishName = "Arabic", NativeName = "العربية", IsRightToLeft = true },
            new Language { LanguageId = (int)LanguageEnum.Danish, Code = "da", EnglishName = "Danish", NativeName = "Dansk" },
            new Language { LanguageId = (int)LanguageEnum.Spanish, Code = "es", EnglishName = "Spanish", NativeName = "Español" },
            new Language { LanguageId = (int)LanguageEnum.French, Code = "fr", EnglishName = "French", NativeName = "Français" },
            new Language { LanguageId = (int)LanguageEnum.German, Code = "de", EnglishName = "German", NativeName = "Deutsch" },
            new Language { LanguageId = (int)LanguageEnum.Japanese, Code = "ja", EnglishName = "Japanese", NativeName = "日本語" },
            new Language { LanguageId = (int)LanguageEnum.MandarinChinese, Code = "zh", EnglishName = "Mandarin Chinese", NativeName = "普通话" },
            new Language { LanguageId = (int)LanguageEnum.Hindi, Code = "hi", EnglishName = "Hindi", NativeName = "हिन्दी" },
            new Language { LanguageId = (int)LanguageEnum.Portuguese, Code = "pt", EnglishName = "Portuguese", NativeName = "Português" },
            new Language { LanguageId = (int)LanguageEnum.Russian, Code = "ru", EnglishName = "Russian", NativeName = "Русский" },
            new Language { LanguageId = (int)LanguageEnum.Bengali, Code = "bn", EnglishName = "Bengali", NativeName = "বাংলা" },
            new Language { LanguageId = (int)LanguageEnum.Korean, Code = "ko", EnglishName = "Korean", NativeName = "한국어" },
            new Language { LanguageId = (int)LanguageEnum.Italian, Code = "it", EnglishName = "Italian", NativeName = "Italiano" },
            new Language { LanguageId = (int)LanguageEnum.Turkish, Code = "tr", EnglishName = "Turkish", NativeName = "Türkçe" },
            new Language { LanguageId = (int)LanguageEnum.Vietnamese, Code = "vi", EnglishName = "Vietnamese", NativeName = "Tiếng Việt" },
            new Language { LanguageId = (int)LanguageEnum.Telugu, Code = "te", EnglishName = "Telugu", NativeName = "తెలుగు" },
            new Language { LanguageId = (int)LanguageEnum.Marathi, Code = "mr", EnglishName = "Marathi", NativeName = "मराठी" },
            new Language { LanguageId = (int)LanguageEnum.Tamil, Code = "ta", EnglishName = "Tamil", NativeName = "தமிழ்" },
            new Language { LanguageId = (int)LanguageEnum.Urdu, Code = "ur", EnglishName = "Urdu", NativeName = "اردو", IsRightToLeft = true },
            new Language { LanguageId = (int)LanguageEnum.Greek, Code = "el", EnglishName = "Greek", NativeName = "Ελληνικά" },
            new Language { LanguageId = (int)LanguageEnum.Dutch, Code = "nl", EnglishName = "Dutch", NativeName = "Nederlands" },
            new Language { LanguageId = (int)LanguageEnum.Swedish, Code = "sv", EnglishName = "Swedish", NativeName = "Svenska" },
            new Language { LanguageId = (int)LanguageEnum.Norwegian, Code = "no", EnglishName = "Norwegian", NativeName = "Norsk" },
            new Language { LanguageId = (int)LanguageEnum.Polish, Code = "pl", EnglishName = "Polish", NativeName = "Polski" },
            new Language { LanguageId = (int)LanguageEnum.Finnish, Code = "fi", EnglishName = "Finnish", NativeName = "Suomi" },
            new Language { LanguageId = (int)LanguageEnum.Czech, Code = "cs", EnglishName = "Czech", NativeName = "Čeština" },
            new Language { LanguageId = (int)LanguageEnum.Hungarian, Code = "hu", EnglishName = "Hungarian", NativeName = "Magyar" },
            new Language { LanguageId = (int)LanguageEnum.Thai, Code = "th", EnglishName = "Thai", NativeName = "ไทย" },
            new Language { LanguageId = (int)LanguageEnum.Indonesian, Code = "id", EnglishName = "Indonesian", NativeName = "Bahasa Indonesia" },
            new Language { LanguageId = (int)LanguageEnum.Romanian, Code = "ro", EnglishName = "Romanian", NativeName = "Română" },
            new Language { LanguageId = (int)LanguageEnum.Ukrainian, Code = "uk", EnglishName = "Ukrainian", NativeName = "Українська" },
            new Language { LanguageId = (int)LanguageEnum.Hebrew, Code = "he", EnglishName = "Hebrew", NativeName = "עברית", IsRightToLeft = true },
            new Language { LanguageId = (int)LanguageEnum.Malay, Code = "ms", EnglishName = "Malay", NativeName = "Bahasa Melayu" },
            new Language { LanguageId = (int)LanguageEnum.Persian, Code = "fa", EnglishName = "Persian", NativeName = "فارسی", IsRightToLeft = true },
            new Language { LanguageId = (int)LanguageEnum.Slovak, Code = "sk", EnglishName = "Slovak", NativeName = "Slovenčina" },
            new Language { LanguageId = (int)LanguageEnum.Catalan, Code = "ca", EnglishName = "Catalan", NativeName = "Català" }
        );

        base.OnModelCreating(modelBuilder);
    }
}
