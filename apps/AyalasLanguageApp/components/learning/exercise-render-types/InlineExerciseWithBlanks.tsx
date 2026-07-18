import { Fragment, useRef, useState, useImperativeHandle, useCallback, useEffect } from 'react';
import ExerciseInput, { type ExerciseInputHandle } from '@/components/learning/ExerciseInput';
import { replaceCharsForLanguage } from '@ayalaslanguage/types/sharedfrontlib/utils';
import { type ExtendedExerciseInfo, PLACEHOLDERS } from '@ayalaslanguage/types/sharedfrontlib/learning';
import { EXERCISE_TYPE_LOGIC, isRightToLeftInput } from '@ayalaslanguage/types/sharedfrontlib/logic';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { CirclePlay } from 'lucide-react-native';
import type {ExerciseHandle} from '../Exercise';
import { TouchableOpacity, Text, View } from 'react-native';
import useTextStyles from '@/lib/useTextStyles';

interface Props {
    exerciseInfo: ExtendedExerciseInfo;
    setError: (s: string) => void;
    moveNext: () => void;
    displayAnswer?: boolean;
    parentCheckAnswer?: () => void;
    user?: User;
    playTargetText: (s: string) => Promise<void>;
    ref: React.Ref<ExerciseHandle>;
}

export default function InlineExerciseWithBlanks ({ exerciseInfo, setError, moveNext, displayAnswer, parentCheckAnswer, user, 
        playTargetText, ref }: Props) {
    const questionsRefMap = useRef<Map<string, ExerciseInputHandle | undefined>>(new Map());
    const currentInputKey = useRef("");
    const [second, setSecond] = useState('');
    const [translation, setTranslation] = useState('');
    const { styles } = useTextStyles();

    const checkAnswerOrMoveToNextInput = function () {
        if (currentInputKey.current !== "") {
            const lastChar = Number(currentInputKey.current.at(-1));

            if (exerciseInfo.answers != null && exerciseInfo.answers.length - 1 > lastChar) {
                //get the next input by the answer with no placeholders
                const nextIndex = exerciseInfo.answers.findIndex((element, index) => index > lastChar && element != PLACEHOLDERS.BLANKS);
                if (nextIndex > 0) {
                    const tryRef = questionsRefMap.current.get(`${exerciseInfo.exerciseId}-${nextIndex}`);
                    if (tryRef != null) {
                        tryRef.setFocus();
                        return;
                    }
                }
            }
        }

        if (parentCheckAnswer) {
            parentCheckAnswer();
        }
    };

     const onChangeFromInput = useCallback((value: string, key?: string) => {
        if (key) currentInputKey.current = key;
    }, []);

    useImperativeHandle(ref, () => ({
        setFocus() {
            const firstInputIndex = exerciseInfo.answers?.findIndex(a => a != PLACEHOLDERS.BLANKS);
            const firstInput = questionsRefMap.current.get(`${exerciseInfo.exerciseId}-${firstInputIndex}`);
            if (firstInput) {
                firstInput.setFocus();
            }
        },
        checkAnswer() {
            const thisQuestionRefs = new Map(
                [...questionsRefMap.current.entries()].filter(([key]) => key.startsWith(`${exerciseInfo.exerciseId}-`))
            );

            const realAnswers = exerciseInfo.answers?.filter((s) => s != PLACEHOLDERS.BLANKS);
            if (realAnswers == undefined) {
                return false;
            }
            if (thisQuestionRefs.size < realAnswers.length) {
                setError('please fill in all the input elements');
            }

            let canMoveNext = true;
            for (let j = 0; j < (exerciseInfo.answers?.length || 0); j++) {

                if (exerciseInfo.answers?.[j] == PLACEHOLDERS.BLANKS) {
                    continue;
                }

                const inputRef = thisQuestionRefs.get(`${exerciseInfo.exerciseId}-${j}`);
                const userTarget = user?.languageSettings?.targetLanguage;
                if (!inputRef) {
                    canMoveNext = false;
                    continue;
                }
                if (inputRef.getUserAnswer().trim().toLowerCase()
                    !== (replaceCharsForLanguage(userTarget, exerciseInfo.answers?.[j]?.trim().toLowerCase() || '') || '')) {
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

            return canMoveNext;
        },
        getCurrentAnswer() {
            //not applicable
            return '';
        }
    }));

    useEffect(() => {
        async function runAsync() {

            if (exerciseInfo.exerciseObject == null) return;

            setSecond(exerciseInfo.exerciseObject.Second as string);
            if (exerciseInfo.exerciseObject.Translation != null) {
                setTranslation(exerciseInfo.exerciseObject.Translation as string);
            }
        }
        runAsync();
    }, [exerciseInfo])

    return (
        <>
            <View className="exercise-outer-element">
                <View className={`exercise-inner-element fill-in-inner-element ${isRightToLeftInput(exerciseInfo.exerciseTypeId,
                    user?.languageSettings?.targetLanguageIsRightToLeft ?? false,
                    user?.languageSettings?.knownLanguageIsRightToLeft ?? false
                ) ? "rtlanswer" : "answer"}`}>
                    {
                        exerciseInfo.sentenceElements?.map((part, i) => {
                            const setRef = (el: ExerciseInputHandle | null) => {
                                if (el) {
                                    questionsRefMap.current.set(`${exerciseInfo.exerciseId}-${i}`, el);
                                }
                            };
                            //break part into words, to have an effect of wrapping elements separately:
                            const words = part.split(' ');
                            return (
                                <Fragment key={`ex${exerciseInfo.exerciseId}input-container${i}`}>
                                    {part === PLACEHOLDERS.BLANKS && (
                                        <ExerciseInput key={`ex${exerciseInfo.exerciseId}input${i}`}
                                            ref={setRef}
                                            charWidth={(2 + (exerciseInfo.answers?.[i]?.length || 0))}
                                            checkAnswer={checkAnswerOrMoveToNextInput}
                                            customKey={`${exerciseInfo.exerciseId}-${i}`}
                                            onChange={onChangeFromInput}
                                        />
                                    ) || (
                                            <>
                                                {
                                                    words.map((word, index) => (<Text 
                                                        key={`ex-word-${exerciseInfo.exerciseId}input-container${i}-${index}`} 
                                                        style={styles.inlineExercise}>{word}
                                                    </Text>))
                                                }
                                            </>)
                                    }
                                </Fragment>
                            );
                        })
                    }</View>
            </View>
            {displayAnswer && (
                <View className="form-row-play">
                    <View className="form-play-container"><Text style={styles.text}>{second}</Text>
                        {EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShouldPlayAnswer && (
                            <TouchableOpacity testID="play-answer" className="play-button" onPress={async () => await playTargetText(second)}><CirclePlay className='color-brand-play' /></TouchableOpacity>
                        )}</View>
                    { EXERCISE_TYPE_LOGIC[exerciseInfo.exerciseTypeId].ShowsTranslationOnRevealedAnswer && (
                        <Text style={styles.text}>{translation}</Text>
                    )}
                </View>
            )}
        </>
    );
};
