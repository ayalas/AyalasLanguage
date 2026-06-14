using System;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;

namespace AyalasLanguageAPI.Logic;

public static class ExerciseTypeExtensions
{
    public static bool SupportsAlternativeAnswers(this ExerciseTypesEnum type) => type switch
    {
        ExerciseTypesEnum.FromKnownToTarget => true,
        ExerciseTypesEnum.FromTargetToKnown => true,
        ExerciseTypesEnum.CommonResponses => true,
        _ => false
    };

    public static bool HasExtraOptions(this ExerciseTypesEnum type) => type switch
    {
        ExerciseTypesEnum.CommonResponsesBucket => true,
        ExerciseTypesEnum.FromKnownToTargetBucket => true,
        _ => false
    };

    public static string ExtraOptionsSeparator(this ExerciseTypesEnum type) => type switch
    {
        ExerciseTypesEnum.CommonResponsesBucket => ",",
        ExerciseTypesEnum.FromKnownToTargetBucket => " ",
        _ => throw new ArgumentOutOfRangeException(nameof(type))
    };
}
