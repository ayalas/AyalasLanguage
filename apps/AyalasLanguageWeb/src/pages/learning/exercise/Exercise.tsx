import { Fragment, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Ban, Eye, ListChecks, CircleDotDashed, RotateCcw, FilePenLine, History, TicketPlus, ArrowBigLeft } from 'lucide-react';
import axios from 'axios';
import { EXERCISE_TYPE_INSTRUCTIONS, LANGUAGE_TO_POLLY_MAP, PLACEHOLDERS } from '../../../constants/learning';
import { InlineExerciseWithBlanks } from './exercise-render-types/InlineExerciseWithBlanks';
import { TwoLinesTranslationExercise } from './exercise-render-types/TwoLinesTranslationExercise';
import MatchWordsExercise from './exercise-render-types/match-words/MatchWordsExercise';
import BucketListExercise from './exercise-render-types/bucket-list/BucketListExercise';
import type { User } from '../../../types/shared/User';
import type { ExerciseHandle } from '../../../types/ui/ComponentHandles';
import type { ExtendedExerciseInfo } from '../../../types/exercise/Exercise';
import { puter } from "@heyputer/puter.js";
import { initializePuter, isSecure } from '../../../utils/utils';
import { canRevealAnswers, hasExtraOptions, isMatchingType, shouldPlayAnswer, showCheckAnswers, supportsAlternativeAnswers, usesInlineExerciseWithBlanks } from '../../../logic/ExerciseTypeLogic';

type Props = {
    exerciseInfo: ExtendedExerciseInfo;
    moveNext: () => void;
    movePrev: () => void;
    childLoaded: (id: number) => void;
    saveProgress: () => void;
    restartLesson: () => void;
    learningPathId?: number;
    changeMistakesSetting: (val: boolean) => void;
    practiseMistakesInThisPath?: boolean;
    addMistake: (id: number) => Promise<void>;
    ref: React.Ref<ExerciseHandle>;
};

export const Exercise = function ({ exerciseInfo, moveNext, movePrev, childLoaded, saveProgress, restartLesson, learningPathId, changeMistakesSetting, practiseMistakesInThisPath, addMistake, ref }: Props) {

    const [error, setError] = useState<string>("");
    const [displayAnswer, setDisplayAnswer] = useState(false);
    const refExercise = useRef<ExerciseHandle | null>(null);
    const { user } = useOutletContext() as { user?: User };
    const [puterSignedIn, setPuterSignedIn] = useState(false);


    const playTargetText = async function (textToPlay: string | undefined | null = null) {
        try {

            if (isSecure() && exerciseInfo.exerciseObject != null) {
                const langCode = user?.languageSettings?.targetLanguageCode;
                if (langCode != undefined) {
                    const pollyObject = LANGUAGE_TO_POLLY_MAP[langCode]
                    if (pollyObject != null) {

                        let tempPuterSignin = puterSignedIn;
                        if (!tempPuterSignin) {
                            tempPuterSignin = (await initializePuter() == true);
                            setPuterSignedIn(tempPuterSignin);
                        }

                        if (!tempPuterSignin) {
                            return;
                        }

                        textToPlay = textToPlay != null ? textToPlay : exerciseInfo.exerciseObject.Second;
                        if (textToPlay != null && textToPlay != "") {
                            const options = {
                                provider: 'aws-polly',
                                voice: pollyObject.voice,
                                test_mode: false,
                                engine: pollyObject.engine,
                                language: pollyObject.language,
                                ssml: false
                            };

                            const result = await puter.ai.txt2speech(textToPlay, options) as HTMLAudioElement;
                            await result.play();
                        }
                    }
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }

    const toggleAnswer = function () {
        const newValue = !displayAnswer;
        setDisplayAnswer(newValue);

        if (newValue && shouldPlayAnswer(exerciseInfo.exerciseTypeId)) {
            playTargetText();
        }
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
            return desc.replaceAll(PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER, user?.languageSettings?.knownLanguage || '')
                .replaceAll(PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER, user?.languageSettings?.targetLanguageEnglishName || '')
        }
        return "";
    }

    async function addAlternativeAnswer(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        if (!supportsAlternativeAnswers(exerciseInfo.exerciseTypeId)) {
            return;
        }
        if (exerciseInfo.exerciseObject == null) return;
        const dataObj = { ...exerciseInfo.exerciseObject };

        const alternative = refExercise.current?.getCurrentAnswer?.();
        if (alternative == null || alternative === "") {
            return;
        }
        let updateNeeded = false;
        if (dataObj?.Alternatives == null) {
            dataObj.Alternatives = [alternative];
            updateNeeded = true;
        }
        else if (!dataObj.Alternatives.includes(alternative)) {
            dataObj.Alternatives.push(alternative);
            updateNeeded = true;
        }

        if (updateNeeded) {
            const dataString = JSON.stringify(dataObj);
            await axios.put(`/api/creator/exercise/${exerciseInfo.exerciseId}`, { Data: dataString });
        }
        setError("");
        toggleAnswer();
        moveNext();
    }

    useImperativeHandle(ref, () => ({
        setFocus() {
            refExercise.current?.setFocus?.();
        },
        checkAnswer() {
            return refExercise.current?.checkAnswer?.() || false;
        },
        getCurrentAnswer() {
            return refExercise.current?.getCurrentAnswer?.() || '';
        }
    }));

    useEffect(() => {
        childLoaded(exerciseInfo.exerciseId);
        async function runAsync() {
            setPuterSignedIn(await initializePuter() == true);
        }
        runAsync();
    }, [exerciseInfo, childLoaded]);

    const onBackClick = function (e: React.MouseEvent) {
        e.preventDefault();

        movePrev();
    }

    return (
        <Fragment key={`ex${exerciseInfo.exerciseId}row`}>
            <div className="form-row">
                {
                    canRevealAnswers(exerciseInfo.exerciseTypeId) && (
                        <div className="form-button-cell">
                            <button data-testid="reveal-answer" type="button" onClick={toggleAnswer} className="form-button" title="Reveal answer"><Eye /></button>
                        </div>
                    )
                }
                <div className="form-button-cell">
                    <button data-testid="save-progress" type="button" onClick={saveProgress} className="form-button" title="Save progress"><CircleDotDashed /></button>
                </div>
                <div className="form-button-cell">
                    <button data-testid="restart-lesson" type="button" onClick={restartLesson} className="form-button" title="Restart lesson"><RotateCcw /></button>
                </div>
                {practiseMistakesInThisPath && (
                    <div className="form-button-cell">
                        <button data-testid="cancel-readding" type="button" onClick={cancelMistakesAdd} className="form-button" title="Cancel readding my mistakes here"><Ban /></button>
                    </div>
                ) || (
                        <div className="form-button-cell">
                            <button data-testid="readd-mistakes" type="button" onClick={readdMistakes} className="form-button" title="Readd my mistakes here"><History /></button>
                        </div>
                    )}
                {displayAnswer && error != ""
                    && (supportsAlternativeAnswers(exerciseInfo.exerciseTypeId)) && (
                        <div className="form-button-cell">
                            <button data-testid="add-alternative-answer" type="button" className="form-button" title="Add alternative answer" onClick={addAlternativeAnswer}><TicketPlus /></button>
                        </div>
                    )}
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

                {usesInlineExerciseWithBlanks(exerciseInfo.exerciseTypeId) && (
                    <InlineExerciseWithBlanks ref={refExercise}
                        exerciseInfo={exerciseInfo} setError={setError}
                        moveNext={moveNext} displayAnswer={displayAnswer}
                        parentCheckAnswer={checkAnswer} user={user} playTargetText={playTargetText} />
                ) || (isMatchingType(exerciseInfo.exerciseTypeId) && (
                    <MatchWordsExercise
                        exerciseInfo={exerciseInfo} setError={setError}
                        moveNext={moveNext} addMistake={addMistake} playTargetText={playTargetText} />
                ) || (hasExtraOptions(exerciseInfo.exerciseTypeId) && (
                    <BucketListExercise ref={refExercise}
                        exerciseInfo={exerciseInfo} setError={setError}
                        moveNext={moveNext} displayAnswer={displayAnswer} user={user} playTargetText={playTargetText} />
                )) || (
                        <TwoLinesTranslationExercise ref={refExercise}
                            exerciseInfo={exerciseInfo} setError={setError}
                            moveNext={moveNext} displayAnswer={displayAnswer}
                            parentCheckAnswer={checkAnswer} user={user} playTargetText={playTargetText} />
                    ))}
            </div>
            <div className="exercise-footer">
                {(exerciseInfo.index ?? 0) > 0 && (
                    <div className="exercise-footer-back">
                        <button data-testid="back" className="form-button button-back" onClick={onBackClick}><ArrowBigLeft /> Prev</button>
                    </div>
                )}
                {
                    showCheckAnswers(exerciseInfo.exerciseTypeId) && (
                        <div className="exercise-footer-next">
                            <button data-testid="check-my-answers" type="button" onClick={checkAnswer} className="form-button check-answer-button" title="Check my answers"><ListChecks />&nbsp;Check</button>
                        </div>
                    )
                }
            </div>
        </Fragment>
    );
};

export default Exercise;
