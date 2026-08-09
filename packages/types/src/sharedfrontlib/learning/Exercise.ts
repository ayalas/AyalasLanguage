import type { ExerciseType } from "../../exercise";

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

export type MatchCell = { 
  FirstId: number;
  First: string;
  SecondId: number;
  Second: string 
}

export type MatchSelection = {
  itemId: number;
  itemValue: string;
  matchingId: number;
  matchingValue: string;
  setErrorState: (v: boolean) => void;
  setIsSelected: (v: boolean) => void;
  setToDone: () => void;
};

export type SetColumnType = (arr: MatchCell[]) => void;
