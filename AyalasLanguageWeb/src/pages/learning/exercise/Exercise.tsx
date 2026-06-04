import { Fragment, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Ban, Eye, ListChecks, CircleDotDashed, RotateCcw, FilePenLine, History } from 'lucide-react';

import { EXERCISE_TYPES, EXERCISE_TYPE_INSTRUCTIONS, PLACEHOLDERS } from '../../../constants/learning';
import { InlineExerciseWithBlanks } from './exercise-render-types/InlineExerciseWithBlanks';
import { TwoLinesTranslationExercise } from './exercise-render-types/TwoLinesTranslationExercise';
import MatchWordsExercise from './exercise-render-types/match-words/MatchWordsExercise';
import BucketListExercise from './exercise-render-types/bucket-list/BucketListExercise';
import type { User } from '../../../types/shared/User';
import type { ExerciseHandle } from '../../../types/ui/ComponentHandles';
import type { ExerciseInfo } from '../../../types/exercise/Exercise';

type Props = {
  exerciseInfo: ExerciseInfo;
  moveNext: () => void;
  childLoaded: (id: number) => void;
  saveProgress: () => void;
  restartLesson: () => void;
  learningPathId?: number;
  changeMistakesSetting: (val: boolean) => void;
  practiseMistakesInThisPath?: boolean;
  addMistake: (id: number) => Promise<void>;
};

export const Exercise = forwardRef<ExerciseHandle, Props>(({ exerciseInfo, moveNext, childLoaded, saveProgress, restartLesson, learningPathId, changeMistakesSetting, practiseMistakesInThisPath, addMistake }, ref) => {

    const [error, setError] = useState<string>("");
    const [displayAnswer, setDisplayAnswer] = useState(false);
    const refExercise = useRef<ExerciseHandle | null>(null);
    const { user } = useOutletContext() as { user?: User };


    const toggleAnswer = function () {
        setDisplayAnswer(!displayAnswer);
    }

    const checkAnswer = function () {
        const success = refExercise.current?.checkAnswer?.() || false;
        if (!success) {
            // fire-and-forget addMistake; caller expects boolean return
            void addMistake(exerciseInfo.exerciseId);
        }
        return success;
    }

    const readdMistakes = function () {
        changeMistakesSetting(true);
    }

    const cancelMistakesAdd = function () {
        changeMistakesSetting(false);
    }

    function ExerciseTypeInstruction() {
        if (exerciseInfo && exerciseInfo.exerciseTypeId > 0) {
            const desc = EXERCISE_TYPE_INSTRUCTIONS[exerciseInfo.exerciseTypeId];
            return desc.replaceAll(PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER, user?.languageSettings?.knownLanguage || '')
                .replaceAll(PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER, user?.languageSettings?.targetLanguage || '')
        }
        return "";
    }

    useImperativeHandle(ref, () => ({
        setFocus() {
            refExercise.current?.setFocus?.();
        },
        checkAnswer() {
            return refExercise.current?.checkAnswer?.() || false;
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
            <div className="exercise-body-container">
                <div className="form-row">
                    <label className="form-label-row">{ExerciseTypeInstruction()}</label>
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
                        parentCheckAnswer={checkAnswer} user={user} />
                ) || (exerciseInfo.exerciseTypeId == EXERCISE_TYPES.MATCHING && (
                    <MatchWordsExercise
                        exerciseInfo={exerciseInfo} setError={setError}
                        moveNext={moveNext} addMistake={addMistake} />
                ) || (exerciseInfo.exerciseTypeId == EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET && (
                    <BucketListExercise ref={refExercise}
                        exerciseInfo={exerciseInfo} setError={setError}
                        moveNext={moveNext} displayAnswer={displayAnswer} />
                )) || (
                        <TwoLinesTranslationExercise ref={refExercise}
                            exerciseInfo={exerciseInfo} setError={setError}
                            moveNext={moveNext} displayAnswer={displayAnswer}
                            parentCheckAnswer={checkAnswer} user={user} />
                    ))}
            </div>
        </Fragment>
    );
});

export default Exercise;
