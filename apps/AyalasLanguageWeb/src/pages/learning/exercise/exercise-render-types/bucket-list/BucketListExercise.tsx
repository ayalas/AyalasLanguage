import { useEffect, useState, useImperativeHandle } from 'react';
import { BucketListItem } from './BucketListItem';
import { getRandomizedSequence } from '@ayalaslanguage/types/sharedfrontlib/utils';
import type { ExtendedExerciseInfo } from '@ayalaslanguage/types/sharedfrontlib/learning';
import type {ExerciseHandle} from '../../Exercise';
import { CirclePlay } from 'lucide-react';
import { EXERCISE_TYPE_LOGIC, isRightToLeftInput } from '@ayalaslanguage/types/sharedfrontlib/logic';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';

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
      <div className="exercise-outer-element">
        <div className="exercise-inner-element">
          <div className="form-row-play">
            <div className="form-play-container">{first}{EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].CanPlayQuestion && (
              <div className="playButtonContainer"><button data-testid="play-question" type="button" className="play-button" title="Play Audio" onClick={async () => await playTargetText(first)}><CirclePlay /></button></div>
            )}</div>
          </div>
          {answerList && (
            <div className={isRightToLeftInput(exerciseInfo.exerciseTypeId,
              user?.languageSettings?.targetLanguageIsRightToLeft ?? false,
              user?.languageSettings?.knownLanguageIsRightToLeft ?? false
            ) ? "form-row rtlanswer" : "form-row answer"}>
              {answerList.map((item, i) => (
                <BucketListItem key={`answer-${i}`} itemValue={item} position={i} itemClicked={answerListItemClicked} />
              ))}
            </div>
          )}
          {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].HasMultiBucketAnswers && (
            <div className="menu-delimiter"></div>
          )}
          {bucketList && (
            <div className="form-row bucket">
              {bucketList.map((item, i) => (
                <BucketListItem key={`bucket-${i}`} itemValue={item} position={i} itemClicked={bucketListItemClicked} />
              ))}
            </div>
          )}
        </div>
      </div>
      {displayAnswer && (
        <div className="form-row-play">
          <div className="form-play-container">{second}
            {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShouldPlayAnswer && (
            <button data-testid="play-answer" type="button" className="play-button" title="Play Audio" onClick={async () => await playTargetText(second)}><CirclePlay /></button>
            )}
          </div>
          {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShowsTranslationOnRevealedAnswer && (
            <div className="form-content-row">{translation}</div>
          )}
        </div>
      )}
    </>
  );
};

export default BucketListExercise;
