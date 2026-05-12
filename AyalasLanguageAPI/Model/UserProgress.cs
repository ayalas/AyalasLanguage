namespace AyalasLanguageAPI.Model;

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