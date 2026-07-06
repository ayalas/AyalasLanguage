import type { AuthorAccess } from "@ayalaslanguage/types/auth";

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