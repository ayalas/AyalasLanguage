import { useState } from 'react';

export function MatchWordItem ({ itemValue, matchingValue, setSelected }) {
    const [isSelected, setIsSelected] = useState(false);
    const [errorState, setErrorState] = useState(false);
    const [isDone, setIsDone] = useState(false);
  
    // This defines what the parent can access via callbacks, no need of ref
 
    function setToDone() {
        setIsDone(true);
        setErrorState(false);
        setIsSelected(false);
    }

    function clickButton(e) {
        e.preventDefault();
        if (isDone) {
            return;
        }

        //clear error for the new selection on the item
        setErrorState(false);

        const tempIsSelected = !isSelected;

        if (tempIsSelected) {
            setSelected({
                itemValue,
                matchingValue,
                setErrorState,
                setIsSelected,
                setToDone
            }, setToDone, setErrorState);
        }
        else {
            setSelected(null, setToDone, setErrorState);
        }
        setIsSelected(tempIsSelected);
    }

    return (
        <div className="match-word-item-cell">
            <button className={
                `match-word-item-button${ isDone? " match-words-item-done" : errorState? " match-words-item-error" : isSelected? " match-words-item-selected" : "" }` }
            onClick={clickButton}>{itemValue}</button>
        </div>
    );
};