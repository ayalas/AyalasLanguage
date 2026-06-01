using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Data.Model
{
    public class UserLanguage
    {
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public int LanguageId { get; set; }
        public virtual Language Language { get; set; } = null!;

        [Required]
        public bool IsLearning { get; set; }
    }
}