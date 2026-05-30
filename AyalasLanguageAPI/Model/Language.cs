using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Model
{
    public class Language
    {
        [Key]
        public int LanguageId { get; set; }

        [Required, StringLength(128)]
        public string EnglishName { get; set; } = null!;

        [StringLength(128)]
        public string? NativeName { get; set; }

        [StringLength(5)]
        public string? Code { get; set; }

        public bool IsRightToLeft { get; set; } = false;

        // Navigation properties
        public virtual ICollection<UserLanguage> UserLanguages { get; set; } = new List<UserLanguage>();

    }
}