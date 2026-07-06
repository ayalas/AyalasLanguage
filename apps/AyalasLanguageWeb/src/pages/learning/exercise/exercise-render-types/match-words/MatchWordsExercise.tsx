import React, { useEffect, useState } from 'react';
import MatchWordItem from './MatchWordItem';
import type { MatchSelection } from './MatchWordItem';
import { getRandomizedSequence } from '../../../../../utils/utils';
import type { ExtendedExerciseInfo } from '../../../../../types/Exercise';
import { targetIsSpoken } from '../../../../../logic/ExerciseTypeLogic';

type Props = {
  exerciseInfo: ExtendedExerciseInfo;
  setError: (s: string) => void;
  moveNext: () => void;
  addMistake: (id: number) => Promise<void> | void;
  playTargetText: (s: string) => Promise<void>;
};

const MatchWordsExercise: React.FC<Props> = ({ exerciseInfo, setError, moveNext, addMistake, playTargetText }) => {
  const [column1, setColumn1] = useState<Array<{ First: string; Second: string }>>([]);
  const [column2, setColumn2] = useState<Array<{ First: string; Second: string }>>([]);
  const [countDone, setCountDone] = useState<number>(0);
  const [column1Selected, setColumn1Selected] = useState<MatchSelection | null>(null);
  const [column2Selected, setColumn2Selected] = useState<MatchSelection | null>(null);

  function checkAnswer(column1: MatchSelection, column2: MatchSelection) {
    if (column1.matchingValue === column2.itemValue) {
      return true;
    } else {
      addMistake(exerciseInfo.exerciseId);
      setError('You have got an error. Try again!');
      return false;
    }
  }

  function onColumnSelected(
    matchObject: MatchSelection | null,
    setToDone: () => void,
    setToError: (b: boolean) => void,
    thisColumnSelected: MatchSelection | null,
    otherColumnSelected: MatchSelection | null,
    setColumnSelected: (s: MatchSelection | null) => void,
    setOtherColumnSelected: (s: MatchSelection | null) => void
  ) {
    if (matchObject != null && thisColumnSelected != null && matchObject.itemValue !== thisColumnSelected.itemValue) {
      thisColumnSelected.setErrorState(false);
      thisColumnSelected.setIsSelected(false);
    }

    setError('');
    setColumnSelected(matchObject);

    if (matchObject != null && otherColumnSelected != null) {
      if (checkAnswer(matchObject, otherColumnSelected)) {
        otherColumnSelected.setIsSelected(false);
        setOtherColumnSelected(null);
        otherColumnSelected.setToDone();
        setColumnSelected(null);
        matchObject.setIsSelected(false);
        setToDone();
        const newDoneCount = countDone + 1;
        setCountDone(newDoneCount);
        if (column1.length <= newDoneCount) {
          moveNext();
        }
      } else {
        setToError(true);
        otherColumnSelected.setErrorState(true);
      }
    }
  }

  function onColumn1Selected(matchObject: MatchSelection | null, setToDone: () => void, setToError: (b: boolean) => void) {
    onColumnSelected(matchObject, setToDone, setToError, column1Selected, column2Selected, setColumn1Selected, setColumn2Selected);
  }

  async function onColumn2Selected(matchObject: MatchSelection | null, setToDone: () => void, setToError: (b: boolean) => void) {
    onColumnSelected(matchObject, setToDone, setToError, column2Selected, column1Selected, setColumn2Selected, setColumn1Selected);
    if (matchObject != null && matchObject.itemValue != null) {
      playTargetText(matchObject.itemValue);
    }
  }

  useEffect(() => {
    async function execAsync() {
      if (exerciseInfo && exerciseInfo.sentenceElements && exerciseInfo.answers && exerciseInfo.sentenceElements.length > 0 && exerciseInfo.sentenceElements.length == exerciseInfo.answers.length) {
        const matchesTemp: { First: string; Second: string }[] = [];
        for (let i = 0; i < exerciseInfo.sentenceElements.length; i++) {
          matchesTemp.push({
            First: exerciseInfo.sentenceElements[i].trim(),
            Second: exerciseInfo.answers[i].trim()
          });
        }
        const matchesTemp2: { First: string; Second: string }[] = [];
        const sequence = getRandomizedSequence(matchesTemp.length);
        for (let i = 0; i < sequence.length; i++) {
          matchesTemp2.push({
            First: exerciseInfo.answers[sequence[i]].trim(),
            Second: exerciseInfo.sentenceElements[sequence[i]].trim()
          });
        }
        setColumn1(matchesTemp);
        setColumn2(matchesTemp2);
      }
    }
    execAsync();
  }, [exerciseInfo]);

  return (
    <div className="exercise-outer-element exercise-outer-element-left">
      <div className="exercise-inner-element exercise-inner-element-left">
        <div className="match-words-row">
          {column1 && column1.length > 0 && (
            <div className="match-words-column">
              {column1.map((item, i) => (
                <MatchWordItem
                  key={`qi-${i}`}
                  itemValue={item.First}
                  matchingValue={item.Second}
                  setSelected={onColumn1Selected}
                  isSpoken={false}
                />
              ))}
            </div>
          )}

          {column2 && column2.length > 0 && (
            <div className="match-words-column2">
              {column2.map((item, i) => (
                <MatchWordItem
                  key={`qi-${i}`}
                  itemValue={item.First}
                  matchingValue={item.Second}
                  setSelected={onColumn2Selected}
                  isSpoken={targetIsSpoken(exerciseInfo.exerciseTypeId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchWordsExercise;
