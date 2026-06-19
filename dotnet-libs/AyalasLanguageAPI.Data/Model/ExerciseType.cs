using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Data.Model
{
    public class ExerciseType
    {
        [Key]
        public int ExerciseTypeId { get; set; }

        [Required, StringLength(128)]
        public string Name { get; set; } = null!;
    }
}