import { Fragment, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Ban, Eye, ListChecks, CircleDotDashed, RotateCcw, History, TicketPlus, ArrowBigLeft, FilePenLine } 
    from 'lucide-react-native';
import api from '@/lib/api';
import InlineExerciseWithBlanks from '@/components/learning/exercise-render-types/InlineExerciseWithBlanks';
import TwoLinesTranslationExercise from '@/components/learning/exercise-render-types/TwoLinesTranslationExercise';
import MatchWordsExercise from '@/components/learning/exercise-render-types/match-words/MatchWordsExercise';
import BucketListExercise from '@/components/learning/exercise-render-types/bucket-list/BucketListExercise';

import { puter } from "@heyputer/puter.js";
import { initializePuter, isSecure } from '@/lib/puter';
import { EXERCISE_TYPE_LOGIC } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { type ExtendedExerciseInfo, LANGUAGE_TO_POLLY_MAP, PLACEHOLDERS } from '@ayalaslanguage/types/sharedfrontlib/learning';

import { ActionsMenuComponent, type ActionsMenuItem } from '@/components/ActionsMenuComponent';
import { useMistakesReadd } from '@/lib/useMistakesReadd';
import { useAuth } from '@/lib/AuthContext';
import { TouchableOpacity, Text, View } from 'react-native';
import useTextStyles from '@/lib/useTextStyles';
import { COLOR_PLAY } from '@/constants';

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
    saveProgress: () => void;
    restartLesson: () => void;
    practiseMistakesInitialValue?: boolean;
    addMistake: (id: number) => Promise<void>;
    ref: React.Ref<ExerciseHandle>;
};

export default function Exercise ({ exerciseInfo, moveNext, movePrev, childLoaded, saveProgress, 
        restartLesson, practiseMistakesInitialValue, addMistake, ref }: Props) {

    const [error, setError] = useState<string>("");
    const [displayAnswer, setDisplayAnswer] = useState(false);
    const refExercise = useRef<ExerciseHandle | null>(null);
    const { user } = useAuth();
    const [puterSignedIn, setPuterSignedIn] = useState(false);
    const styles = useTextStyles();
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
                        if (textToPlay != null && textToPlay !== "") {
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

    async function addAlternativeAnswer() {
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
            await api.put(`/api/creator/exercise/${exerciseInfo.exerciseId}`, { Data: dataString });
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

    const onBackClick = function () {

        movePrev();
    }

    if (!user)
        return;

    return (
        <Fragment key={`ex${exerciseInfo.exerciseId}row`}>           
            <View className="exercise-body-container">
                <View className="form-row">
                    <Text style={styles.text}>{ExerciseTypeInstruction()}</Text>
                </View>
                {error !== "" && (
                    <View className="form-row">
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
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
            </View>
            
            <View className="buttons-container">
                <ActionsMenuComponent items={[
                    {
                        dataTestId: "restart-lesson",
                        children: <><RotateCcw className='color-brand-play' /><Text style={[styles.text, {color: COLOR_PLAY}]}>&nbsp;Restart Lesson</Text></>,
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
                        isVisible: displayAnswer && error !== "" && EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].SupportsAlternativeAnswers,
                    },
                    {
                        dataTestId: "edit-lesson",
                        children: <><FilePenLine />&nbsp;Edit lesson</>,
                        toPath: `/author/path/${exerciseInfo.learningPathId}`,
                    },
                    {
                        dataTestId: "save-progress",
                        children: <><CircleDotDashed className='color-brand-dashed' />&nbsp;Save & Exit</>,
                        onClick: saveProgress,
                        className: "lesson-button-save",
                    }
                ] as ActionsMenuItem[]} anchorTitle="More" />
                {
                    EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].CanRevealAnswers && (
                        <View className="form-button-cell">
                            <TouchableOpacity testID="reveal-answer" onPress={toggleAnswer} className="top-button lesson-button-reveal"><Eye className='color-brand-accent' /><Text style={[styles.text, styles.colorAccent]}> {displayAnswer && "Hide" || "Reveal"}</Text></TouchableOpacity>
                        </View>
                    )
                }
            </View>
            <View className="exercise-footer">

                {(exerciseInfo.index ?? 0) > 0 && (
                    <View className="exercise-footer-back">
                        <TouchableOpacity testID="back" className="lesson-button-left lesson-button-back" onPress={onBackClick}><ArrowBigLeft className='color-brand-play' stroke-width="4" /><Text style={[styles.text, {color: COLOR_PLAY}]}> Prev</Text></TouchableOpacity>
                    </View>
                )}
                {
                    EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShowsCheckAnswers && (
                        <View className={`exercise-footer-next ${(exerciseInfo.index ?? 0) > 0 ? "" : "exercise-footer-next-noback"}`}>
                            <TouchableOpacity testID="check-my-answers" onPress={checkAnswer} className="form-button" ><ListChecks /><Text style={[styles.text, {color: COLOR_PLAY, backgroundColor: 'white'}]}> Check</Text></TouchableOpacity>
                        </View>
                    )
                }
            </View>
        </Fragment>
    );
};
