using System;

namespace AyalasLanguageAPI.Model;

public class UserExerciseType
{
    public int UserId { get; set; }
    public virtual User User { get; set; } = null!;
    public int ExerciseTypeId { get; set; }
    public virtual ExerciseType ExerciseType { get; set; } = null!;
}
