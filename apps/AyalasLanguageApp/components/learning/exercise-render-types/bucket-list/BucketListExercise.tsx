import { useEffect, useState, useImperativeHandle } from 'react';
import BucketListItem from './BucketListItem';
import { getRandomizedSequence } from '@ayalaslanguage/types/sharedfrontlib/utils';
import type { ExtendedExerciseInfo } from '@ayalaslanguage/types/sharedfrontlib/learning';
import type {ExerciseHandle} from '../../Exercise';
import { CirclePlay } from 'lucide-react-native';
import { EXERCISE_TYPE_LOGIC, isRightToLeftInput } from '@ayalaslanguage/types/sharedfrontlib/logic';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { TouchableOpacity, View, Text } from 'react-native';
import useTextStyles from '@/lib/useTextStyles';

type Props = {
  exerciseInfo: ExtendedExerciseInfo;
  setError: (s: string) => void;
  moveNext: () => void;
  displayAnswer?: boolean;
  playTargetText: (s: string) => Promise<void>;
  user?: User | null;
  ref: React.Ref<ExerciseHandle>;
};

const BucketListExercise = function ({ exerciseInfo, setError, moveNext, displayAnswer, playTargetText, user, ref }: Props) {
  const [bucketList, setBucketList] = useState<string[]>([]);
  const [answerList, setAnswerList] = useState<string[]>([]);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [translation, setTranslation] = useState('');
  const { styles } = useTextStyles();

  function checkAnswerInternal(userAnswers: (string)[] = []) {
    let canMoveNext = true;
    let singleAnswer = false;

    if (userAnswers.length == 0) {
      userAnswers = [...answerList];
    }
    else {
      singleAnswer = (userAnswers.length == 1);
    }

    if (userAnswers.length === (exerciseInfo.answers?.length || 0)) {
      for (let i = 0; i < userAnswers.length; i++) {
        if (userAnswers[i].toLowerCase() !== (exerciseInfo.answers?.[i]?.toLowerCase() || '')) {
          canMoveNext = false;
          break;
        }
      }
    } else {
      canMoveNext = false;
    }

    if (!canMoveNext) {
      if (EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].SupportsAlternativeAnswers) {
        if (exerciseInfo.exerciseObject?.Alternatives != null &&
          exerciseInfo.exerciseObject?.Alternatives.length > 0) {
          const userAnswerAsStr = userAnswers.join(" ");
          for (const alternative of exerciseInfo.exerciseObject.Alternatives) {
            if (userAnswerAsStr == alternative) {
              canMoveNext = true;
              break;
            }
          }
        }
      }
    }

    if (canMoveNext) {
      if (singleAnswer) {
        //if single answer wait before moving on
        setTimeout(moveNext, 2000);
      }
      else {
        moveNext();
      }
    } else {
      setError('You have got an error. Try again!');
    }

    return canMoveNext;
  }

  useImperativeHandle(ref, () => ({
    checkAnswer() {
      return checkAnswerInternal();
    },
    setFocus() {
      // focus is not applicable for bucket-list, leave as no-op
    },
    getCurrentAnswer() {
      return answerList.join(" ");
    }
  }));

  useEffect(() => {
    async function execAsync() {
      if (exerciseInfo && exerciseInfo.exerciseObject != null && exerciseInfo.answers && exerciseInfo.answers.length > 0 && exerciseInfo.extraItems && exerciseInfo.extraItems.length > 0) {

        setFirst(exerciseInfo.exerciseObject.First as string);
        setSecond(exerciseInfo.exerciseObject.Second as string);
        if (EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShowsTranslationOnRevealedAnswer && exerciseInfo.exerciseObject.Translation != null) {
          setTranslation(exerciseInfo.exerciseObject.Translation as string);
        }
        const optionsListTemp = [...exerciseInfo.extraItems, ...exerciseInfo.answers];
        const sequence = getRandomizedSequence(optionsListTemp.length);
        const optionsListRandomized: string[] = [];
        for (let i = 0; i < sequence.length; i++) {
          optionsListRandomized.push(optionsListTemp[sequence[i]]);
        }
        setBucketList(optionsListRandomized);

        if (EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].AutoPlayQuestion) {
          //play the sentence shown
          await playTargetText(exerciseInfo.exerciseObject.First as string);
        }
      }
    }

    execAsync();
  }, [exerciseInfo]);

  function answerListItemClicked(itemValue: string, position: number) {
    setBucketList([...bucketList, itemValue]);
    setAnswerList(answerList.filter((_, ind) => ind !== position));
  }

  async function bucketListItemClicked(itemValue: string, position: number) {
    if (EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShouldPlayAnswer) {
      playTargetText(itemValue);
    }

    if (EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].HasSingleBucketAnswer) {
      setBucketList([...answerList, ...bucketList.filter((_, ind) => ind !== position)]);
      setAnswerList([itemValue]);
      checkAnswerInternal([itemValue]);
    }
    else {
      setBucketList(bucketList.filter((_, ind) => ind !== position));
      setAnswerList([...answerList, itemValue]);
    }
  }

  return (
    <>
      <View className="exercise-outer-element">
        <View className="exercise-inner-element">
          <View className="form-row-play">
            <View className="form-play-container"><Text style={styles.exerciseText}>{first}</Text>{EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].CanPlayQuestion && (
              <View className="playButtonContainer"><TouchableOpacity testID="play-question" className="play-button" onPress={async () => await playTargetText(first)}><CirclePlay className='color-brand-play' /></TouchableOpacity></View>
            )}</View>
          </View>
          {answerList && (
            <View className={isRightToLeftInput(exerciseInfo.exerciseTypeId,
              user?.languageSettings?.targetLanguageIsRightToLeft ?? false,
              user?.languageSettings?.knownLanguageIsRightToLeft ?? false
            ) ? "line-container-wrap rtlanswer" : "line-container-wrap answer"}>
              {answerList.map((item, i) => (
                <BucketListItem key={`answer-${i}`} itemValue={item} position={i} itemClicked={answerListItemClicked} />
              ))}
            </View>
          )}
          {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].HasMultiBucketAnswers && (
            <View className="menu-delimiter"></View>
          )}
          {bucketList && (
            <View className="line-container-wrap bucket">
              {bucketList.map((item, i) => (
                <BucketListItem key={`bucket-${i}`} itemValue={item} position={i} itemClicked={bucketListItemClicked} />
              ))}
            </View>
          )}
        </View>
      </View>
      {displayAnswer && (
        <View className="form-row-play">
          <View className="form-play-container">{second}
            {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShouldPlayAnswer && (
            <TouchableOpacity testID="play-answer" className="play-button" onPress={async () => await playTargetText(second)}><CirclePlay className='color-brand-play' /></TouchableOpacity>
            )}
          </View>
          {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShowsTranslationOnRevealedAnswer && (
            <View style={styles.text}>{translation}</View>
          )}
        </View>
      )}
    </>
  );
};

export default BucketListExercise;
