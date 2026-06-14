export const EXERCISE_TYPES = 
{
    FROM_KNOWN_TO_TARGET: 1,
    FROM_TARGET_TO_KNOWN: 2,
    FILL_IN_THE_BLANKS: 3,
    MATCHING: 4,
    FROM_KNOWN_TO_TARGET_BUCKET: 5,
    COMMON_RESPONSES_BUCKET: 6,
    COMMON_RESPONSES: 7
} as const;

export type ExerciseType = typeof EXERCISE_TYPES[keyof typeof EXERCISE_TYPES];

export interface ExerciseData {
  First?: string;
  Second?: string;
  ExtraOptions?: string;
  Alternatives?: string[];
}

export interface ExerciseInfo {
  exerciseId: number;
  exerciseTypeId: ExerciseType;
  // backend stores data as a JSON string; allow both until fully normalized
  data: string | ExerciseData;
  answers?: string[];
  sentenceElements?: string[];
  extraItems?: string[];
}

export interface ExerciseModel {
  exerciseId: number;
  exerciseTypeId: ExerciseType;
  data: string;
  access: number;
  exerciseObject?: ExerciseData;
  learningPathId?: number
}
