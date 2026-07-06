using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Data.Model
{
    public class Job
    {
        [Key]
        public int JobId { get; set; }

        [Required]
        public byte JobType { get; set; }

        [Required]
        public byte JobStatus { get; set; }

        public int? MainRecordId { get; set; }= null!;
        public int? SecondaryRecordId { get; set; }= null!;

        [StringLength(512)]
        public string? ExtraData { get; set; }= null!;
        public int Completed { get; set; }= 0;
        public int Errors { get; set; }= 0;
        public int? LeftToProcess { get; set; }= null!;

        [StringLength(8000)]
        public string? FirstError {get; set;}= null!;
        public DateTime CreatedOn {get; set;} = DateTime.UtcNow;
        public DateTime ModifiedOn {get; set;} = DateTime.UtcNow;
    }
}