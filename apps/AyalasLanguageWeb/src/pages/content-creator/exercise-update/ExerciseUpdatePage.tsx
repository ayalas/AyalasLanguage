import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from "axios";
import { AuthHeader } from "../../../components/auth/AuthHeader";
import { ArrowBigLeft, Save } from "lucide-react";
import type { ExerciseData, ExerciseInfo, ExtendedExerciseInfo } from "../../../types/Exercise";
import { AlternativeLine } from "./AlternativeLine";
import type { AlternativeHandle } from "../../../types/ui/ComponentHandles";
import { EXERCISE_TYPE_LOGIC } from "../../../logic/ExerciseTypeLogic";
import { FormHeader } from "../../../components/FormHeader";

export function ExerciseUpdatePage() {
    const { exerciseId } = useParams();
    const [error, setError] = useState('');
    const [typeName, setTypeName] = useState('');
    const [initialRecord, setInitialRecord] = useState<ExtendedExerciseInfo | null>(null);
    const [firstLine, setFirstLine] = useState('');
    const [secondLine, setSecondLine] = useState('');
    const [translation, setTranslation] = useState('');
    const [extraOptions, setExtraOptions] = useState('');
    const alternativeRefs = useRef<Map<string, AlternativeHandle>>(new Map());
    const navigate = useNavigate();

    async function onFormSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        try {

            const arr: string[] = [];
            if (initialRecord?.exerciseObject?.Alternatives != null
                && initialRecord?.exerciseObject?.Alternatives.length > 0
            ) {
                const map = alternativeRefs.current;
                for (const [key, handle] of map.entries()) {
                    if (handle.exists()) {
                        arr.push(key);
                    }
                }
            }

            const dataToSend: ExerciseData = {
                First: firstLine,
                Second: secondLine,
                ExtraOptions: extraOptions,
                Translation: translation,
                Alternatives: arr
            };

            const data = JSON.stringify(dataToSend);

            await axios.put(`/api/creator/exercise/${exerciseId}`, { Data: data });

            navigate(`/author/path/${initialRecord?.learningPathId}`);
        } catch (ex: unknown) {
            errorHandler(ex, setError);
        }
    }

    function onBackClick(e: React.MouseEvent) {
        e.preventDefault();

        if (initialRecord != null && initialRecord.learningPathId != null) {
            navigate(`/author/path/${initialRecord?.learningPathId}`);
        }
    }



    useEffect(() => {
        async function loadAsync() {
            try {
                if (Number(exerciseId) > 0) {
                    const res = await axios.get<ExerciseInfo>(`/api/creator/exercise/${exerciseId}`);
                    const exerciseTemp: ExtendedExerciseInfo = { ...res.data };
                    if (exerciseTemp.data != null && exerciseTemp.data != "") {
                        exerciseTemp.exerciseObject = JSON.parse(exerciseTemp.data);
                    }
                    setInitialRecord(exerciseTemp);
                    setTypeName(EXERCISE_TYPE_LOGIC[exerciseTemp.exerciseTypeId].Name);
                    if (exerciseTemp.exerciseObject != null) {
                        if (exerciseTemp.exerciseObject.First != null) {
                            setFirstLine(exerciseTemp.exerciseObject.First);
                        }
                        if (exerciseTemp.exerciseObject.Second != null) {
                            setSecondLine(exerciseTemp.exerciseObject.Second);
                        }
                        if (EXERCISE_TYPE_LOGIC[exerciseTemp.exerciseTypeId].ShowsTranslationOnRevealedAnswer) {
                            setTranslation(exerciseTemp.exerciseObject.Translation as string);
                        }
                        if (EXERCISE_TYPE_LOGIC[exerciseTemp.exerciseTypeId].HasExtraOptions) {
                            setExtraOptions(exerciseTemp.exerciseObject.ExtraOptions as string);
                        }
                    }
                }
            } catch (err: unknown) {
                errorHandler(err, setError);
            }
        }
        loadAsync();
    }, [exerciseId]);

    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <form onSubmit={onFormSubmit}>
                    <FormHeader isPublic={false} title="Exercise editor" />

                    {error !== '' && (
                        <div className="form-row">
                            <label className="form-error">{error}</label>
                        </div>
                    )}
                    <div className="form-label-row">Exercise Type</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <label className="form-label">{typeName}</label>
                        </div>
                    </div>
                    <div className="form-label-row">First line</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <textarea data-testid="first-line" className="text-area-minimal" required={true} value={firstLine} onChange={(e) => { setFirstLine(e.target.value) }} />
                        </div>
                    </div>
                    <div className="form-label-row">Second line</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <textarea data-testid="second-line" className="text-area-minimal" required={true} value={secondLine} onChange={(e) => { setSecondLine(e.target.value) }} />
                        </div>
                    </div>
                    {initialRecord != null && EXERCISE_TYPE_LOGIC[initialRecord.exerciseTypeId].ShowsTranslationOnRevealedAnswer && (
                        <>
                            <div className="form-label-row">Translation</div>
                            <div className="form-row">
                                <div className="form-input-row">
                                    <textarea data-testid="translation" className="text-area-minimal" value={translation} onChange={(e) => { setTranslation(e.target.value) }} />
                                </div>
                            </div>
                        </>
                    )}
                    {initialRecord != null && EXERCISE_TYPE_LOGIC[initialRecord.exerciseTypeId].HasExtraOptions && (
                        <>
                            <div className="form-label-row">Extra Options</div>
                            <div className="form-row">
                                <div className="form-input-row">
                                    <textarea data-testid="extra-options" className="text-area-minimal" required={true} value={extraOptions} onChange={(e) => { setExtraOptions(e.target.value) }} />
                                </div>
                            </div>
                        </>
                    )}
                    {initialRecord != null && initialRecord.exerciseObject != null
                        && initialRecord.exerciseObject.Alternatives != null
                        && initialRecord.exerciseObject.Alternatives.length > 0 && (
                            <>
                                <div className="form-row">
                                    <div className="form-label-row">Alternatives</div>
                                </div>
                                {
                                    initialRecord.exerciseObject.Alternatives.map((alternative) => {
                                        const setRef = (el: AlternativeHandle) => {
                                            if (el) {
                                                alternativeRefs.current.set(alternative, el);
                                            } else {
                                                alternativeRefs.current.delete(alternative);
                                            }
                                        };
                                        return (
                                            <AlternativeLine ref={setRef} key={alternative} alternative={alternative} />
                                        );
                                    })}
                            </>)}
                    <div className="buttons-container">
                        <div className="form-button-cell">
                            <button data-testid="back" className="form-button button-back" onClick={onBackClick}><ArrowBigLeft /> Back</button>
                        </div>
                        <div className="form-button-cell">
                            <button data-testid="save" type="submit" className="form-button" title="Save"><Save />&nbsp;Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}