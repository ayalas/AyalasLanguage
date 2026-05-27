import { useEffect, useState } from 'react';

import { MatchWordItem } from './MatchWordItem';
import { getRandomizedSequence } from '../../utils/utils';

export function MatchWordsExercise({ exerciseInfo, setError, moveNext }) {
    const [matches, setMatchs] = useState([]);
    const [countDone, setCountDone] = useState(0);
    const [column1Selected, setColumn1Selected] = useState(null);
    const [column2Selected, setColumn2Selected] = useState(null);

    function checkAnswer(column1, column2) {
        if (column1.matchingValue == column2.itemValue) {
            return true;
        }
        else {
            setError('You have got an error. Try again!');
            return false;
        }
    }

    function onColumnSelected(matchObject, setToDone, setToError, thisColumnSelected, otherColumnSelected, setColumnSelected, setOtherColumnSelected) {
        //if we have a new selection, clear previous selection of the same column
        if (matchObject != null && thisColumnSelected != null &&
            matchObject.itemValue != thisColumnSelected.itemValue) {
            thisColumnSelected.setErrorState(false);
            thisColumnSelected.setIsSelected(false);
        }
        //clear error initially
        setError("");
        //update the selection here for this column (async)
        setColumnSelected(matchObject);
        
        //check asnwer
        if (matchObject != null && otherColumnSelected != null) {
            if (checkAnswer(matchObject, otherColumnSelected)) {
                
                //mark matching item as done as well
                otherColumnSelected.setIsSelected(false);
                setOtherColumnSelected(null);
                otherColumnSelected.setToDone();
                //set me as unselected as well
                setColumnSelected(null);
                matchObject.setIsSelected(false);
                setToDone(); //mark item as done
                //increase done
                const newDoneCount = countDone + 1;
                //save done count (async)
                setCountDone(newDoneCount);
                //see if we reached the end
                if (matches.length <= newDoneCount) {
                    //we are done - move to the next question on the lesson
                    moveNext();
                }
            }
            else {
                setToError(true);
                otherColumnSelected.setErrorState(true);
            }
        }
    }

    function onColumn1Selected(matchObject, setToDone, setToError) {
        onColumnSelected(matchObject, setToDone, setToError, column1Selected, column2Selected, setColumn1Selected, setColumn2Selected);
    }

    function onColumn2Selected(matchObject, setToDone, setToError) {
        onColumnSelected(matchObject, setToDone, setToError, column2Selected, column1Selected, setColumn2Selected, setColumn1Selected);
    }

    useEffect(() => {
        async function execAsync() {
            if (exerciseInfo
                && exerciseInfo.sentenceElements
                && exerciseInfo.answers
                && exerciseInfo.sentenceElements.length > 0
                && exerciseInfo.sentenceElements.length == exerciseInfo.answers.length
            ) {
                const matchesTemp = [];
                for (let i = 0; i < exerciseInfo.sentenceElements.length; i++) {
                    matchesTemp.push({
                        First: exerciseInfo.sentenceElements[i].trim(),
                        Second: exerciseInfo.answers[i].trim()
                    })
                }

                const matchesTemp2 = [];
                //now create another array with a different order
                const sequence = getRandomizedSequence(matchesTemp.length);

                for (let i = 0; i < sequence.length; i++) {
                    matchesTemp2.push({
                        First: exerciseInfo.sentenceElements[sequence[i]].trim(),
                        Second: exerciseInfo.answers[sequence[i]].trim()
                    })
                }

                //now create a third array with the wrong pairs, for rendering the exercise
                const wrongPairsForExercise = [];
                for (let i = 0; i < matchesTemp.length; i++) {
                    wrongPairsForExercise.push(
                        {
                            Column1: matchesTemp[i],
                            Column2: matchesTemp2[i]
                        }
                    )
                }

                setMatchs(wrongPairsForExercise);
            }
        }

        execAsync();
    }, [exerciseInfo]);

    return (
        <div className="match-words-container">
            {matches && matches.length > 0 && (
                matches.map((match, i) => {

                    return (
                        <div className="match-words-row" key={`qa-${i}`}>
                            <MatchWordItem key={`qi-${i}`}

                                itemValue={match.Column1.First}
                                matchingValue={match.Column1.Second}
                                setSelected={onColumn1Selected} />

                            <MatchWordItem key={`ai-${i}`}

                                itemValue={match.Column2.Second}
                                matchingValue={match.Column2.First}
                                setSelected={onColumn2Selected} />
                        </div>
                    );
                })
            )}
        </div>
    );
};