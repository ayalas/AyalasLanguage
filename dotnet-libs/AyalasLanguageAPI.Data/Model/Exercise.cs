using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Data.Model
{
    public class Exercise
    {
        [Key]
        public int ExerciseId { get; set; }

        [Required]
        public int TargetLanguageId { get; set; }
        public virtual Language TargetLanguage { get; set; } = null!;
        [Required]
        public int KnownLanguageId { get; set; }
        public virtual Language KnownLanguage { get; set; } = null!;

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

        public byte Status { get; set; } = 0;
        public int? SourceExerciseId { get; set; }
        [DeleteBehavior(DeleteBehavior.SetNull)]
        public virtual Exercise? SourceExercise { get; set; }
        public virtual ICollection<Exercise> ChildExercises { get; set; } = new List<Exercise>();
        public DateTime CreatedOn {get; set;} = DateTime.UtcNow;
    }
}