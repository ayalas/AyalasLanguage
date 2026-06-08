import { useImperativeHandle, useRef, useState } from 'react';
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
  ref: React.Ref<ExerciseHandle>;
};

const safeParseData = (data: string | ExerciseData) => {
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

export const TwoLinesTranslationExercise = function({ exerciseInfo, setError, moveNext, displayAnswer, parentCheckAnswer, user , ref}:Props) {
  const inputRef = useRef<ExerciseInputHandle | null>(null);
  const [inputValue, setInputValue] = useState('');

  function OnChange(value: string) {
    setInputValue(value);
  }

  function compareToAnswer(userAnswer: string, correctAnswer: string) {
    const target = (replaceCharsForLanguage(user?.languageSettings?.targetLanguage ?? '', correctAnswer) ?? '').trim().toLowerCase();
    return (userAnswer === target);
  }

  useImperativeHandle(ref, () => ({
    setFocus() {
      inputRef.current?.setFocus();
    },
    getCurrentAnswer() {
      return inputRef.current?.getUserAnswer()?.trim().toLowerCase() ?? '';
    },
    checkAnswer() {
      const thisQuestionRef = inputRef.current;
      let canMoveNext = true;
      const userAnswer = thisQuestionRef?.getUserAnswer()?.trim().toLowerCase() ?? '';
      const dataObj = safeParseData(exerciseInfo.data);

      if (dataObj == null || dataObj.Second === undefined) return false;
      if (!compareToAnswer(userAnswer, dataObj.Second)) {
        let alternativeFound = false;
        //go through alternative answers
        if (dataObj.Alternatives != null && dataObj.Alternatives.length > 0) {
          for (const alternative of dataObj.Alternatives) {
            if (compareToAnswer(userAnswer, alternative)) {
              alternativeFound = true;
              break;
            }
          }
        }

        if (!alternativeFound) {
          thisQuestionRef?.setToError();
          canMoveNext = false;
        }
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
