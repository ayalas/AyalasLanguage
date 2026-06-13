import React, { useState } from 'react';

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
  
};

export const MatchWordItem: React.FC<Props> = ({ itemValue, matchingValue, setSelected }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [isDone, setIsDone] = useState(false);

  function setToDone() {
    setIsDone(true);
    setErrorState(false);
    setIsSelected(false);
  }

  function clickButton(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
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

  const className = `match-word-item-button${isDone ? ' match-words-item-done' : errorState ? ' match-words-item-error' : isSelected ? ' match-words-item-selected' : ''}`;

  return (
    <div className="match-word-item-cell">
      <button data-testid="click-button" className={className} onClick={clickButton}>{itemValue}</button>
    </div>
  );
};

export default MatchWordItem;
