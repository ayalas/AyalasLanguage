export interface ExerciseInputHandle {
  getUserAnswer: () => string;
  setToError: () => void;
  setFocus: () => void;
  setValue: (val: string) => void;
}

export interface ExerciseHandle {
  setFocus: () => void;
  checkAnswer: () => boolean;
}
