import { useEffect, useState, useImperativeHandle } from 'react';
import { BucketListItem } from './BucketListItem';
import { getRandomizedSequence } from '../../../../../utils/utils';
import type { ExerciseInfo } from '../../../../../types/exercise/Exercise';
import type { ExerciseHandle } from '../../../../../types/ui/ComponentHandles';
import { EXERCISE_TYPES } from '../../../../../constants/learning';
import { CirclePlay } from 'lucide-react';

type Props = {
  exerciseInfo: ExerciseInfo;
  setError: (s: string) => void;
  moveNext: () => void;
  displayAnswer?: boolean;
  playTargetText: (s: string) => void;
  ref: React.Ref<ExerciseHandle>;
};

const BucketListExercise = function ({ exerciseInfo, setError, moveNext, displayAnswer, playTargetText, ref }: Props) {
  const [bucketList, setBucketList] = useState<string[]>([]);
  const [answerList, setAnswerList] = useState<string[]>([]);
  const [second, setSecond] = useState('');

  useImperativeHandle(ref, () => ({
    checkAnswer() {
      let canMoveNext = true;
      if (answerList.length === (exerciseInfo.answers?.length || 0)) {
        for (let i = 0; i < answerList.length; i++) {
          if (answerList[i].toLowerCase() !== (exerciseInfo.answers?.[i]?.toLowerCase() || '')) {
            canMoveNext = false;
            break;
          }
        }
      } else {
        canMoveNext = false;
      }

      if (canMoveNext) {
        moveNext();
      } else {
        setError('You have got an error. Try again!');
      }

      return canMoveNext;
    },
    setFocus() {
      // focus is not applicable for bucket-list, leave as no-op
    },
    getCurrentAnswer() {
      //not applicable
      return '';
    }
  }));

  useEffect(() => {
    async function execAsync() {
      if (exerciseInfo && exerciseInfo.answers && exerciseInfo.answers.length > 0 && exerciseInfo.extraItems && exerciseInfo.extraItems.length > 0) {
        if (typeof exerciseInfo.data === 'string') {
          setSecond(JSON.parse(exerciseInfo.data).Second);
        }
        else if (typeof exerciseInfo.data.Second === 'string') {
          setSecond(exerciseInfo.data.Second);
        }
        const wordsListTemp = [...exerciseInfo.extraItems, ...exerciseInfo.answers];
        const sequence = getRandomizedSequence(wordsListTemp.length);
        const wordsListRandomized: string[] = [];
        for (let i = 0; i < sequence.length; i++) {
          wordsListRandomized.push(wordsListTemp[sequence[i]]);
        }
        setBucketList(wordsListRandomized);
      }
    }

    execAsync();
  }, [exerciseInfo]);

  function answerListItemClicked(itemValue: string, position: number) {
    setBucketList([...bucketList, itemValue]);
    setAnswerList(answerList.filter((_, ind) => ind !== position));
  }

  function bucketListItemClicked(itemValue: string, position: number) {
    playTargetText(itemValue);
    setAnswerList([...answerList, itemValue]);
    setBucketList(bucketList.filter((_, ind) => ind !== position));
  }

  return (
    <>
      <div className="form-row">
        <div className="form-label-row">{(typeof exerciseInfo.data === 'string' ? (() => { try { return JSON.parse(exerciseInfo.data).First; } catch { return ''; } })() : exerciseInfo.data.First) || ''}</div>
      </div>
      {answerList && (
        <div className="form-row answer">
          {answerList.map((item, i) => (
            <BucketListItem key={`answer-${i}`} itemValue={item} position={i} itemClicked={answerListItemClicked} />
          ))}
        </div>
      )}
      {bucketList && (
        <div className="form-row bucket">
          {bucketList.map((item, i) => (
            <BucketListItem key={`bucket-${i}`} itemValue={item} position={i} itemClicked={bucketListItemClicked} />
          ))}
        </div>
      )}
      {displayAnswer && (
        <div className="form-row-play"><div className="form-play-container">{second}
          <button data-testid="play-answer" type="button" className="form-button play-button" title="Play Audio" onClick={() => playTargetText(second)}><CirclePlay /></button>
        </div></div>
      )}
    </>
  );
};

export default BucketListExercise;
