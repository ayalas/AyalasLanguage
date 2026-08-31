import type { AuthorAccess, OwnershipType } from "../../auth";
import type { ContentStatus } from "../../exercise";

export interface NextChapterResponse {
  chapter: number;
}

export interface ValidateLevelChapterRequest {
    level: number;
    chapter: number;
    learningPathId?: number;
}

export interface ValidateLevelChapterResponse {
    isUnique: boolean;
}

export interface LearningPathInfo {
    learningPathId: number;
    level: number;
    chapter: number;
    name?: string;
    status: number;
    ownershipType: OwnershipType;
    exerciseId?: number;
    exerciseCount: number;
    access: AuthorAccess;
    practiseMistakesInThisPath: boolean;
}

export interface EditLearningPathRequest
{
    level: number;
    chapter: number;
    name?: string;
    ownershipType: OwnershipType;
}

export interface ILearningPath {
    learningPathId: number;
    level: number;
    chapter: number;
    name?: string;
    contentStatus: ContentStatus;
    status?: number;
    ownershipType: OwnershipType;
    exerciseId?: number;
    exerciseCount: number;
    access: AuthorAccess;
    practiseMistakesInThisPath: boolean;
    lastModified: string,
    exerciseTypeId?: number;
}