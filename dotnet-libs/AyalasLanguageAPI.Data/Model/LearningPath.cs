using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AyalasLanguageAPI.Data.Model
{
    public class LearningPath
    {
        [Key]
        public int LearningPathId { get; set; }

        [Required]
        public uint Level { get; set; }

        [Required]
        public decimal Chapter { get; set; }

        [StringLength(128)]
        public string? Name { get; set; }

        public int? PrevLearningPathId { get; set; }
        [ForeignKey(nameof(PrevLearningPathId))]
        public virtual LearningPath? PrevLearningPath { get; set; }

        public int? NextLearningPathId { get; set; }
        [ForeignKey(nameof(NextLearningPathId))]
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