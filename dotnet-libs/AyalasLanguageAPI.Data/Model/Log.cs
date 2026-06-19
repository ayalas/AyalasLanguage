using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Data.Model
{
    [Index(nameof(LogType), Name = "IX_Log_Log_Type")]
    public class Log
    {
        [Key]
        public int LogId { get; set; }
        public int LogType { get; set; }
        public int? UserId { get; set; }
        public virtual User? User { get; set; }
        [Required, StringLength(8000)]
        public string? Description { get; set; }
        public DateTime CreatedOn {get; set;} = DateTime.UtcNow;
    }
}