using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Model
{
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
        public int TargetLanguageId { get; set; }
        public virtual Language TargetLanguage { get; set; } = null!;
        [Required]
        public int KnownLanguageId { get; set; }
        public virtual Language KnownLanguage { get; set; } = null!;

        [Required]
        public byte Status { get; set; }

        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public virtual ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
    }
}