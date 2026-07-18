import useTextStyles from '@/lib/useTextStyles';
import { CirclePlay } from 'lucide-react-native';
import React, { useState } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

export type MatchSelection = {
  itemValue: string;
  matchingValue: string;
  setErrorState: (v: boolean) => void;
  setIsSelected: (v: boolean) => void;
  setToDone: () => void;
};

type Props = {
  itemValue: string;
  matchingValue: string;
  setSelected: (matchObject: MatchSelection | null, setToDone: () => void, setToError: (v: boolean) => void) => void;
  isSpoken: boolean;
};

export default function MatchWordItem ({ itemValue, matchingValue, setSelected, isSpoken }:Props) {
  const [isSelected, setIsSelected] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { styles } = useTextStyles();

  function setToDone() {
    setIsDone(true);
    setErrorState(false);
    setIsSelected(false);
  }

  function clickButton() {
    if (isDone) return;

    setErrorState(false);

    const tempIsSelected = !isSelected;

    if (tempIsSelected) {
      setSelected({ itemValue, matchingValue, setErrorState, setIsSelected, setToDone }, setToDone, setErrorState);
    } else {
      setSelected(null, setToDone, setErrorState);
    }
    setIsSelected(tempIsSelected);
  }

  const classColor = isDone ? ' match-words-item-done' : errorState ? ' match-words-item-error' : isSelected ? ' match-words-item-selected' : '';
  const className = `match-word-item-button${classColor}`;

  return (
    <View className="match-word-item-cell">
      <TouchableOpacity testID="click-button" className={className} onPress={clickButton}>
        {!isSpoken && (
          <Text style={[styles.exerciseText, isDone? styles.doneCell : errorState? styles.errorCell : isSelected? styles.selectedCell : styles.exerciseText ]}>
          {itemValue}
          </Text>
        ) || (
          <CirclePlay className='color-brand-play' />
        )}
      </TouchableOpacity>
    </View>
  );
};
