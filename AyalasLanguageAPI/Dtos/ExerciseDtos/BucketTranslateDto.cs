using System;

namespace AyalasLanguageAPI.Dtos.ExerciseDtos;

public class BucketTranslateDto : SimpleTranslateDto
{
        public string ExtraOptions { get; set; } = null!;
}
