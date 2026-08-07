using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageJobs
{
    internal static class JobsQuery
    {
       
        internal static IQueryable<UserProgress> UsersProgressUpdateOnExerciseCreate(int mainRecordId, AyalasLanguageDbContext db)
        {
            //mainRecordId: learning path id
            //secondaryRecordId: the exercise id to put in the user progress
            return db.UserProgresses.Where(up => up.LearningPathId == mainRecordId 
                        && up.ExerciseId == null).AsQueryable();
        }

        internal static IQueryable<Log> DeleteOldLogs(int daysBack, AyalasLanguageDbContext db)
        {
            //daysBack: number of days to look back
            var cutoffDate = DateTime.UtcNow.AddDays(-daysBack);
            return db.Logs.Where(log => log.CreatedOn < cutoffDate).AsQueryable();
        }

        internal static IQueryable<Token> DeleteOldTokens(int daysBack, AyalasLanguageDbContext db)
        {
            //daysBack: number of days to look back
            var cutoffDate = DateTime.UtcNow.AddDays(-daysBack);
            return db.Tokens.Where(token => token.ExpiresOn < cutoffDate).AsQueryable();
        }
    }
}
