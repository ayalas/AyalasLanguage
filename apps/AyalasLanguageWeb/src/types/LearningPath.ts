import type { AuthorAccess } from "@ayalaslanguage/types/auth";
import type { ContentStatus } from "@ayalaslanguage/types/exercise";

export interface LearningPathInfo {
    learningPathId: number;
    level: number;
    chapter: number;
    name?: string;
    status: number;
    exerciseId?: number;
    exerciseCount: number;
    access: AuthorAccess;
    practiseMistakesInThisPath: boolean;
}
export interface ILearningPath {
    learningPathId: number;
    level: number;
    chapter: number;
    name?: string;
    contentStatus: ContentStatus;
    status?: number;
    exerciseId?: number;
    exerciseCount: number;
    access: AuthorAccess;
    practiseMistakesInThisPath: boolean;
    lastModified: string,
    exerciseTypeId?: number;
}
//int LearningPathId, uint Level, decimal Chapter, string? Name, ContentStatusEnum ContentStatus,  int? Status = null,  int ExerciseCount = 0, bool PractiseMistakesInThisPath = false, int? ExerciseTypeId = null