export interface ExerciseData {
  First?: string;
  Second?: string;
  ExtraOptions?: string;
  Alternatives?: string[];
}

export interface ExerciseInfo {
  exerciseId: number;
  exerciseTypeId: number;
  // backend stores data as a JSON string; allow both until fully normalized
  data: string | ExerciseData;
  answers?: string[];
  sentenceElements?: string[];
  extraItems?: string[];
}

export interface ExerciseModel {
  exerciseId: number;
  exerciseTypeId: number;
  data: string;
  Access: number;
  exerciseObject?: ExerciseData;
}
