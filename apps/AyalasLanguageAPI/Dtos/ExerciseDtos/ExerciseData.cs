using System;

namespace AyalasLanguageAPI.Dtos.ExerciseDtos;

public class ExerciseData : SimpleTranslateDto
{
    public string? ExtraOptions { get; set; } = null!;
    public string? Translation { get; set; } = null!;
}
