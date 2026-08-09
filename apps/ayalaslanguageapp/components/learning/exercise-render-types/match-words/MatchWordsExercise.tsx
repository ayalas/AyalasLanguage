import React, { useEffect, useState } from 'react';
import MatchWordItem from './MatchWordItem';
import type { ExtendedExerciseInfo, MatchCell, MatchSelection } from '@ayalaslanguage/types/sharedfrontlib/learning';
import {EXERCISE_TYPE_LOGIC, randomizeMatchData } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { View } from 'react-native';

type Props = {
  exerciseInfo: ExtendedExerciseInfo;
  setError: (s: string) => void;
  moveNext: () => void;
  addMistake: (id: number) => Promise<void> | void;
  playTargetText: (s: string) => Promise<void>;
};

export default function MatchWordsExercise ({ exerciseInfo, setError, moveNext, addMistake, playTargetText }:Props)  {
  const [column1, setColumn1] = useState<MatchCell[]>([]);
  const [column2, setColumn2] = useState<MatchCell[]>([]);
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
    if (matchObject != null && thisColumnSelected != null && matchObject.itemId !== thisColumnSelected.itemId) {
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
      randomizeMatchData(exerciseInfo, setColumn1, setColumn2);
    }
    execAsync();
  }, [exerciseInfo]);

  return (
    <View className="exercise-outer-element exercise-outer-element-left">
      <View className="exercise-inner-element exercise-inner-element-left">
        <View className="match-words-row">
          {column1 && column1.length > 0 && (
            <View className="match-words-column">
              {column1.map((item, i) => (
                <MatchWordItem
                  key={`qi-${i}`}
                  itemId={item.Id}
                  itemValue={item.First}
                  matchingValue={item.Second}
                  setSelected={onColumn1Selected}
                  isSpoken={false}
                />
              ))}
            </View>
          )}

          {column2 && column2.length > 0 && (
            <View className="match-words-column2">
              {column2.map((item, i) => (
                <MatchWordItem
                  key={`qi-${i}`}
                  itemId={item.Id}
                  itemValue={item.First}
                  matchingValue={item.Second}
                  setSelected={onColumn2Selected}
                  isSpoken={EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].TargetIsSpoken}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
