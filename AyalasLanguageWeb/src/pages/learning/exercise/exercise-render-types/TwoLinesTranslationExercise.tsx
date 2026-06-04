import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ExerciseInput } from '../../../../components/ExerciseInput';
import VirtualKeyboard from '../../../../components/VirtualKeyboard';
import { EXERCISE_TYPES } from '../../../../constants/learning';
import type { ExerciseData, ExerciseInfo } from '../../../../types/exercise/Exercise';
import type { ExerciseHandle } from '../../../../types/ui/ComponentHandles';
import type { ExerciseInputHandle } from '../../../../types/ui/ComponentHandles';
import type { User } from '../../../../types/shared/User';
import { replaceCharsForLanguage } from '../../../../utils/languageUtils';

type Props = {
  exerciseInfo: ExerciseInfo;
  setError: (s: string) => void;
  moveNext: () => void;
  displayAnswer?: boolean;
  parentCheckAnswer?: () => boolean;
  user?: User | null;
};

const safeParseSecond = (data: string | ExerciseData) => {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as ExerciseData;
      return parsed.Second ?? '';
    } catch {
      return '';
    }
  }
  return (data as ExerciseData).Second ?? '';
};

export const TwoLinesTranslationExercise = forwardRef<ExerciseHandle, Props>(({ exerciseInfo, setError, moveNext, displayAnswer, parentCheckAnswer, user }, ref) => {
  const inputRef = useRef<ExerciseInputHandle | null>(null);
  const [inputValue, setInputValue] = useState('');

  function OnChange(value: string) {
    setInputValue(value);
  }

  useImperativeHandle(ref, () => ({
    setFocus() {
      inputRef.current?.setFocus();
    },
    checkAnswer() {
      const thisQuestionRef = inputRef.current;
      let canMoveNext = true;
      const userAnswer = thisQuestionRef?.getUserAnswer()?.trim().toLowerCase() ?? '';
      const secondRaw = safeParseSecond(exerciseInfo.data);
      const target = (replaceCharsForLanguage(user?.languageSettings?.targetLanguage ?? '', secondRaw) ?? '').trim().toLowerCase();
      if (userAnswer !== target) {
        thisQuestionRef?.setToError();
        canMoveNext = false;
      }

      if (canMoveNext) {
        moveNext();
      } else {
        setError('You have got some errors. Try again!');
      }

      return canMoveNext;
    }
  }));

  const first = (typeof exerciseInfo.data === 'string' ? (() => { try { return JSON.parse(exerciseInfo.data).First ?? ''; } catch { return ''; } })() : (exerciseInfo.data as ExerciseData).First) ?? '';
  const second = (typeof exerciseInfo.data === 'string' ? (() => { try { return JSON.parse(exerciseInfo.data).Second ?? ''; } catch { return ''; } })() : (exerciseInfo.data as ExerciseData).Second) ?? '';

  return (
    <>
      <div className="form-row">
        <div className="form-label-row">{first}</div>
      </div>
      <div className={`${exerciseInfo.exerciseTypeId === EXERCISE_TYPES.FROM_KNOWN_TO_TARGET ? 'form-row answer' : 'form-row'}`}>
        <ExerciseInput
          ref={inputRef}
          charWidth={2 + (second?.length ?? 0)}
          checkAnswer={parentCheckAnswer}
          onChange={OnChange}
          value={inputValue}
        />
      </div>
      {displayAnswer && (
        <div className="form-label-row">{second}</div>
      )}
      {exerciseInfo.exerciseTypeId === EXERCISE_TYPES.FROM_KNOWN_TO_TARGET && (
        <VirtualKeyboard languageCode={(user?.languageSettings?.targetLanguageEnglishName ?? 'en').toLowerCase()} isRightToLeft={true} onChange={OnChange} value={inputValue} />
      )}
    </>
  );
});

export default TwoLinesTranslationExercise;
// ...existing code...
