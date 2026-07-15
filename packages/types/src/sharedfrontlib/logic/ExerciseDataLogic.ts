import type { ExerciseData } from "../learning/Exercise";

export const safeParseData = (data: string | ExerciseData) => {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as ExerciseData;
      return parsed;
    } catch {
      return null;
    }
  }
  return (data as ExerciseData);
};