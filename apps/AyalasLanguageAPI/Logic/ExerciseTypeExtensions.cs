using System;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;

namespace AyalasLanguageAPI.Logic;

internal static class ExerciseTypeExtensions
{
    public static bool SupportsAlternativeAnswers(this ExerciseTypesEnum type) => type switch
    {
        ExerciseTypesEnum.FromKnownToTarget => true,
        ExerciseTypesEnum.FromTargetToKnown => true,
        ExerciseTypesEnum.FromKnownToTargetBucket => true,
        ExerciseTypesEnum.CommonResponses => true,
        ExerciseTypesEnum.FromTargetToKnownBucket => true,
        _ => false
    };

    public static bool HasExtraOptions(this ExerciseTypesEnum type) => type switch
    {
        ExerciseTypesEnum.CommonResponsesBucket => true,
        ExerciseTypesEnum.FromKnownToTargetBucket => true,
        ExerciseTypesEnum.FromTargetToKnownBucket => true,
        _ => false
    };

    public static string ExtraOptionsSeparator(this ExerciseTypesEnum type) => type switch
    {
        ExerciseTypesEnum.CommonResponsesBucket => ",",
        ExerciseTypesEnum.FromKnownToTargetBucket => " ",
        ExerciseTypesEnum.FromTargetToKnownBucket => " ",
        _ => throw new ArgumentOutOfRangeException(nameof(type))
    };
}
