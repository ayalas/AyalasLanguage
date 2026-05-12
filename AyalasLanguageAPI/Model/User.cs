using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Model
{
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

        public int? TargetLanguageId { get; set; }
        public virtual Language? TargetLanguage { get; set; }

        public int? KnownLanguageId { get; set; }
        public virtual Language? KnownLanguage { get; set; }

        // Navigation properties
        public virtual ICollection<UserLanguage> UserLanguages { get; set; } = new List<UserLanguage>();
        public virtual ICollection<LearningPath> LearningPaths { get; set; } = new List<LearningPath>();
        public virtual ICollection<UserExerciseType> UserExerciseTypes { get; set; } = new List<UserExerciseType>();
    }
}