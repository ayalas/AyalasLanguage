import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { errorHandler } from "../../../utils/utils";
import axios from "axios";
import { AuthHeader } from "../../../components/auth/AuthHeader";
import { ArrowBigLeft, LayersPlus } from "lucide-react";
import type { ExerciseData, ExerciseModel } from "../../../types/exercise/Exercise";
import { EXERCISE_GENERATIONS } from "../../../constants/learning";
import { AlternativeLine } from "./AlternativeLine";
import type { AlternativeHandle } from "../../../types/ui/ComponentHandles";
import { hasExtraOptions } from "../../../logic/ExerciseTypeLogic";

export function ExerciseUpdatePage() {
    const { exerciseId } = useParams();
    const [error, setError] = useState('');
    const [typeName, setTypeName] = useState('');
    const [initialRecord, setInitialRecord] = useState<ExerciseModel | null>(null);
    const [firstLine, setFirstLine] = useState('');
    const [secondLine, setSecondLine] = useState('');
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
                    const res = await axios.get<ExerciseModel>(`/api/creator/exercise/${exerciseId}`);
                    const exerciseTemp: ExerciseModel = { ...res.data };
                    if (exerciseTemp.data != null && exerciseTemp.data != "") {
                        exerciseTemp.exerciseObject = JSON.parse(exerciseTemp.data);
                    }
                    setInitialRecord(exerciseTemp);
                    const typeObj = EXERCISE_GENERATIONS.find(t => t.type == exerciseTemp.exerciseTypeId);
                    if (typeObj != null) {
                        setTypeName(typeObj.name);
                    }
                    if (exerciseTemp.exerciseObject != null) {
                        if (exerciseTemp.exerciseObject.First != null) {
                            setFirstLine(exerciseTemp.exerciseObject.First);
                        }
                        if (exerciseTemp.exerciseObject.Second != null) {
                            setSecondLine(exerciseTemp.exerciseObject.Second);
                        }
                        if (hasExtraOptions(exerciseTemp.exerciseTypeId)) {
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
                    <div className="form-header">
                        <h1>Exercise editor</h1>
                    </div>
                    <div className="form-row">
                        <div className="form-button-cell">
                            <button data-testid="save" type="submit" className="form-button" title="Save"><LayersPlus /></button>
                        </div>
                    </div>
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
                    {initialRecord != null && hasExtraOptions(initialRecord.exerciseTypeId) && (
                        <>
                            <div className="form-label-row">Extra Options</div>
                            <div className="form-row">
                                <div className="form-input-row">
                                    <input data-testid="extra-options" type="text" required={true} value={extraOptions} onChange={(e) => { setExtraOptions(e.target.value) }} />
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
                    <div className="form-row">
                        <button data-testid="back" className="form-button button-back" onClick={onBackClick}><ArrowBigLeft /> Back</button>
                    </div>
                </form>
            </div>
        </>
    );
}