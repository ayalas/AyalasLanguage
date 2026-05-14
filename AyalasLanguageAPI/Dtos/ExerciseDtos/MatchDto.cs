using System;

namespace AyalasLanguageAPI.Dtos.ExerciseDtos;

public class MatchDto
{
    public MatchItemDto[] Items { get; set; } = null!;
}

public class MatchItemDto
{
    public string TargetText { get; set; } = null!;
    public string KnownText { get; set; } = null!;
}
