import { Fragment, useRef, useState, useImperativeHandle, useCallback } from 'react';
import { ExerciseInput } from '../../../../components/ExerciseInput';
import VirtualKeyboard from '../../../../components/VirtualKeyboard';
import { replaceCharsForLanguage } from '../../../../utils/languageUtils';
import type { ExerciseInfo } from '../../../../types/exercise/Exercise';
import type { User } from '../../../../types/shared/User';
import type { ExerciseInputHandle, ExerciseHandle } from '../../../../types/ui/ComponentHandles';

interface Props {
    exerciseInfo: ExerciseInfo;
    setError: (s: string) => void;
    moveNext: () => void;
    displayAnswer?: boolean;
    parentCheckAnswer?: () => void;
    user?: User;
    ref: React.RefObject<ExerciseHandle>;
}

export const InlineExerciseWithBlanks = function(props: Props) {
    const { exerciseInfo, setError, moveNext, displayAnswer, parentCheckAnswer, user, ref } = props;
    const questionsRefMap = useRef<Map<string, ExerciseInputHandle | undefined>>(new Map());
    const [valueFromKeyboard, setValueFromKeyboard] = useState("");
    const currentInputKey = useRef("");

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
            const firstInput = questionsRefMap.current.get(`${exerciseInfo.exerciseId}-0`);
            if (firstInput) {
                firstInput.setFocus();
            }
        },
        checkAnswer() {
            const thisQuestionRefs = new Map(
                [...questionsRefMap.current.entries()].filter(([key]) => key.startsWith(`${exerciseInfo.exerciseId}-`))
            );

            if (thisQuestionRefs.size < (exerciseInfo.answers?.length || 0)) {
                setError('please fill in all the input elements');
            }
            let canMoveNext = true;
            for (let j = 0; j < (exerciseInfo.answers?.length || 0); j++) {
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

    return (
        <>
            <div className="form-label-row answer">
                {
                    exerciseInfo.sentenceElements?.map((part, i) => {
                        const setRef = (el: ExerciseInputHandle | null) => {
                            if (el) {
                                questionsRefMap.current.set(`${exerciseInfo.exerciseId}-${i}`, el);
                            }
                            else {
                                questionsRefMap.current.delete(`${exerciseInfo.exerciseId}-${i}`);
                            }
                        };

                        return (
                            <Fragment key={`ex${exerciseInfo.exerciseId}input-container${i}`}>
                                {i === 0 && part === "" && (
                                    <ExerciseInput key={`ex${exerciseInfo.exerciseId}input${i}`}
                                        ref={setRef}
                                        charWidth={(2 + (exerciseInfo.answers?.[i]?.length || 0))}
                                        checkAnswer={parentCheckAnswer}
                                        customKey={`${exerciseInfo.exerciseId}-${i}`}
                                        onChange={onChangeFromInput}
                                    />
                                )}
                                <div className="content-line-part">{part}</div>
                                {(i > 0 || part !== "") && (exerciseInfo.answers && exerciseInfo.answers.length > i) && (
                                    <ExerciseInput key={`ex${exerciseInfo.exerciseId}input${i}`}
                                        ref={setRef}
                                        charWidth={(2 + (exerciseInfo.answers?.[i]?.length || 0))}
                                        checkAnswer={parentCheckAnswer}
                                        customKey={`${exerciseInfo.exerciseId}-${i}`}
                                        onChange={onChangeFromInput}
                                    />
                                )}
                            </Fragment>
                        );
                    })
                }</div>
            {displayAnswer && (
                <div className="form-label-row">{(typeof exerciseInfo.data === 'string' ? (() => { try { return JSON.parse(exerciseInfo.data).Second; } catch { return ''; } })() : exerciseInfo.data.Second) || ''}</div>
            )}
            <VirtualKeyboard languageCode={user?.languageSettings?.targetLanguageEnglishName?.toLowerCase() || ''} isRightToLeft={true}
                onChange={onChangeFromKeyboard}
                value={valueFromKeyboard}
            />
        </>
    );
});

export default InlineExerciseWithBlanks;
