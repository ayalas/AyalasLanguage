import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { errorHandler } from "../../../utils/utils";
import axios from "axios";
import { AuthHeader } from "../../../components/auth/AuthHeader";
import { ArrowBigLeft, LayersPlus } from "lucide-react";
import type { ExerciseModel } from "../../../types/exercise/Exercise";
import { EXERCISE_TYPES, EXERCISE_GENERATIONS } from "../../../constants/learning";
import { AlternativeLine } from "./AlternativeLine";

export function ExerciseUpdatePage() {
    const { exerciseId } = useParams();
    const [error, setError] = useState('');
    const [typeName, setTypeName] = useState('');
    const [initialRecord, setInitialRecord] = useState<ExerciseModel | null>(null);
    const [firstLine, setFirstLine] = useState('');
    const [secondLine, setSecondLine] = useState('');
    const [extraOptions, setExtraOptions] = useState('');
    const navigate = useNavigate();

    async function onFormSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        try {
            console.log('todo');

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
                            <button type="submit" className="form-button" title="Save"><LayersPlus /></button>
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
                            <input type="text" required={true} value={firstLine} onChange={(e) => { setFirstLine(e.target.value) }} />
                        </div>
                    </div>
                    <div className="form-label-row">Second line</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <input type="text" required={true} value={secondLine} onChange={(e) => { setSecondLine(e.target.value) }} />
                        </div>
                    </div>
                    {initialRecord != null && initialRecord.exerciseTypeId == EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET && (
                        <>
                            <div className="form-label-row">Extra Options</div>
                            <div className="form-row">
                                <div className="form-input-row">
                                    <input type="text" required={true} value={extraOptions} onChange={(e) => { setExtraOptions(e.target.value) }} />
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
                                    initialRecord.exerciseObject.Alternatives.map((alternative) => (
                                        <AlternativeLine key={alternative} alternative={alternative} />

                                    ))}
                            </>)}
                    <div className="form-row">
                        <button className="form-button button-back" onClick={onBackClick}><ArrowBigLeft /> Back</button>
                    </div>
                </form>
            </div>
        </>
    );
}