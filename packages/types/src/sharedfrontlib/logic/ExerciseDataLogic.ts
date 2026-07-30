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

export const replaceExerciseChars = (data: ExerciseData) => {
  data.First = replaceExerciseCharsInternal(data.First);
  data.Second = replaceExerciseCharsInternal(data.Second);
  data.ExtraOptions = replaceExerciseCharsInternal(data.ExtraOptions);
  return data;
}

function replaceExerciseCharsInternal(s?: string){
  if (s != null) {
    s = s.replaceAll('،', ',');
  }

  return s;
}