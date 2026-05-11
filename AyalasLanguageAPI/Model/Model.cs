using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AyalasLanguageAPI.Model
{
    public class Language
    {
        [Key]
        public int LanguageId { get; set; }

        [Required, StringLength(128)]
        public string EnglishName { get; set; } = null!;

        [StringLength(128)]
        public string? NativeName { get; set; }

        // Navigation properties
        public virtual ICollection<UserLanguage> UserLanguages { get; set; } = new List<UserLanguage>();
        public virtual ICollection<LearningPath> LearningPaths { get; set; } = new List<LearningPath>();
    }

    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required, StringLength(128)]
        public string DisplayName { get; set; } = null!;

        [Required, StringLength(128)]
        public string UserName { get; set; } = null!;

        [Required, StringLength(1024)]
        public string PasswordHash { get; set; } = null!;

        [Required]
        public byte Role { get; set; }

        // Navigation properties
        public virtual ICollection<UserLanguage> UserLanguages { get; set; } = new List<UserLanguage>();
        public virtual ICollection<LearningPath> LearningPaths { get; set; } = new List<LearningPath>();
    }

    public class UserLanguage
    {
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public int LanguageId { get; set; }
        public virtual Language Language { get; set; } = null!;

        [Required]
        public bool IsLearning { get; set; }
    }

    public class ExerciseType
    {
        [Key]
        public int ExerciseTypeId { get; set; }

        [Required, StringLength(128)]
        public string Name { get; set; } = null!;
    }

    public class LearningPath
    {
        [Key]
        public int LearningPathId { get; set; }

        [Required]
        public uint Level { get; set; }

        [Required]
        public byte Chapter { get; set; }

        [StringLength(128)]
        public string? Name { get; set; }

        public int? PrevLearningPathId { get; set; }
        public virtual LearningPath? PrevLearningPath { get; set; }

        public int? NextLearningPathId { get; set; }
        public virtual LearningPath? NextLearningPath { get; set; }

        [Required]
        public int LanguageId { get; set; }
        public virtual Language Language { get; set; } = null!;

        [Required]
        public byte Status { get; set; }

        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
    }

    public class Exercise
    {
        [Key]
        public int ExerciseId { get; set; }

        [Required]
        public int LanguageId { get; set; }
        public virtual Language Language { get; set; } = null!;

        public int? LearningPathId { get; set; }
        public virtual LearningPath? LearningPath { get; set; }

        [Required]
        public int ExerciseTypeId { get; set; }
        public virtual ExerciseType ExerciseType { get; set; } = null!;

        [Required, StringLength(8192)]
        public string Data { get; set; } = null!;

        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
    }

    public class UserProgress
    {
        public int LanguageId { get; set; }
        public virtual Language Language { get; set; } = null!;

        public int LearningPathId { get; set; }
        public virtual LearningPath LearningPath { get; set; } = null!;

        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public byte Status { get; set; } = 0; // 0: current, 1: done
    }
}