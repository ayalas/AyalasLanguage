using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using AyalasLanguageAPI.DTOs;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.EntityFrameworkCore;
using AyalasLanguageAPI.Data.Logging;
using Microsoft.AspNetCore.Components.Server;

namespace AyalasLanguageAPI.Logic;

internal static class ContentCreatorLogic
{
    public static void AddAlternativesToExercise(Exercise targetExercise, string[] addedAlternativesArr, string[] removedAlternativesArr)
    {
        var dtoSimple2 = System.Text.Json.JsonSerializer.Deserialize<Dtos.ExerciseDtos.SimpleTranslateDto>(targetExercise.Data);
        if (dtoSimple2 != null)
        {
            bool needUpdate = false;
            if (dtoSimple2.Alternatives == null || dtoSimple2.Alternatives.Length == 0)
            {
                if (addedAlternativesArr.Length > 0)
                {
                    dtoSimple2.Alternatives = addedAlternativesArr;
                    needUpdate = true;
                }
            }
            else
            {
                List<string> toAdd = [];
                List<string> toPersist = [];
                if (addedAlternativesArr.Length > 0)
                {
                    foreach (string alternative in addedAlternativesArr)
                    {
                        if (!dtoSimple2.Alternatives.Contains(alternative))
                            toAdd.Add(alternative);
                    }
                }
                if (removedAlternativesArr.Length > 0)
                {
                    foreach (string alternative in dtoSimple2.Alternatives)
                    {
                        if (!removedAlternativesArr.Contains(alternative))
                            toPersist.Add(alternative);
                    }
                }
                needUpdate = toAdd.Count > 0 || toPersist.Count < dtoSimple2.Alternatives.Length;
                if (needUpdate)
                {
                    dtoSimple2.Alternatives = [.. toPersist, .. toAdd];
                }
            }

            if (needUpdate)
            {
                targetExercise.Data = System.Text.Json.JsonSerializer.Serialize(dtoSimple2);
            }
        }
    }

    /// <summary>
    /// Simple yes/no validation - the client should ensure the data is correct before sending,
    /// but we want to have some basic validation on the server to prevent malformed data 
    /// from being saved.
    /// </summary>
    /// <param name="exerciseTypeId"></param>
    /// <param name="data"></param>
    /// <returns></returns>
    public static async Task<bool> ValidateExerciseData(int exerciseTypeId, string data, ILogger<Program> logger, int userId, AyalasLanguageDbContext db)
    {
        if (string.IsNullOrEmpty(data))
            return false;

        try
        {
            ExerciseTypesEnum type = (ExerciseTypesEnum)exerciseTypeId;
            if (!type.HasExtraOptions())
            {
                // Validate that data is a JSON array of options
                var dtoSimple = System.Text.Json.JsonSerializer.Deserialize<Dtos.ExerciseDtos.SimpleTranslateDto>(data);
                var retValue = dtoSimple != null && !string.IsNullOrEmpty(dtoSimple.First) && !string.IsNullOrEmpty(dtoSimple.Second);
                if (!retValue)
                {
                    await db.CreateLogInternal(userId, LogTypeEnum.ExerciseDataValidationFailed, new ExerciseDataValidationFailed
                    {
                        Title = "Exercise data lacks simple required structure",
                        Data = data,
                        ExerciseType = exerciseTypeId
                    });
                }
                return retValue;
            }
            else
            {
                string separator = type.ExtraOptionsSeparator();
                // Validate that data is a JSON object with question, options, and correct answer
                var dtoBucket = System.Text.Json.JsonSerializer.Deserialize<Dtos.ExerciseDtos.BucketTranslateDto>(data);
                if (!(dtoBucket != null
                       && !string.IsNullOrEmpty(dtoBucket.First)
                       && !string.IsNullOrEmpty(dtoBucket.Second)
                       && dtoBucket.ExtraOptions.Split(separator).Length >= Constants.BUCKET_EXTRA_MIN_COUNT
                       && dtoBucket.ExtraOptions.Split(separator).Length <= Constants.BUCKET_EXTRA_MAX_COUNT))
                {
                    logger.LogWarning("Bucket exercise data validation failed. Data: {Data}", data);
                    await db.CreateLogInternal(userId, LogTypeEnum.ExerciseDataValidationFailed, new ExerciseDataValidationFailed
                    {
                        Title = "Bucket exercise data validation failed",
                        Data = data,
                        ExerciseType = exerciseTypeId
                    });
                    return false;
                }
                else
                {
                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error validating exercise data for exercise type {ExerciseTypeId}. Data: {Data}", exerciseTypeId, data);

            await db.CreateLogInternal(userId, LogTypeEnum.ExerciseDataValidationFailed, new ExerciseDataValidationFailed
            {
                Title = "Error validating exercise data for exercise type",
                Data = data,
                ExerciseType = exerciseTypeId,
                Error = ex.Message,
                CallStack = ex.StackTrace
            });
            return false; // If any exception occurs during validation, consider it invalid
        }
    }

    public static async Task<bool> IsOtherLearningPathFoundWith(int targetLanguageId, int knownLanguageId, uint level, decimal chapter, int? currentLearningPathId, AyalasLanguageDbContext db)
    {
        //sql provider may have a bad comparer so we get all the chapters for the level and 
        //compare in dot net
        var learningPath = (await db.LearningPaths.Where(lp => lp.KnownLanguageId == knownLanguageId
            && lp.TargetLanguageId == targetLanguageId
            && lp.Level == level).ToArrayAsync()).FirstOrDefault(item => item.Chapter.CompareTo(chapter) == 0);

        if (learningPath == null)
        {
            return false;
        }
        if (currentLearningPathId != null && learningPath.LearningPathId == currentLearningPathId.Value)
        {
            return false;
        }
        return true;
    }

    public static decimal FindPath(NextChapterResponseDto[] paths, decimal chapterHint, bool goUp, ILogger<Program> logger)
    {

        //get the number and the one closest to it on the same direction
        int index = Array.FindIndex(paths, p => p.Chapter == chapterHint);
        int? nextIndex = null;
        if (goUp && index < paths.Length - 1)
            nextIndex = index + 1;
        else if (!goUp && index > 0)
            nextIndex = index - 1;

        decimal nextNumber;
        if (nextIndex == null)
        {
            nextNumber = GetNextInSeries(chapterHint, goUp, logger);
            if (nextNumber == 0)
            {
                return GetNextFraction(chapterHint, goUp, logger);
            }
            return nextNumber;
        }

        nextNumber = paths[nextIndex.Value].Chapter;

        return GetClosestMatch(chapterHint, nextNumber, goUp, logger);
    }

    public static decimal GetClosestMatch(decimal chapterHint, decimal nextNumber, bool goUp, ILogger<Program> logger)
    {
        decimal next = GetNextInSeries(chapterHint, goUp, logger);

        //we must not exceed or be equal to nextNumber
        if ((goUp && next >= nextNumber) || (!goUp && next <= nextNumber))
        {
            next = GetNextFraction(chapterHint, goUp, logger);
            if ((goUp && next >= nextNumber) || (!goUp && next <= nextNumber))
            {
                decimal step = 0;

                step = GetNextFraction(nextNumber, goUp, logger) - nextNumber;
                return step + chapterHint;
            }
        }

        return next;
    }

    public static decimal GetNextFraction(decimal input, bool up, ILogger<Program> logger)
    {
        // This trick removes trailing zeros
        logger.LogInformation("GetNextFraction recieves input:{input}, up:{up}", input, up);
        input = decimal.Parse(input.ToString("G29"));
        logger.LogInformation("GetNextFraction after normalization of input:{input}", input);
        // 1. Extract the scale (number of decimal places) from the decimal
        // decimal.GetBits returns 4 ints. The 4th int contains the scale.
        int[] bits = decimal.GetBits(input);
        int scale = (bits[3] >> 16) & 0x7F;

        // 2. We want to add a '1' at the next decimal place (scale + 1)
        // C# decimals support up to 28-29 decimal places.
        if (scale >= 28)
            throw new OverflowException("Decimal precision limit reached.");

        // 3. Create a decimal that represents 10^-(scale + 1)
        // The constructor parameters are: (low, mid, high, isNegative, scale)
        decimal increment = new decimal(1, 0, 0, false, (byte)(scale + 1));
        logger.LogInformation("GetNextFraction increment:{increment}", increment);
        if (up)
            return input + increment;
        else
            return input - increment;
    }

    public static decimal GetNextInSeries(decimal input, bool up, ILogger<Program> logger)
    {
        logger.LogInformation("GetNextInSeries recieves input:{input}, up:{up}", input, up);
        input = decimal.Parse(input.ToString("G29"));
        logger.LogInformation("GetNextInSeries after normalization of input:{input}", input);

        // 1. Extract the current scale (number of decimal places)
        int[] bits = decimal.GetBits(input);
        int scale = (bits[3] >> 16) & 0x7F;

        // 2. Create an increment that is '1' at that specific scale
        // For scale 0, increment is 1
        // For scale 1, increment is 0.1
        // For scale 2, increment is 0.01
        decimal increment = new decimal(1, 0, 0, false, (byte)scale);

        if (up)
            return input + increment;
        else
            return input - increment;
    }

    private static async Task CreateLogInternal<T>(this AyalasLanguageDbContext db, int userId, LogTypeEnum logType, T obj)
    {
        var baseLog = obj as LoggingBase;

        if (baseLog != null && baseLog.CallStack == string.Empty)
        {
            baseLog.CallStack = Environment.StackTrace;
        }
        Log rec = new()
        {
            UserId = userId,
            LogType = (int)logType,
            Description = System.Text.Json.JsonSerializer.Serialize<T>(obj)
        };
        db.Logs.Add(rec);
        await db.SaveChangesAsync();
    }
}