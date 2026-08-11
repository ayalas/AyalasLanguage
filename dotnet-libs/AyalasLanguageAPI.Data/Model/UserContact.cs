using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AyalasLanguageAPI.Data.Model
{
    public class UserContact
    {
        [Key]
        public int UserContactId { get; set; }
        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        [Required]
        public int ContactUserId { get; set; }
        public virtual User ContactUser { get; set; } = null!;

        [Required, StringLength(200)]
        public string  ContactName { get; set; } = null!;

        [StringLength(500)]
        public string? Notes { get; set; } = null;
    }
}