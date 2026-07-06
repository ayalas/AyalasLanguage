using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageJobs
{
    internal static class JobsQuery
    {
       
        internal static IQueryable<UserProgress> UsersProgressUpdateOnExerciseCreate(int? mainRecordId, AyalasLanguageDbContext db)
        {
            //mainRecordId: learning path id
            //secondaryRecordId: the exercise id to put in the user progress
            return db.UserProgresses.Where(up => up.LearningPathId == mainRecordId 
                        && up.ExerciseId == null).AsQueryable();
        }
    }
}
