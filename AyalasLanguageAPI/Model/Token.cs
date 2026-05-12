using System;
using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Model;

public class Token
{
        [Key]
        public int TokenId { get; set; }
        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        [Required, StringLength(1024)]
        public string Content { get; set; } = null!;
        public DateTime ExpiresOn { get; set; }
}
