import type { ExerciseType } from "@ayalaslanguage/types/exercise";

export interface ExerciseData {
  First?: string;
  Second?: string;
  ExtraOptions?: string;
  Alternatives?: string[];
  Translation?: string;
}

export interface ExerciseInfo {
  exerciseId: number;
  exerciseTypeId: ExerciseType;
  data: string;
  access: number;
  learningPathId?: number
}

export type ExtendedExerciseInfo = ExerciseInfo & {
  exerciseObject?: ExerciseData;
  index?: number
  answers?: string[];
  sentenceElements?: string[];
  extraItems?: string[];
};
