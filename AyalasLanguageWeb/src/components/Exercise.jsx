import { Fragment, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Ban, Eye, ListChecks, CircleDotDashed, RotateCcw, FilePenLine, History } from 'lucide-react';

import { EXERCISE_TYPES } from '../constants/learning';
import { InlineExerciseWithBlanks } from './exercise-render-types/InlineExerciseWithBlanks';
import { TwoLinesTranslationExercise } from './exercise-render-types/TwoLinesTranslationExercise';
import { MatchWordsExercise } from './exercise-render-types/MatchWordsExercise';

export const Exercise = forwardRef(({ exerciseInfo, moveNext, childLoaded, saveProgress, restartLesson, learningPathId, changeMistakesSetting, practiseMistakesInThisPath, addMistake }, ref) => {

    const [error, setError] = useState("");
    const [displayAnswer, setDisplayAnswer] = useState(false);
    const refExercise = useRef(null);


    const toggleAnswer = function () {
        setDisplayAnswer(!displayAnswer);
    }

    const checkAnswer = async function () {
        const success = refExercise.current.checkAnswer();
        if (!success) {
            await addMistake(exerciseInfo.exerciseId);
        }
    }

    const readdMistakes = function () {
        changeMistakesSetting(true);
    }

    const cancelMistakesAdd = function () {
        changeMistakesSetting(false);
    }

    // This defines what the parent can access via the ref
    useImperativeHandle(ref, () => ({
        setFocus() {
            refExercise.current.setFocus();
        }
    }));

    useEffect(() => {
        childLoaded(exerciseInfo.exerciseId);
    }, [exerciseInfo, childLoaded]);

    return (
        <Fragment key={`ex${exerciseInfo.exerciseId}row`}>
            <div className="form-row">
                {
                    exerciseInfo.exerciseTypeId != EXERCISE_TYPES.MATCHING && (
                        <>
                            <div className="form-button-cell">
                                <button type="button" onClick={checkAnswer} className="form-button" title="Check my answers"><ListChecks /></button>
                            </div>
                            <div className="form-button-cell">
                                <button type="button" onClick={toggleAnswer} className="form-button" title="Reveal answer"><Eye /></button>
                            </div>
                        </>
                    )
                }

                <div className="form-button-cell">
                    <button type="button" onClick={saveProgress} className="form-button" title="Save progress"><CircleDotDashed /></button>
                </div>
                <div className="form-button-cell">
                    <button type="button" onClick={restartLesson} className="form-button" title="Restart lesson"><RotateCcw /></button>
                </div>
                {practiseMistakesInThisPath && (
                    <div className="form-button-cell">
                        <button type="button" onClick={cancelMistakesAdd} className="form-button" title="Cancel readding my mistakes here"><Ban /></button>
                    </div>
                ) || (
                        <div className="form-button-cell">
                            <button type="button" onClick={readdMistakes} className="form-button" title="Readd my mistakes here"><History /></button>
                        </div>
                    )}
                <div className="form-button-cell">
                    <Link to={`/author/path/${learningPathId}`} className="link-button" title="Edit lesson"><FilePenLine /></Link>
                </div>
            </div>
            {error != "" && (
                <div className="form-row">
                    <label className="form-error">{error}</label>
                </div>
            )}

            {exerciseInfo.exerciseTypeId == EXERCISE_TYPES.FILL_IN_THE_BLANKS && (
                <InlineExerciseWithBlanks ref={refExercise}
                    exerciseInfo={exerciseInfo} setError={setError}
                    moveNext={moveNext} displayAnswer={displayAnswer}
                    parentCheckAnswer={checkAnswer} />
            ) || (exerciseInfo.exerciseTypeId == EXERCISE_TYPES.MATCHING && (
                <MatchWordsExercise 
                    exerciseInfo={exerciseInfo} setError={setError}
                    moveNext={moveNext} />
            )) || (
                    <TwoLinesTranslationExercise ref={refExercise}
                        exerciseInfo={exerciseInfo} setError={setError}
                        moveNext={moveNext} displayAnswer={displayAnswer}
                        parentCheckAnswer={checkAnswer} />
                )}
        </Fragment>
    );
});