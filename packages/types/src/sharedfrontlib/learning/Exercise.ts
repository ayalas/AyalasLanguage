import type { OwnershipType } from "../../auth";
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
  learningPathId?: number;
  ownershipType: OwnershipType;
}

export type ExtendedExerciseInfo = ExerciseInfo & {
  exerciseObject?: ExerciseData;
  index?: number
  answers?: string[];
  sentenceElements?: string[];
  extraItems?: string[];
};

export type MatchCell = { 
  Id: number;
  First: string;
  Second: string 
}

export type MatchSelection = {
  itemId: number;
  itemValue: string;
  matchingValue: string;
  setErrorState: (v: boolean) => void;
  setIsSelected: (v: boolean) => void;
  setToDone: () => void;
};

export type SetColumnType = (arr: MatchCell[]) => void;
