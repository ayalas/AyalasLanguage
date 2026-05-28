import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';

import { BucketListItem } from './BucketListItem';
import { getRandomizedSequence } from '../../../utils/utils';


export const BucketListExercise = forwardRef(({ exerciseInfo, setError, moveNext, displayAnswer }, ref) => {
    const [bucketList, setBucketList] = useState([]);
    const [answerList, setAnswerList] = useState([]);
    useImperativeHandle(ref, () => ({

        checkAnswer() {
            let canMoveNext = true;
            if (answerList.length == exerciseInfo.answers.length) {
                for (let i = 0; i < answerList.length; i++) {
                    if (answerList[i].toLowerCase() != exerciseInfo.answers[i].toLowerCase()) {
                        canMoveNext = false;
                        break;
                    }
                }
            }
            else {
                canMoveNext = false;
            }

            if (canMoveNext) {
                moveNext();
            }
            else {
                setError('You have got an error. Try again!');
            }

            return canMoveNext;
        }
    }));

    useEffect(() => {
        async function execAsync() {

            if (exerciseInfo
                && exerciseInfo.answers
                && exerciseInfo.answers.length > 0
                && exerciseInfo.extraItems
                && exerciseInfo.extraItems.length > 0
            ) {
                //prepare bucket list
                const wordsListTemp = [...exerciseInfo.extraItems, ...exerciseInfo.answers];
                const sequence = getRandomizedSequence(wordsListTemp.length);
                const wordsListRandomized = [];
                for (let i = 0; i < sequence.length; i++) {
                    wordsListRandomized.push(wordsListTemp[sequence[i]]);
                }
                setBucketList(wordsListRandomized);
            }
        }

        execAsync();
    }, [exerciseInfo]);

    function answerListItemClicked(itemValue, position) {
        //always adds to the end of answer list
        setBucketList([...bucketList, itemValue]);
        //remove from bucket list position
        setAnswerList(answerList.filter((item, ind) => ind !== position));
    }

    function bucketListItemClicked(itemValue, position) {
        //always adds to the end of answer list
        setAnswerList([...answerList, itemValue]);
        //remove from bucket list position
        setBucketList(bucketList.filter((item, ind) => ind !== position));
    }

    return (
        <>
            <div className="form-row">
                <div className="form-label-row">{exerciseInfo.data.First}</div>
            </div>
            {answerList && (
                <div className="form-row answer">
                    {
                        answerList.map((item, i) => {
                            return (
                                <BucketListItem itemValue={item} position={i} itemClicked={answerListItemClicked} />
                            );
                        })
                    }
                </div>)
            }
            {bucketList && (
                <div className="form-row bucket">
                    {
                        bucketList.map((item, i) => {
                            return (
                                <BucketListItem itemValue={item} position={i} itemClicked={bucketListItemClicked} />
                            );
                        })
                    }
                </div>)
            }
            {displayAnswer && (
                <div className="form-label-row">{exerciseInfo.data.Second}</div>
            )}
        </>
    )
});