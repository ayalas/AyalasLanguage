import { Fragment, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Ban, Eye, ListChecks, RotateCcw, History, TicketPlus, ArrowBigLeft, FilePenLine, SaveOff } from 'lucide-react';
import axios from 'axios';
import { InlineExerciseWithBlanks } from './exercise-render-types/InlineExerciseWithBlanks';
import { TwoLinesTranslationExercise } from './exercise-render-types/TwoLinesTranslationExercise';
import MatchWordsExercise from './exercise-render-types/match-words/MatchWordsExercise';
import BucketListExercise from './exercise-render-types/bucket-list/BucketListExercise';

import { EXERCISE_TYPE_LOGIC } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { type ExtendedExerciseInfo, LANGUAGE_TO_POLLY_MAP, PLACEHOLDERS } from '@ayalaslanguage/types/sharedfrontlib/learning';

import { ActionsMenuComponent, type ActionsMenuItem } from '../../../components/ActionsMenuComponent';
import { Toaster } from 'sonner';
import { useMistakesReadd } from '../../../components/useMistakesReadd';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import type { AITtsRequestDto } from '@ayalaslanguage/types/sharedfrontlib/ai';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';

export interface ExerciseHandle {
  setFocus: () => void;
  checkAnswer: () => boolean;
  getCurrentAnswer: () => string;
}

type Props = {
    exerciseInfo: ExtendedExerciseInfo;
    moveNext: () => void;
    movePrev: () => void;
    childLoaded: (id: number) => void;
    saveProgress: (routeToHome?:boolean) => void;
    restartLesson: () => void;
    practiseMistakesInitialValue?: boolean;
    addMistake: (id: number) => Promise<void>;
    onPractiseMistakesChange: (newValue: boolean) => void;
    ref: React.Ref<ExerciseHandle>;
};

export const Exercise = function ({ exerciseInfo, moveNext, movePrev, childLoaded, saveProgress, restartLesson, practiseMistakesInitialValue, addMistake, onPractiseMistakesChange, ref }: Props) {

    const [error, setError] = useState<string>("");
    const [displayAnswer, setDisplayAnswer] = useState(false);
    const refExercise = useRef<ExerciseHandle | null>(null);
    const { user } = useOutletContext() as { user?: User };
    const navigate = useNavigate();

    const { practiseMistakesInThisPath, readdMistakes, cancelMistakesAdd } = useMistakesReadd({ learningPathId: exerciseInfo.learningPathId , 
        exerciseId: exerciseInfo.exerciseId, setError, initialValue: practiseMistakesInitialValue,
        onChange: onPractiseMistakesChange});

    const playTargetText = async function (textToPlay: string | undefined | null = null) {
        try {

            if (exerciseInfo.exerciseObject != null && !user?.disableAutoAI) {
                const langCode = user?.languageSettings?.targetLanguageCode;
                if (langCode != undefined) {
                    const pollyObject = LANGUAGE_TO_POLLY_MAP[langCode]
                    if (pollyObject != null) {

                        textToPlay = textToPlay != null ? textToPlay : exerciseInfo.exerciseObject.Second;
                        if (textToPlay != null && textToPlay != "") {
                            const options: AITtsRequestDto = {
                                text: textToPlay,
                                voice: pollyObject.openAIVoice,
                                engine: pollyObject.engine,
                                language: pollyObject.language
                            };

                            const result = await axios.post('/api/ai/edge/tts', options,{
                                responseType: 'blob' 
                            });
                            const audioBlob = result.data;
                            const audioUrl = URL.createObjectURL(audioBlob);

                            // 3. Create an Audio object and play it
                            const audio = new Audio(audioUrl);
                            
                            // Clean up memory after the audio finishes playing
                            audio.onended = () => {
                                URL.revokeObjectURL(audioUrl);
                            };

                            await audio.play();
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
                        onClick: () => { setError(""); restartLesson(); },
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
                        dataTestId: "edit-exercise",
                        children: <><FilePenLine />&nbsp;Edit Exercise</>,
                        onClick: () => {  
                                saveProgress(false);
                                navigate(`/author/exercise/${exerciseInfo.exerciseId}`);
                            },
                        isVisible: exerciseInfo.access == AUTHOR_ACCESS.CAN_EDIT
                    },
                    {
                        dataTestId: "exit-nosave",
                        children: <><SaveOff />&nbsp;Exit without Save</>,
                        onClick: () => { 
                                navigate('/home');
                            }
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
