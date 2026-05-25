import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { AuthHeader } from '../../components/AuthHeader';
import { EXERCISE_GENERATIONS, PLACEHOLDERS } from '../../constants/learning';
import { removeLastCharIfMatch } from '../../utils/utils';


export function LearningPathAuthoring() {
    const [error, setError] = useState("");
    const [level, setLevel] = useState(1);
    const [chapter, setChapter] = useState(1);
    const [title, setTitle] = useState("");
    const [exerciseType, setExerciseType] = useState(0);
    const [exerciseTypeDesc, setExerciseTypeDesc] = useState("");
    const [firstSet, setFirstSet] = useState("");
    const [secondSet, setSecondSet] = useState("");
    const [firstSetDesc, setFirstSetDesc] = useState("");
    const [secondSetDesc, setSecondSetDesc] = useState("");
    const [aiInstructions, setAIInstructions] = useState("");
    const { user } = useOutletContext();
    const navigate = useNavigate();
    const handleExerciseTypeLogic = function (exrTypeValue) {
        const exType = EXERCISE_GENERATIONS.find((ex) => ex.type == exrTypeValue);
        setExerciseTypeDesc(exType.description);

        let aiDesc = exType.ai_instruction;
        aiDesc = aiDesc.replaceAll(PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER, user.languageSettings.knownLanguage);
        aiDesc = aiDesc.replaceAll(PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER, user.languageSettings.targetLanguage);

        setAIInstructions(aiDesc);
        setFirstSetDesc(exType.first_data_instructions);
        setSecondSetDesc(exType.second_data_instructions);
    };

    useEffect(() => {
        async function execAsync() {
            if (exerciseType > 0) {
                handleExerciseTypeLogic(exerciseType);
            }
        };

        execAsync()

    }, [exerciseType]);

    const parseForm = function () {
        if (firstSet == "" || secondSet == "") {
            setError("Must fill both sets of words/sentences.")
            return null;
        }

        const arrFirstSet = removeLastCharIfMatch(firstSet.trim(), ';').split(';');
        const arrSecondSet = removeLastCharIfMatch(secondSet.trim(), ';').split(';');

        if (arrFirstSet == null || arrFirstSet.length == 0 ||
            arrSecondSet == null || arrSecondSet.length == 0
        ) {
            setError("Must fill both sets of words/sentences.")
            return null;
        }

        if (arrFirstSet.length != arrSecondSet.length) {
            setError(`Must have a match between the number of words/sentences on both sets. Found ${arrFirstSet.length} on the first set, and ${arrSecondSet.length} on the second set.`)
            return null;
        }

        const arrObjects = [];
        for (let i = 0; i < arrFirstSet.length; i++) {
            arrObjects.push({
                First: arrFirstSet[i].trim(),
                Second: arrSecondSet[i].trim()
            });
        }

        setError("");
        return arrObjects;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        let learningPathId = 0;
        try {
            let arrData = parseForm();
            if (arrData == null || arrData.length == 0) {
                return;
            }
            //first, create the learning path
            const response = await axios.post('/api/creator/learning-path',
                {
                    level,
                    chapter,
                    name: title
                }
            );
            learningPathId = response.data.learningPathId;

            //then, create the exercises within it
            await createExercises(learningPathId, arrData);

            //navigate to home
            navigate('/home');

        } catch (err) {
            if (learningPathId > 0) {
                await axios.delete(`/api/creator/learning-path/${learningPathId}`);
            }
            setError(err.message);
        }
    };

    const createExercises = async function (pathId, arrData) {
        let created = [];
        for (const exer of arrData) {
            try {
                let responseEx = await axios.post('/api/creator/exercise',
                {
                    learningPathId: pathId,
                    exerciseTypeId: exerciseType,
                    data: JSON.stringify(exer)
                });
                if (responseEx.data && responseEx.data.exerciseId) {
                    created.push(responseEx.data.exerciseId);
                }
            }
            catch (ex) {
                if (created.length > 0) {
                    for (const exerId of created) {
                        await axios.delete(`/api/creator/exercise/${exerId}`);
                    }
                }
                if (ex.response && ex.response.data) {
                    throw new Error(ex.response.data, {cause: ex});
                }
                throw ex;
            }
        }
    }

    const onChangeExerciseType = async (e) => {
        setExerciseType(e.target.value);
        handleExerciseTypeLogic(e.target.value);
    };



    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-header">
                        <h1>Exercise Generator</h1>
                    </div>
                    {error != "" && (
                        <div className="form-row">
                            <label className="form-error">{error}</label>
                        </div>
                    )}
                    <div className="form-label-row">Level</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <input type="number" value={level} onChange={(e) => { setLevel(Number(e.target.value)) }} />
                        </div>
                    </div>
                    <div className="form-label-row">Chapter</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <input type="number" required={true} value={chapter} onChange={(e) => { setChapter(Number(e.target.value)) }} />
                        </div>
                    </div>
                    <div className="form-label-row">Title</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <input type="text" required={true} value={title} onChange={(e) => { setTitle(e.target.value) }} />
                        </div>
                    </div>
                    <div className="form-label-row">Exercise Type</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <select required={true} id="exercise-type" className="form-select" value={exerciseType} onChange={onChangeExerciseType}>
                                <option value="" disabled>-- Please choose an option --</option>
                                {
                                    EXERCISE_GENERATIONS.map((exType) => {
                                        return (
                                            <option key={exType.type} value={exType.type}>
                                                {exType.name}
                                            </option>
                                        );
                                    })
                                }
                            </select>
                        </div>
                        <div className="form-content-row">{exerciseTypeDesc}</div>
                    </div>
                    <div className="form-label-row">AI instructions</div>
                    <div className="form-row">
                        <div className="form-content-row">{aiInstructions}</div>
                    </div>
                    <div className="form-label-row">First set of words/sentences</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <textarea required={true} className="text-area-wide" value={firstSet} onChange={(e) => { setFirstSet(e.target.value) }} />
                        </div>
                        <div className="form-content-row">{firstSetDesc}</div>
                    </div>
                    <div className="form-label-row">Second set of words/sentences</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <textarea required={true} className="text-area-wide" value={secondSet} onChange={(e) => { setSecondSet(e.target.value) }} />
                        </div>
                        <div className="form-content-row">{secondSetDesc}</div>
                    </div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <button type="submit" className="form-button">Generate exercises</button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}