using System;

namespace AyalasLanguageAPI.Dtos.ExerciseDtos;

public class FillInTheBlanksDto
{
    public string TargetText { get; set; } = null!;
    public string[] Replacements { get; set; } = null!;
}
