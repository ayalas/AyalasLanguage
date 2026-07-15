import { Fragment, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Ban, Eye, ListChecks, CircleDotDashed, RotateCcw, History, TicketPlus, ArrowBigLeft, FilePenLine } from 'lucide-react';
import axios from 'axios';
import { InlineExerciseWithBlanks } from './exercise-render-types/InlineExerciseWithBlanks';
import { TwoLinesTranslationExercise } from './exercise-render-types/TwoLinesTranslationExercise';
import MatchWordsExercise from './exercise-render-types/match-words/MatchWordsExercise';
import BucketListExercise from './exercise-render-types/bucket-list/BucketListExercise';

import type { ExerciseHandle } from '../../../types/ui/ComponentHandles';

import { puter } from "@heyputer/puter.js";
import { initializePuter, isSecure } from '../../../utils/utils'
import { EXERCISE_TYPE_LOGIC } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { type ExtendedExerciseInfo, LANGUAGE_TO_POLLY_MAP, PLACEHOLDERS } from '@ayalaslanguage/types/sharedfrontlib/learning';

import { ActionsMenuComponent, type ActionsMenuItem } from '../../../components/ActionsMenuComponent';
import { Toaster } from 'sonner';
import { useMistakesReadd } from '../../../components/useMistakesReadd';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';

type Props = {
    exerciseInfo: ExtendedExerciseInfo;
    moveNext: () => void;
    movePrev: () => void;
    childLoaded: (id: number) => void;
    saveProgress: () => void;
    restartLesson: () => void;
    practiseMistakesInitialValue?: boolean;
    addMistake: (id: number) => Promise<void>;
    ref: React.Ref<ExerciseHandle>;
};

export const Exercise = function ({ exerciseInfo, moveNext, movePrev, childLoaded, saveProgress, restartLesson, practiseMistakesInitialValue, addMistake, ref }: Props) {

    const [error, setError] = useState<string>("");
    const [displayAnswer, setDisplayAnswer] = useState(false);
    const refExercise = useRef<ExerciseHandle | null>(null);
    const { user } = useOutletContext() as { user?: User };
    const [puterSignedIn, setPuterSignedIn] = useState(false);

    const { practiseMistakesInThisPath, readdMistakes, cancelMistakesAdd } = useMistakesReadd({ learningPathId: exerciseInfo.learningPathId , 
        exerciseId: exerciseInfo.exerciseId, setError, initialValue: practiseMistakesInitialValue});

    const playTargetText = async function (textToPlay: string | undefined | null = null) {
        try {

            if (isSecure() && exerciseInfo.exerciseObject != null && !user?.disablePuter) {
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

        if (newValue) {
            if (EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShouldPlayAnswer) {
                playTargetText();
            }
            addMistake(exerciseInfo.exerciseId);
        }
    }

    const checkAnswer = function () {
        const success = refExercise.current?.checkAnswer?.() || false;
        if (!success) {
            // fire-and-forget addMistake; caller expects boolean return
            addMistake(exerciseInfo.exerciseId);
        }
        return success;
    }

    function ExerciseTypeInstruction() {
        if (exerciseInfo && exerciseInfo.exerciseTypeId > 0) {
            const desc = EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].GenerationInfo?.instruction ?? '';
            return desc.replaceAll(PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER, user?.languageSettings?.knownLanguage || '')
                .replaceAll(PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER, user?.languageSettings?.targetLanguageEnglishName || '')
        }
        return "";
    }

    async function addAlternativeAnswer(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        if (!EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].SupportsAlternativeAnswers) {
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
            if (!user?.disablePuter) {
                if (isSecure() && !puter.auth.isSignedIn()) {
                    setError("The app is attempting to use the Puter library to facilitate sounds and automatic AI exercise generation. If that does not work out for you, you can disable Puter in the Profile settings page.");
                }
                const tempSignIn = (await initializePuter() == true);
                setPuterSignedIn(tempSignIn);
            }
        }
        runAsync();
    }, [exerciseInfo, childLoaded, user]);

    const onBackClick = function (e: React.MouseEvent) {
        e.preventDefault();

        movePrev();
    }

    return (
        <Fragment key={`ex${exerciseInfo.exerciseId}row`}>
            <Toaster position="top-center" richColors />
            
            <div className="exercise-body-container">
                <div className="form-row">
                    <label className="form-label-row">{ExerciseTypeInstruction()}</label>
                </div>
                {error != "" && (
                    <div className="form-row">
                        <label className="form-error">{error}</label>
                    </div>
                )}

                {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].UsesInlineExerciseWithBlanks && (
                    <InlineExerciseWithBlanks ref={refExercise}
                        exerciseInfo={exerciseInfo} setError={setError}
                        moveNext={moveNext} displayAnswer={displayAnswer}
                        parentCheckAnswer={checkAnswer} user={user} playTargetText={playTargetText} />
                ) || (EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].IsMatchingType && (
                    <MatchWordsExercise
                        exerciseInfo={exerciseInfo} setError={setError}
                        moveNext={moveNext} addMistake={addMistake} playTargetText={playTargetText} />
                ) || (EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].HasExtraOptions && (
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
            
            <div className="buttons-container">
                <ActionsMenuComponent items={[
                    {
                        dataTestId: "restart-lesson",
                        children: <><RotateCcw />&nbsp;Restart Lesson</>,
                        onClick: restartLesson,
                    },
                    {
                        dataTestId: "cancel-readding",
                        children: <><Ban />&nbsp;Stop readding my mistakes</>,
                        onClick: cancelMistakesAdd,
                        isVisible: practiseMistakesInThisPath,
                    },
                    {
                        dataTestId: "readd-mistakes",
                        children: <><History />&nbsp;Readd my mistakes here</>,
                        onClick: readdMistakes,
                        isVisible: !practiseMistakesInThisPath,
                    },
                    {
                        dataTestId: "add-alternative-answer",
                        children: <><TicketPlus />&nbsp;Add alternative answer</>,
                        onClick: addAlternativeAnswer,
                        isVisible: displayAnswer && error != "" && EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].SupportsAlternativeAnswers,
                    },
                    {
                        dataTestId: "edit-lesson",
                        children: <><FilePenLine />&nbsp;Edit lesson</>,
                        toPath: `/author/path/${exerciseInfo.learningPathId}`,
                    },
                    {
                        dataTestId: "save-progress",
                        children: <><CircleDotDashed />&nbsp;Save & Exit</>,
                        onClick: saveProgress,
                        className: "lesson-button-save",
                    }
                ] as ActionsMenuItem[]} anchorTitle="More" />
                {
                    EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].CanRevealAnswers && (
                        <div className="form-button-cell">
                            <button data-testid="reveal-answer" type="button" onClick={toggleAnswer} className="top-button lesson-button-reveal" title="Reveal answer"><Eye />&nbsp;{displayAnswer && "Hide" || "Reveal"}</button>
                        </div>
                    )
                }
            </div>
            <div className="exercise-footer">

                {(exerciseInfo.index ?? 0) > 0 && (
                    <div className="exercise-footer-back">
                        <button data-testid="back" className="lesson-button-left lesson-button-back" onClick={onBackClick}><ArrowBigLeft /> Prev</button>
                    </div>
                )}
                {
                    EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShowsCheckAnswers && (
                        <div className={`exercise-footer-next ${(exerciseInfo.index ?? 0) > 0 ? "" : "exercise-footer-next-noback"}`}>
                            <button data-testid="check-my-answers" type="button" onClick={checkAnswer} className="form-button check-answer-button" title="Check my answers"><ListChecks />&nbsp;Check</button>
                        </div>
                    )
                }
            </div>
        </Fragment>
    );
};

export default Exercise;
