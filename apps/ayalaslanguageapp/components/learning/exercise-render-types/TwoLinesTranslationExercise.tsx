import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import ExerciseInput from '@/components/learning/ExerciseInput';
import type { ExtendedExerciseInfo } from '@ayalaslanguage/types/sharedfrontlib/learning';
import { isRightToLeftInput, EXERCISE_TYPE_LOGIC } from '@ayalaslanguage/types/sharedfrontlib/logic';
import type { ExerciseHandle } from '../Exercise';
import type { ExerciseInputHandle } from '@/components/learning/ExerciseInput';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { replaceCharsForLanguage } from '@ayalaslanguage/types/sharedfrontlib/utils';
import { CirclePlay } from 'lucide-react-native';
import { TouchableOpacity, Text, View } from 'react-native';
import useTextStyles from '@/lib/useTextStyles';

type Props = {
  exerciseInfo: ExtendedExerciseInfo;
  setError: (s: string) => void;
  moveNext: () => void;
  displayAnswer?: boolean;
  parentCheckAnswer?: () => boolean;
  user?: User | null;
  playTargetText: (s: string) => Promise<void>;
  setHasAnswer: (hasAnswer: boolean) => void;
  ref: React.Ref<ExerciseHandle>;
};

export default function TwoLinesTranslationExercise({ exerciseInfo, setError, moveNext, displayAnswer, parentCheckAnswer, user, playTargetText, setHasAnswer, ref }: Props) {
  const inputRef = useRef<ExerciseInputHandle | null>(null);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [translation, setTranslation] = useState('');
  const [hasError, setHasError] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { styles } = useTextStyles();

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
        setHasError(true);
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
  }, [exerciseInfo]);

  const onChangeFromInput = useCallback((value: string, key?: string) => {
    if (hasError && value !== inputValue) {
      setError("");
      setHasError(false);
    }
    setInputValue(value);
    setHasAnswer(value != '');
  }, [hasError]);

  const isRTL = isRightToLeftInput(
    exerciseInfo.exerciseTypeId,
    user?.languageSettings?.targetLanguageIsRightToLeft ?? false,
    user?.languageSettings?.knownLanguageIsRightToLeft ?? false
  );

  return (
    <>
      <View className="exercise-outer-element">
        <View className="exercise-inner-element">
          <View className="form-row-play">
            <View className="form-play-container">
              <View className="play-text"><Text style={styles.exerciseText}>{first}</Text></View>
              {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].CanPlayQuestion && (
              <View className="playButtonContainer"><TouchableOpacity testID="play-question" className="play-button" onPress={async () => await playTargetText(first)}><CirclePlay className='color-brand-play' /></TouchableOpacity></View>
            )}</View>
          </View>
          <View className={`form-row ${isRTL ? "flex-row-reverse justify-end" : "flex-row justify-start"}`}
            style={{
              // Force direction for layout engine (Android/iOS)
              direction: isRTL ? 'rtl' : 'ltr'
            }}

          >
            <ExerciseInput
              ref={inputRef}
              charWidth={2 + (second?.length ?? 0)}
              checkAnswer={parentCheckAnswer}
              exerciseType={exerciseInfo.exerciseTypeId}
              onChange={onChangeFromInput}
            />
          </View>
        </View>
      </View>
      {displayAnswer && (
        <View className="form-row-play">
          <View className="form-play-container">
            <View className="play-text"><Text style={styles.text}>{second}</Text></View>
            {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShouldPlayAnswer && (
              <TouchableOpacity testID="play-answer" className="play-button" onPress={async () => await playTargetText(second)}><CirclePlay className='color-brand-play' /></TouchableOpacity>
            )}</View>
          {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShowsTranslationOnRevealedAnswer && (
            <Text style={styles.text}>{translation}</Text>
          )}
        </View>
      )}
    </>
  );
};
