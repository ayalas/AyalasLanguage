using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

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
        public int ToUserId { get; set; }
        public virtual User ToUser { get; set; } = null!;

        public int? LearningPathId { get; set; }= null!;
        [DeleteBehavior(DeleteBehavior.SetNull)]
        public virtual LearningPath LearningPath { get; set; } = null!;

        [Required, StringLength(20000)]
        public string Message { get; set; } = null!;

        public int? InResponseToUserMessageId { get; set; }= null!;
        [DeleteBehavior(DeleteBehavior.SetNull)]
        public virtual UserMessage InResponseToUserMessage { get; set; }= null!;

        public bool Read { get; set; } = false;

        [Required]
        public DateTime SendDate {get; set;}

        public DateTime? ReadDate {get; set;}= null!;
    }
}