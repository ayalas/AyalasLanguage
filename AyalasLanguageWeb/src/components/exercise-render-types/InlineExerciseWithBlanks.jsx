import { Fragment, useRef, forwardRef, useImperativeHandle } from 'react';


import { ExerciseInput } from '../ExerciseInput';

export const InlineExerciseWithBlanks = forwardRef(({ exerciseInfo, setError, moveNext, displayAnswer }, ref) => {
    const questionsRefMap = useRef(new Map());


    function internalCheckAnswer() {
        const thisQuestionRefs = new Map(
                [...questionsRefMap.current.entries()].filter(([key, value]) => key.startsWith(`${exerciseInfo.exerciseId}-`))
            );

            if (thisQuestionRefs.length < exerciseInfo.answers.length) {
                setError('please fill in all the input elements');
            }
            let canMoveNext = true;

            for (let j = 0; j < exerciseInfo.answers.length; j++) {
                const inputRef = thisQuestionRefs.get(`${exerciseInfo.exerciseId}-${j}`);

                if (inputRef.getUserAnswer().trim().toLowerCase() != exerciseInfo.answers[j].trim().toLowerCase()) {
                    inputRef.setToError();
                    canMoveNext = false;

                }
            }
            if (canMoveNext) {
                moveNext();
            }
            else {
                setError('You have got some errors. Try again!');
            }
    }

    // This defines what the parent can access via the ref
    useImperativeHandle(ref, () => ({
        setFocus() {
            const firstInput = questionsRefMap.current.get(`${exerciseInfo.exerciseId}-0`);
            if (firstInput) {
                firstInput.setFocus();
            }
        },
        checkAnswer() {
            internalCheckAnswer();
        }
    }));



    return (
        <>
            <div className="form-label-row">
                {
                    exerciseInfo.sentenceElements.map((part, i) => {
                        // Function to safely set/delete items in the Map
                        const setRef = (el) => {
                            questionsRefMap.current.set(`${exerciseInfo.exerciseId}-${i}`, el);
                        };

                        return (
                            <Fragment key={`ex${exerciseInfo.exerciseId}input-container${i}`}>
                                {i == 0 && part == "" && (
                                    <ExerciseInput key={`ex${exerciseInfo.exerciseId}input${i}`}
                                        ref={setRef}
                                        charWidth={(2 + exerciseInfo.answers[i].length)}
                                        checkAnswer={internalCheckAnswer}
                                    />
                                )}
                                <div className="content-line-part">{part}</div>
                                {(i > 0 || part != "") && (exerciseInfo.answers.length > i) && (
                                    <ExerciseInput key={`ex${exerciseInfo.exerciseId}input${i}`}
                                        ref={setRef}
                                        charWidth={(2 + exerciseInfo.answers[i].length)}
                                        checkAnswer={internalCheckAnswer}
                                    />
                                )}
                            </Fragment>
                        );
                    })
                }</div>
            {displayAnswer && (
                <div className="form-label-row">{exerciseInfo.data.Second}</div>
            )}
        </>
    );
});