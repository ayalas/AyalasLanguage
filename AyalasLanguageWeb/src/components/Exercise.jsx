import { Fragment, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Eye, ListChecks, CircleDotDashed, RotateCcw, FilePenLine } from 'lucide-react';

import {ExerciseInput} from './ExerciseInput';

export const Exercise = forwardRef(({ exerciseInfo, moveNext, childLoaded, saveProgress, restartLesson, learningPathId }, ref) => {
    const questionsRefMap = useRef(new Map());
    const [error, setError] = useState("");
    const [displayAnswer, setDisplayAnswer] = useState(false);

    const checkAnswer = function() {

        const thisQuestionRefs = new Map(
            [...questionsRefMap.current.entries()].filter(([key, value]) => key.startsWith(`${exerciseInfo.exerciseId}-`))
        );

        if (thisQuestionRefs.length < exerciseInfo.answers.length) {
            setError('please fill in all the input elements');
        }
        let canMoveNext = true;

        for (let j=0; j<exerciseInfo.answers.length; j++)
        {
            const inputRef = thisQuestionRefs.get(`${exerciseInfo.exerciseId}-${j}`);

            if (inputRef.getUserAnswer() != exerciseInfo.answers[j]) {
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

    const toggleAnswer = function() {
        setDisplayAnswer(!displayAnswer);
    }

    // This defines what the parent can access via the ref
    useImperativeHandle(ref, () => ({
        setFocus() {
            const firstInput = questionsRefMap.current.get(`${exerciseInfo.exerciseId}-0`);
            if (firstInput) {
                firstInput.setFocus();
            }
        }
    }));

    useEffect(() => {
        childLoaded(exerciseInfo.exerciseId);
    }, [exerciseInfo, childLoaded]);

    return (
        <Fragment key={`ex${exerciseInfo.exerciseId}row`}>
            <div className="form-row">
                <div className="form-button-cell">
                    <button type="button" onClick={checkAnswer} className="form-button" title="Check my answers"><ListChecks /></button>
                </div>
                <div className="form-button-cell">
                    <button type="button" onClick={toggleAnswer} className="form-button" title="Reveal answer"><Eye /></button>
                </div>
                <div className="form-button-cell">
                    <button type="button" onClick={saveProgress} className="form-button" title="Save progress"><CircleDotDashed /></button>
                </div>
                <div className="form-button-cell">
                    <button type="button" onClick={restartLesson} className="form-button" title="Restart lesson"><RotateCcw /></button>
                </div>
                <div className="form-button-cell">
                    <Link to={`/author/path/${learningPathId}`} className="link-button" title="Edit lesson"><FilePenLine /></Link>
                </div>
            </div>
            {error != "" && (
                <div className="form-row">
                    <label className="form-error">{error}</label>
                </div>
            )}
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
                                        charWidth={(1 + exerciseInfo.answers[i].length)} 
                                        checkAnswer={checkAnswer}
                                        />
                                )}
                                {part}
                                {(i > 0 || part != "") && (exerciseInfo.answers.length > i) && (
                                    <ExerciseInput key={`ex${exerciseInfo.exerciseId}input${i}`} 
                                        ref={setRef} 
                                        charWidth={(1 + exerciseInfo.answers[i].length)} 
                                        checkAnswer={checkAnswer}
                                        />
                                )}
                            </Fragment>
                        );
                    })
                }</div>
            { displayAnswer && (
                <div className="form-label-row">{exerciseInfo.data.Second}</div>
            )}
            
        </Fragment>
    );
});