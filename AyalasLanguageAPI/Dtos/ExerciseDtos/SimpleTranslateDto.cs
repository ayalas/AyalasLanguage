using System;

namespace AyalasLanguageAPI.Dtos.ExerciseDtos;

public class SimpleTranslateDto
{
    public string TargetText { get; set; } = null!;
    public string KnownText { get; set; } = null!;
}
