import { useRef, forwardRef, useImperativeHandle } from 'react';

import { ExerciseInput } from '../ExerciseInput';

export const TwoLinesTranslationExercise = forwardRef(({ exerciseInfo, setError, moveNext, displayAnswer, parentCheckAnswer }, ref) => {
    const inputRef = useRef(null);

    useImperativeHandle(ref, () => ({
        setFocus() {
            const firstInput = inputRef.current;
            if (firstInput) {
                firstInput.setFocus();
            }
        },
        checkAnswer() {
            const thisQuestionRef = inputRef.current;

            let canMoveNext = true;
            if (thisQuestionRef.getUserAnswer().trim().toLowerCase() != exerciseInfo.data.Second.trim().toLowerCase()) {
                thisQuestionRef.setToError();
                canMoveNext = false;
            }

            if (canMoveNext) {
                moveNext();
            }
            else {
                setError('You have got some errors. Try again!');
            }

            return canMoveNext;
        }
    }));

    return (
        <>
            <div className="form-label-row">
                <div className="form-label-row">{exerciseInfo.data.First}</div>
            </div>
            <div className="form-label-row">
                <ExerciseInput
                    ref={inputRef}
                    charWidth={(2 + exerciseInfo.data.Second.length)}
                    checkAnswer={parentCheckAnswer}
                />
            </div>
            {displayAnswer && (
                <div className="form-label-row">{exerciseInfo.data.Second}</div>
            )}
        </>
    );
});