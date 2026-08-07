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
        ExerciseTypesEnum.CommonResponsesBucket or
        ExerciseTypesEnum.FromKnownToTargetBucket or
        ExerciseTypesEnum.FromTargetToKnownBucket or 
        ExerciseTypesEnum.FromKnownToTarget1Click or 
        ExerciseTypesEnum.FromTargetToKnown1Click => true,
        _ => false
    };

    public static string ExtraOptionsSeparator(this ExerciseTypesEnum type) => type switch
    {
        ExerciseTypesEnum.CommonResponsesBucket 
        or ExerciseTypesEnum.FromKnownToTarget1Click
        or ExerciseTypesEnum.FromTargetToKnown1Click
        => ",",
        ExerciseTypesEnum.FromKnownToTargetBucket => " ",
        ExerciseTypesEnum.FromTargetToKnownBucket => " ",
        _ => throw new ArgumentOutOfRangeException(nameof(type))
    };

    public static bool FirstIsArray(this ExerciseTypesEnum exType) => exType switch
    {
        ExerciseTypesEnum.Matching or ExerciseTypesEnum.MatchingToSpoken => true,
        _ => false,
    };

    public static bool SecondIsArray(this ExerciseTypesEnum exType) => exType switch
    {
        ExerciseTypesEnum.Matching or ExerciseTypesEnum.MatchingToSpoken
        or ExerciseTypesEnum.CommonResponsesBucket
        or ExerciseTypesEnum.FromKnownToTarget1Click
        or ExerciseTypesEnum.FromTargetToKnown1Click
        => true,
        _ => false,
    };
}
