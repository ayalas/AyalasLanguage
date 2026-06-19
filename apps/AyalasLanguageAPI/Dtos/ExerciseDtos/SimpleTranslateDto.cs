using System;

namespace AyalasLanguageAPI.Dtos.ExerciseDtos;

public class SimpleTranslateDto
{
    public string First { get; set; } = null!;
    public string Second { get; set; } = null!;
    public string[] Alternatives { get; set; } = null!;
}
