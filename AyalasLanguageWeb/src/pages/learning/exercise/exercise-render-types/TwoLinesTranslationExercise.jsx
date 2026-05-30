import { useRef, forwardRef, useState, useImperativeHandle } from 'react';

import { ExerciseInput } from '../../../../components/ExerciseInput';

import { EXERCISE_TYPES } from '../../../../constants/learning';

import VirtualKeyboard from '../../../../components/VirtualKeyboard';

export const TwoLinesTranslationExercise = forwardRef(({ exerciseInfo, setError, moveNext, displayAnswer, parentCheckAnswer, user }, ref) => {
    const inputRef = useRef(null);
    const [inputValue, setInputValue] = useState("");

    function OnChange(value) {
        setInputValue(value);
    }
 
    useImperativeHandle(ref, () => ({
        setFocus() {
            const firstInput = inputRef.current;
            if (firstInput) {
                firstInput.setFocus();
            }
        },
        checkAnswer() {
            const thisQuestionRef = inputRef.current;

            let canMoveNext = true;
            console.log(`user answer:#${thisQuestionRef.getUserAnswer().trim().toLowerCase()}#`);
            console.log(`real answer:#${exerciseInfo.data.Second.trim().toLowerCase()}#`);
            if (thisQuestionRef.getUserAnswer().trim().toLowerCase() != exerciseInfo.data.Second.trim().toLowerCase()) {
                thisQuestionRef.setToError();
                canMoveNext = false;
            }

            if (canMoveNext) {
                moveNext();
            }
            else {
                setError('You have got some errors. Try again!');
            }

            return canMoveNext;
        }
    }));

    return (
        <>
            <div className="form-row">
                <div className="form-label-row">{exerciseInfo.data.First}</div>
            </div>
            <div className={`${exerciseInfo.exerciseTypeId == EXERCISE_TYPES.FROM_KNOWN_TO_TARGET ? "form-row answer" : "form-row"}`}>
                <ExerciseInput
                    ref={inputRef}
                    charWidth={(2 + exerciseInfo.data.Second.length)}
                    checkAnswer={parentCheckAnswer}
                    onChange={OnChange}
                    value={inputValue}
                />
            </div>
            {displayAnswer && (
                <div className="form-label-row">{exerciseInfo.data.Second}</div>
            )}
            {exerciseInfo.exerciseTypeId == EXERCISE_TYPES.FROM_KNOWN_TO_TARGET && (
                <div className="form-row">
                    <VirtualKeyboard languageCode={user.languageSettings.targetLanguageEnglishName.toLowerCase()} isRightToLeft={true}
                        onChange={OnChange}
                        value={inputValue}
                    />
                </div>
            )}
        </>
    );
});