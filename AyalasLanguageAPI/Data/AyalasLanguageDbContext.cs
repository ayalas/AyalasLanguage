using System;
using AyalasLanguageAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Data;

public class AyalasLanguageDbContext : DbContext
{
    public AyalasLanguageDbContext(DbContextOptions<AyalasLanguageDbContext> options) : base(options) { }

    public DbSet<Language> Languages { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<UserLanguage> UserLanguages { get; set; }
    public DbSet<ExerciseType> ExerciseTypes { get; set; }
    public DbSet<LearningPath> LearningPaths { get; set; }
    public DbSet<Exercise> Exercises { get; set; }
    public DbSet<UserProgress> UserProgresses { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Composite Key for UserLanguage
        modelBuilder.Entity<UserLanguage>()
            .HasKey(ul => new { ul.UserId, ul.LanguageId });

        // Composite Key for UserProgress
        modelBuilder.Entity<UserProgress>()
            .HasKey(up => new { up.UserId, up.LanguageId, up.LearningPathId });


        modelBuilder.Entity<LearningPath>()
        .HasOne(lp => lp.NextLearningPath)
        .WithOne(lp => lp.PrevLearningPath)
        .HasForeignKey<LearningPath>(lp => lp.NextLearningPathId)
        .IsRequired(false)
        .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ExerciseType>().HasData(
            new ExerciseType { ExerciseTypeId = 1, Name = "from Known to target language" },
            new ExerciseType { ExerciseTypeId = 2, Name = "from target to Known language" },
            new ExerciseType { ExerciseTypeId = 3, Name = "Fill in the Blank" },
            new ExerciseType { ExerciseTypeId = 4, Name = "Matching" },
            new ExerciseType { ExerciseTypeId = 5, Name = "from Known to target language - bucket list" }
        );

        // Seed common languages
        modelBuilder.Entity<Language>().HasData(
            new Language { LanguageId = 1, EnglishName = "English", NativeName = "English" },
            new Language { LanguageId = 2, EnglishName = "Arabic", NativeName = "العربية" },
            new Language { LanguageId = 3, EnglishName = "Danish", NativeName = "Dansk" },
            new Language { LanguageId = 4, EnglishName = "Spanish", NativeName = "Español" },
            new Language { LanguageId = 5, EnglishName = "French", NativeName = "Français" },
            new Language { LanguageId = 6, EnglishName = "German", NativeName = "Deutsch" },
            new Language { LanguageId = 7, EnglishName = "Japanese", NativeName = "日本語" },
            new Language { LanguageId = 8, EnglishName = "Mandarin Chinese", NativeName = "普通话" },
            new Language { LanguageId = 9, EnglishName = "Hindi", NativeName = "हिन्दी" },
            new Language { LanguageId = 10, EnglishName = "Portuguese", NativeName = "Português" },
            new Language { LanguageId = 11, EnglishName = "Russian", NativeName = "Русский" },
            new Language { LanguageId = 12, EnglishName = "Bengali", NativeName = "বাংলা" },
            new Language { LanguageId = 13, EnglishName = "Korean", NativeName = "한국어" },
            new Language { LanguageId = 14, EnglishName = "Italian", NativeName = "Italiano" },
            new Language { LanguageId = 15, EnglishName = "Turkish", NativeName = "Türkçe" },
            new Language { LanguageId = 16, EnglishName = "Vietnamese", NativeName = "Tiếng Việt" },
            new Language { LanguageId = 17, EnglishName = "Telugu", NativeName = "తెలుగు" },
            new Language { LanguageId = 18, EnglishName = "Marathi", NativeName = "मराठी" },
            new Language { LanguageId = 19, EnglishName = "Tamil", NativeName = "தமிழ்" },
            new Language { LanguageId = 20, EnglishName = "Urdu", NativeName = "اردو" },
            new Language { LanguageId = 21, EnglishName = "Greek", NativeName = "Ελληνικά" },
            new Language { LanguageId = 22, EnglishName = "Dutch", NativeName = "Nederlands" },
            new Language { LanguageId = 23, EnglishName = "Swedish", NativeName = "Svenska" },
            new Language { LanguageId = 24, EnglishName = "Norwegian", NativeName = "Norsk" },
            new Language { LanguageId = 25, EnglishName = "Polish", NativeName = "Polski" },
            new Language { LanguageId = 26, EnglishName = "Finnish", NativeName = "Suomi" },
            new Language { LanguageId = 27, EnglishName = "Czech", NativeName = "Čeština" },
            new Language { LanguageId = 28, EnglishName = "Hungarian", NativeName = "Magyar" },
            new Language { LanguageId = 29, EnglishName = "Thai", NativeName = "ไทย" },
            new Language { LanguageId = 30, EnglishName = "Indonesian", NativeName = "Bahasa Indonesia" },
            new Language { LanguageId = 31, EnglishName = "Romanian", NativeName = "Română" },
            new Language { LanguageId = 32, EnglishName = "Ukrainian", NativeName = "Українська" },
            new Language { LanguageId = 33, EnglishName = "Hebrew", NativeName = "עברית" },
            new Language { LanguageId = 34, EnglishName = "Malay", NativeName = "Bahasa Melayu" },
            new Language { LanguageId = 35, EnglishName = "Persian", NativeName = "فارسی" },
            new Language { LanguageId = 36, EnglishName = "Slovak", NativeName = "Slovenčina" },
            new Language { LanguageId = 37, EnglishName = "Catalan", NativeName = "Català" }
        );

        base.OnModelCreating(modelBuilder);
    }
}
