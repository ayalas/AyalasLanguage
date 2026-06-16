using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Data.Model
{
    public class ContactUs
    {
        [Key]
        public int ContactUsId { get; set; }

        public int? UserId { get; set; }
        public virtual User? User { get; set; }

        [Required, StringLength(128)]
        public string Email { get; set; } = null!;

        [Required, StringLength(4000)]
        public string? Message { get; set; }

        public DateTime CreatedOn {get; set;} = DateTime.UtcNow;
    }
}