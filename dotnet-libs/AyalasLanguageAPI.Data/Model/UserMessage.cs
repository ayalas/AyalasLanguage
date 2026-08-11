using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Data.Model
{
    public class UserMessage
    {
        [Key]
        public int UserMessageId { get; set; }
        [Required]
        public int FromUserId { get; set; }
        public virtual User FromUser { get; set; } = null!;

        [Required]
        public int ToUserContactId { get; set; }
        public virtual UserContact ToUserContact { get; set; } = null!;

        public int? LearningPathId { get; set; }= null!;
        public virtual LearningPath LearningPath { get; set; } = null!;

        [Required, StringLength(20000)]
        public string Message { get; set; } = null!;
    }
}