import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ExerciseData, ExerciseInfo } from '../../types/exercise/Exercise';
import type { ExerciseHandle } from '../../types/ui/ComponentHandles';
import { replaceCharsForLanguage } from '../../utils/languageUtils';
import type { User } from '../../types/shared/User';
import type { ExerciseInputHandle } from '../../types/ui/ComponentHandles';

type Props = {
  exerciseInfo: ExerciseInfo;
  setError: (s: string) => void;
  moveNext: () => void;
  displayAnswer?: boolean;
  parentCheckAnswer?: () => boolean;
  user?: User;
};

export const Exercise = forwardRef<ExerciseHandle, Props>(({ exerciseInfo, setError, moveNext, user }, ref) => {
  const inputRef = useRef<ExerciseInputHandle | null>(null);

  useImperativeHandle(ref, () => ({
    setFocus() {
      inputRef.current?.setFocus();
    },
    checkAnswer() {
      const userAnswer = inputRef.current?.getUserAnswer?.() ?? '';
      const second = (typeof exerciseInfo.data === 'string' ? (() => { try { return JSON.parse(exerciseInfo.data).Second; } catch { return ''; } })() : (exerciseInfo.data as ExerciseData).Second) || '';
  const target = (replaceCharsForLanguage(user?.languageSettings?.targetLanguage ?? '', second) ?? '').trim().toLowerCase();
      if (userAnswer.trim().toLowerCase() !== target) {
        inputRef.current?.setToError?.();
        setError('You have got some errors. Try again!');
        return false;
      }
      moveNext();
      return true;
    }
  }));

  return null; // placeholder - exercise renderers are individual components
});

export default Exercise;
