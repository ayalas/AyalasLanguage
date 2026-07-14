import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ExerciseInput } from '../../../../components/ExerciseInput';
import VirtualKeyboard from '../../../../components/VirtualKeyboard';
import type { ExtendedExerciseInfo } from '../../../../types/Exercise';
import type { ExerciseHandle } from '../../../../types/ui/ComponentHandles';
import type { ExerciseInputHandle } from '../../../../types/ui/ComponentHandles';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { replaceCharsForLanguage } from '../../../../utils/languageUtils';
import { CirclePlay } from 'lucide-react';
import { isRightToLeftInput, EXERCISE_TYPE_LOGIC } from '../../../../logic/ExerciseTypeLogic';

type Props = {
  exerciseInfo: ExtendedExerciseInfo;
  setError: (s: string) => void;
  moveNext: () => void;
  displayAnswer?: boolean;
  parentCheckAnswer?: () => boolean;
  user?: User | null;
  playTargetText: (s: string) => Promise<void>;
  ref: React.Ref<ExerciseHandle>;
};

export const TwoLinesTranslationExercise = function ({ exerciseInfo, setError, moveNext, displayAnswer, parentCheckAnswer, user, playTargetText, ref }: Props) {
  const inputRef = useRef<ExerciseInputHandle | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [translation, setTranslation] = useState('');

  const OnChange = useCallback((value: string) => {
    setInputValue(value);
}, []); // Stable reference

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

      if (exerciseInfo.exerciseObject == null || exerciseInfo.exerciseObject.Second === undefined) return false;
      if (!compareToAnswer(userAnswer, exerciseInfo.exerciseObject.Second)) {
        let alternativeFound = false;
        //go through alternative answers
        if (exerciseInfo.exerciseObject.Alternatives != null && exerciseInfo.exerciseObject.Alternatives.length > 0) {
          for (const alternative of exerciseInfo.exerciseObject.Alternatives) {
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

  useEffect(() => {
    async function runAsync() {

      if (exerciseInfo.exerciseObject == null) return;

      setFirst(exerciseInfo.exerciseObject.First as string);
      setSecond(exerciseInfo.exerciseObject.Second as string);
      if (exerciseInfo.exerciseObject.Translation != null) {
        setTranslation(exerciseInfo.exerciseObject.Translation as string);
      }
      if (EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].AutoPlayQuestion) {
        //play the sentence shown
        await playTargetText(exerciseInfo.exerciseObject.First as string);
      }
    }
    runAsync();
  }, [exerciseInfo])

  return (
    <>
      <div className="exercise-outer-element">
        <div className="exercise-inner-element">
          <div className="form-row-play">
            <div className="form-play-container">{first}{EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].CanPlayQuestion && (
              <div className="playButtonContainer"><button data-testid="play-question" type="button" className="play-button" title="Play Audio" onClick={async () => await playTargetText(first)}><CirclePlay /></button></div>
            )}</div>
          </div>
          <div className={isRightToLeftInput(exerciseInfo.exerciseTypeId,
            user?.languageSettings?.targetLanguageIsRightToLeft ?? false,
            user?.languageSettings?.knownLanguageIsRightToLeft ?? false
          ) ? "form-row rtlanswer" : "form-row answer"} >
            <ExerciseInput
              ref={inputRef}
              charWidth={2 + (second?.length ?? 0)}
              checkAnswer={parentCheckAnswer}
              onChange={OnChange}
              value={inputValue}
            />
          </div>
        </div>
      </div>
      {displayAnswer && (
        <div className="form-row-play">
          <div className="form-play-container">{second}
            {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShouldPlayAnswer && (
              <button data-testid="play-answer" type="button" className="play-button" title="Play Audio" onClick={async () => await playTargetText(second)}><CirclePlay /></button>
            )}</div>
          {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShowsTranslationOnRevealedAnswer && (
            <div className="form-content-row">{translation}</div>
          )}
        </div>
      )}
      {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].UsesVirtualKeyboard && (
        <VirtualKeyboard languageCode={(user?.languageSettings?.targetLanguageEnglishName ?? 'en').toLowerCase()} isRightToLeft={user?.languageSettings?.targetLanguageIsRightToLeft} onChange={OnChange} value={inputValue} />
      )}
    </>
  );
};

export default TwoLinesTranslationExercise;
// ...existing code...
