using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Data.Model
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

        public bool EmailConfirmed {get; set;} = false;

        public bool Use2FALogin {get; set;} = false;

        public DateTime? ConfirmationEmailSent {get; set;}

        [StringLength(1024)]
        public string? EmailConfirmationToken { get; set; } = null!;

        public DateTime? EmailConfirmationReceived {get; set;}

        [StringLength(1024)]
        public string? ForgotPasswordToken { get; set; } = null!;
        public DateTime? ForgotEmailSent {get; set;}
        public DateTime? ForgotEmailReceived {get; set;}

        public DateTime CreatedOn {get; set;} = DateTime.UtcNow;

        public bool DisablePuter {get; set;} = false;

        public byte? NumOfExercisesToGenerate {get; set;} = null!;

        // Navigation properties
        public virtual ICollection<UserLanguage> UserLanguages { get; set; } = new List<UserLanguage>();
        public virtual ICollection<LearningPath> LearningPaths { get; set; } = new List<LearningPath>();
        public virtual ICollection<UserExerciseType> UserExerciseTypes { get; set; } = new List<UserExerciseType>();
    }
}