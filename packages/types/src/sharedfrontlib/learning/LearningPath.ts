import type { AuthorAccess } from "../../auth";
import type { ContentStatus } from "../../exercise";

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