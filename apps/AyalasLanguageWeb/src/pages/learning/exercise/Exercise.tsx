import { Fragment, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Ban, Eye, ListChecks, CircleDotDashed, RotateCcw, History, TicketPlus, ArrowBigLeft, FilePenLine } from 'lucide-react';
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
import { ActionsMenuComponent, type ActionsMenuItem } from '../../../components/ActionsMenuComponent';
import { toast, Toaster } from 'sonner';

type Props = {
    exerciseInfo: ExtendedExerciseInfo;
    moveNext: () => void;
    movePrev: () => void;
    childLoaded: (id: number) => void;
    saveProgress: () => void;
    restartLesson: () => void;
    changeMistakesSetting: (val: boolean) => void;
    practiseMistakesInThisPath?: boolean;
    addMistake: (id: number) => Promise<void>;
    ref: React.Ref<ExerciseHandle>;
};

export const Exercise = function ({ exerciseInfo, moveNext, movePrev, childLoaded, saveProgress, restartLesson, changeMistakesSetting, practiseMistakesInThisPath, addMistake, ref }: Props) {

    const [error, setError] = useState<string>("");
    const [displayAnswer, setDisplayAnswer] = useState(false);
    const refExercise = useRef<ExerciseHandle | null>(null);
    const { user } = useOutletContext() as { user?: User };
    const [puterSignedIn, setPuterSignedIn] = useState(false);

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
            if (shouldPlayAnswer(exerciseInfo.exerciseTypeId)) {
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

    const readdMistakes = function () {
       
        // 1. Trigger the toast
        const toastId = toast('Are you sure you want to readd your mistakes here?', {
            description: 'Every time you make a mistake, a duplicate of the exercise you made a mistake in will be added to this lesson. If you have set this setting to another lesson already, it will be removed from it. Typically, this setting should be applied to the bottom most lesson in the homepage.',
            action: {
                label: 'Yes, readd my mistakes here',
                onClick: (e) => {
                    e.preventDefault();
                    changeMistakesSetting(true);
                    toast.dismiss(toastId);
                },
            },
            cancel: {
                label: 'Cancel',
                onClick: (e) => { 
                    e.preventDefault();
                    toast.dismiss(toastId);
                }
            },
            classNames: {
                toast: 'my-confirm-toast',
                description: 'my-confirm-description', // Optional: styling the description
                actionButton: 'my-action-btn', // Makes the button full width at the bottom
                cancelButton: 'my-cancel-btn',
            },
        });
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
            <div className="buttons-container">
                {
                    canRevealAnswers(exerciseInfo.exerciseTypeId) && (
                        <div className="form-button-cell">
                            <button data-testid="reveal-answer" type="button" onClick={toggleAnswer} className="top-button lesson-button-reveal" title="Reveal answer"><Eye />&nbsp;{displayAnswer && "Hide" || "Reveal"}</button>
                        </div>
                    )
                }

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
                        isVisible: displayAnswer && error != "" && supportsAlternativeAnswers(exerciseInfo.exerciseTypeId),
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
                        <button data-testid="back" className="lesson-button-left lesson-button-back" onClick={onBackClick}><ArrowBigLeft /> Prev</button>
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
