import React from 'react';
import type { ExerciseInfo } from '../../../../types/exercise/Exercise';

export interface BucketListProps {
  exerciseInfo: ExerciseInfo;
  setError: (s: string) => void;
  moveNext: () => void;
  displayAnswer?: boolean;
}

declare const BucketListExercise: React.ForwardRefExoticComponent<BucketListProps & React.RefAttributes<unknown>>;
export { BucketListExercise };
export default BucketListExercise;
