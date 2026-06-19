using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Data.Model;

public class UserProgress
{
    [Required]
    public int LearningPathId { get; set; }
    public virtual LearningPath LearningPath { get; set; } = null!;

    [Required]
    public int UserId { get; set; }
    public virtual User User { get; set; } = null!;

    public int? ExerciseId { get; set; }= null!;
    [DeleteBehavior(DeleteBehavior.Cascade)]
    public virtual Exercise Exercise { get; set; } = null!;

    public bool practiseMistakesInThisPath { get; set; } = false;
}