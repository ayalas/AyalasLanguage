import { Fragment, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Ban, Eye, ListChecks, CircleDotDashed, RotateCcw, History, TicketPlus, ArrowBigLeft, ChevronDown, FilePenLine } from 'lucide-react';
import axios from 'axios';
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
    useClick,
    useDismiss,
    useInteractions
} from '@floating-ui/react';
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
    const [isOpen, setIsOpen] = useState(false);
    const { refs: { setFloating, setReference }, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-start',
        whileElementsMounted: autoUpdate,
        middleware: [offset(8), flip(), shift()],
    });
    const click = useClick(context);
    const dismiss = useDismiss(context, { outsidePress: true });
    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);


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
            <div className="buttons-container">
                {
                    canRevealAnswers(exerciseInfo.exerciseTypeId) && (
                        <div className="form-button-cell">
                            <button data-testid="reveal-answer" type="button" onClick={toggleAnswer} className="top-button lesson-button-reveal" title="Reveal answer"><Eye />&nbsp;Reveal</button>
                        </div>
                    )
                }
                
                <div className="form-button-cell">
                    <Link data-testid="more-actions" ref={setReference as any} {...getReferenceProps()} className="actions-menu-link-button" to="#">
                        More&nbsp;<ChevronDown />
                    </Link>

                    {isOpen && (
                        <div className="menu-container"
                            ref={setFloating}
                            style={{ ...floatingStyles }}
                            {...getFloatingProps()}
                        >
                            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                <li className="menu-line"><button data-testid="restart-lesson" type="button" onClick={restartLesson} className="actions-menu-item"><RotateCcw />&nbsp;Restart Lesson</button></li>

                                {practiseMistakesInThisPath && (
                                    <>
                                        <hr className="menu-delimiter" />
                                        <li className="menu-line">
                                            <button data-testid="cancel-readding" type="button" onClick={cancelMistakesAdd} className="actions-menu-item"><Ban />&nbsp;Stop readding my mistakes</button>
                                        </li>
                                    </>
                                ) || (
                                        <>
                                            <hr className="menu-delimiter" />
                                            <li className="menu-line">
                                                <button data-testid="readd-mistakes" type="button" onClick={readdMistakes} className="actions-menu-item"><History />&nbsp;Readd my mistakes</button>
                                            </li>
                                        </>
                                    )}
                                {displayAnswer && error != ""
                                    && (supportsAlternativeAnswers(exerciseInfo.exerciseTypeId)) && (
                                        <>
                                            <hr className="menu-delimiter" />
                                            <li className="menu-line">
                                                <button data-testid="add-alternative-answer" type="button" className="actions-menu-item" onClick={addAlternativeAnswer}><TicketPlus />&nbsp;Add alternative answer</button>
                                            </li>
                                        </>
                                    )}
                                <hr className="menu-delimiter" />
                                <li className="menu-line">
                                    <Link to={`/author/path/${exerciseInfo.learningPathId}`} className="actions-menu-item"><FilePenLine />&nbsp;Edit lesson</Link>
                                </li>
                                <hr className="menu-delimiter" />
                                <li className="menu-line">
                                    <button data-testid="save-progress" type="button" onClick={saveProgress} className="actions-menu-item lesson-button-save"><CircleDotDashed />&nbsp;Save & Exit</button>
                                </li>
                            </ul>
                        </div>
                    )}
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
