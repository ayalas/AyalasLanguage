namespace AyalasLanguageAPI.Model;

public class UserProgress
{
    public int LearningPathId { get; set; }
    public virtual LearningPath LearningPath { get; set; } = null!;

    public int UserId { get; set; }
    public virtual User User { get; set; } = null!;
}