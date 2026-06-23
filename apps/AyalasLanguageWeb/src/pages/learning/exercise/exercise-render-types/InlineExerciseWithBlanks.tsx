import { Fragment, useRef, useState, useImperativeHandle, useCallback, useEffect } from 'react';
import { ExerciseInput } from '../../../../components/ExerciseInput';
import VirtualKeyboard from '../../../../components/VirtualKeyboard';
import { replaceCharsForLanguage } from '../../../../utils/languageUtils';
import type { ExtendedExerciseInfo } from '../../../../types/exercise/Exercise';
import type { User } from '../../../../types/shared/User';
import type { ExerciseInputHandle, ExerciseHandle } from '../../../../types/ui/ComponentHandles';
import { isRightToLeftInput, shouldPlayAnswer, showTranslationOnRevealedAnswer } from '../../../../logic/ExerciseTypeLogic';
import { CirclePlay } from 'lucide-react';
import { PLACEHOLDERS } from '../../../../constants/learning';

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

export const InlineExerciseWithBlanks = function (props: Props) {
    const { exerciseInfo, setError, moveNext, displayAnswer, parentCheckAnswer, user, playTargetText, ref } = props;
    const questionsRefMap = useRef<Map<string, ExerciseInputHandle | undefined>>(new Map());
    const [valueFromKeyboard, setValueFromKeyboard] = useState("");
    const currentInputKey = useRef("");
    const [second, setSecond] = useState('');
    const [translation, setTranslation] = useState('');

    const checkAnswerOrMoveToNextInput = function () {
        if (currentInputKey.current != "") {
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

    const onChangeFromKeyboard = useCallback((input: string) => {
        if (currentInputKey.current !== "") {
            setValueFromKeyboard(input);
            const entry = questionsRefMap.current.get(currentInputKey.current);
            entry?.setValue(input);
        }
    }, []);

    const onChangeFromInput = useCallback((value: string, key?: string) => {
        setValueFromKeyboard(value);
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
            <div className="exercise-outer-element">
                <div className={isRightToLeftInput(exerciseInfo.exerciseTypeId,
                    user?.languageSettings?.targetLanguageIsRightToLeft ?? false,
                    user?.languageSettings?.knownLanguageIsRightToLeft ?? false
                ) ? "exercise-inner-element rtlanswer" : "exercise-inner-element answer"}>
                    {
                        exerciseInfo.sentenceElements?.map((part, i) => {
                            const setRef = (el: ExerciseInputHandle | null) => {
                                if (el) {
                                    questionsRefMap.current.set(`${exerciseInfo.exerciseId}-${i}`, el);
                                }
                            };
                            return (
                                <Fragment key={`ex${exerciseInfo.exerciseId}input-container${i}`}>
                                    {part == PLACEHOLDERS.BLANKS && (
                                        <ExerciseInput key={`ex${exerciseInfo.exerciseId}input${i}`}
                                            ref={setRef}
                                            charWidth={(2 + (exerciseInfo.answers?.[i]?.length || 0))}
                                            checkAnswer={checkAnswerOrMoveToNextInput}
                                            customKey={`${exerciseInfo.exerciseId}-${i}`}
                                            onChange={onChangeFromInput}
                                        />
                                    ) || (
                                            <div className="content-line-part">{part}</div>
                                        )}
                                </Fragment>
                            );
                        })
                    }</div>
            </div>
            {displayAnswer && (
                <div className="form-row-play">
                    <div className="form-play-container">{second}
                        {shouldPlayAnswer(exerciseInfo.exerciseTypeId) && (
                            <button data-testid="play-answer" type="button" className="form-button play-button" title="Play Audio" onClick={async () => await playTargetText(second)}><CirclePlay /></button>
                        )}</div>
                    {showTranslationOnRevealedAnswer(exerciseInfo.exerciseTypeId) && (
                        <div className="form-content-row">{translation}</div>
                    )}
                </div>
            )}
            <VirtualKeyboard languageCode={user?.languageSettings?.targetLanguageEnglishName?.toLowerCase() || ''} isRightToLeft={true}
                onChange={onChangeFromKeyboard}
                value={valueFromKeyboard}
            />
        </>
    );
};

export default InlineExerciseWithBlanks;
