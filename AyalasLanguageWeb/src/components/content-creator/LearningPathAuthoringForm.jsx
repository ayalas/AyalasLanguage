import { useState, useEffect } from 'react';
import { useOutletContext,useNavigate, useSearchParams } from 'react-router-dom';
import { LayersPlus, Trash } from 'lucide-react';
import axios from 'axios';

import { removeLastCharIfMatch } from '../../utils/utils';
import { EXERCISE_GENERATIONS, PLACEHOLDERS, AUTHOR_ACCESS } from '../../constants/learning';

export function LearningPathAuthoringForm({ handleSubmit, initialRecord }) {
    const [error, setError] = useState("");
    const [level, setLevel] = useState(1);
    const [chapter, setChapter] = useState(1);
    const [title, setTitle] = useState("");
    const [access, setAccess] = useState(AUTHOR_ACCESS.CAN_EDIT);
    const [exerciseType, setExerciseType] = useState(0);
    const [exerciseTypeDesc, setExerciseTypeDesc] = useState("");
    const [firstSet, setFirstSet] = useState("");
    const [secondSet, setSecondSet] = useState("");
    const [firstSetDesc, setFirstSetDesc] = useState("");
    const [secondSetDesc, setSecondSetDesc] = useState("");
    const [aiInstructions, setAIInstructions] = useState("");
    const [ searchParams ] = useSearchParams();
    const initLevel = searchParams.get('level');
    const initChapter = searchParams.get('chapter');
    const navigate = useNavigate();

    const { user } = useOutletContext();

    const parseForm = function () {
        if (firstSet == "" || secondSet == "") {
            return null;
        }

        const arrFirstSet = removeLastCharIfMatch(firstSet.trim(), ';').split(';');
        const arrSecondSet = removeLastCharIfMatch(secondSet.trim(), ';').split(';');

        if (arrFirstSet == null || arrFirstSet.length == 0 ||
            arrSecondSet == null || arrSecondSet.length == 0
        ) {
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

    const onFormSubmit = function (e) {
        e.preventDefault();
        let arrData = parseForm();
        
        handleSubmit(setError, createExercises, level, chapter, title, exerciseType, arrData);
    }

    //both edit and create can generate new exercises for the paths
    const createExercises = async function (pathId, exerciseType, arrData) {
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
                    throw new Error(ex.response.data, { cause: ex });
                }
                throw ex;
            }
        }
    }

    const deleteLesson = async function() {
        try {
                await axios.delete(`/api/creator/learning-path/${initialRecord.learningPathId}`);

                navigate('/home');
            }
            catch (ex) {
                setError(ex.message);
            }
    };

    const handleExerciseTypeLogic = function (exrTypeValue) {
        const exType = EXERCISE_GENERATIONS.find((ex) => ex.type == exrTypeValue);
        setExerciseTypeDesc(exType.description);

        let aiDesc = exType.ai_instruction;
        aiDesc = aiDesc.replaceAll(PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER, user.languageSettings.knownLanguage);
        aiDesc = aiDesc.replaceAll(PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER, user.languageSettings.targetLanguage);

        let subject = title.trim();
        if (subject == "") {
            subject = "any language exchange";
        }
        aiDesc = aiDesc.replaceAll(PLACEHOLDERS.SUBJECT_PLACEHOLDER, subject);

        setAIInstructions(aiDesc);
        setFirstSetDesc(exType.first_data_instructions);
        setSecondSetDesc(exType.second_data_instructions);
    };

    const onChangeExerciseType = async (e) => {
        setExerciseType(e.target.value);
        handleExerciseTypeLogic(e.target.value);
    };

    useEffect(() => {
        async function execAsync() {
            if (initialRecord != null) {
                setLevel(initialRecord.level);
                setChapter(initialRecord.chapter);
                setTitle(initialRecord.name);
                setAccess(initialRecord.access);
            }
            else {
                if (initLevel != "" && Number(initLevel) > 0) {
                    setLevel(initLevel);
                }
                if (initChapter != "" && Number(initChapter) > 0) {
                    setChapter(initChapter);
                }
            }
        };

        execAsync()
    }, [initialRecord])

    useEffect(() => {
        async function execAsync() {
            if (exerciseType > 0) {
                handleExerciseTypeLogic(exerciseType);
            }
        };

        execAsync()

    }, [exerciseType]);

    return (
        <div className="form-container">
            <form onSubmit={onFormSubmit}>
                <div className="form-header">
                    <h1>Lesson editor</h1>
                </div>
                <div className="form-row">
                    <div className="form-button-cell">
                        <button type="submit" className="form-button" title="Save"><LayersPlus /></button>
                    </div>
                    {
                        initialRecord && initialRecord.access == AUTHOR_ACCESS.CAN_EDIT &&
                        initialRecord.exerciseCount == 0 && (
                            <div className="form-button-cell">
                                <button type="button" onClick={deleteLesson} className="form-button" title="Delete lesson"><Trash /></button>
                            </div>
                        )
                    }
                </div>
                {error != "" && (
                    <div className="form-row">
                        <label className="form-error">{error}</label>
                    </div>
                )}
                <div className="form-label-row">Level</div>
                <div className="form-row">
                    <div className="form-input-row">
                        <input type="number" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} value={level} onChange={(e) => { setLevel(Number(e.target.value)) }} />
                    </div>
                </div>
                <div className="form-label-row">Chapter</div>
                <div className="form-row">
                    <div className="form-input-row">
                        <input type="number" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} required={access == AUTHOR_ACCESS.CAN_EDIT} value={chapter} onChange={(e) => { setChapter(Number(e.target.value)) }} />
                    </div>
                </div>
                <div className="form-label-row">Title</div>
                <div className="form-row">
                    <div className="form-input-row">
                        <input type="text" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} required={access == AUTHOR_ACCESS.CAN_EDIT} value={title} onChange={(e) => { setTitle(e.target.value) }} />
                    </div>
                </div>
                <div className="form-header">
                    <h2>Exercise Generator</h2>
                </div>
                <div className="form-label-row">Exercise Type</div>
                <div className="form-row">
                    <div className="form-input-row">
                        <select required={true} id="exercise-type" className="form-select" value={exerciseType} onChange={onChangeExerciseType}>
                            <option value="0" disabled>-- Please choose an option --</option>
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
                        <textarea className="text-area-wide" value={firstSet} onChange={(e) => { setFirstSet(e.target.value) }} />
                    </div>
                    <div className="form-content-row">{firstSetDesc}</div>
                </div>
                <div className="form-label-row">Second set of words/sentences</div>
                <div className="form-row">
                    <div className="form-input-row">
                        <textarea className="text-area-wide" value={secondSet} onChange={(e) => { setSecondSet(e.target.value) }} />
                    </div>
                    <div className="form-content-row">{secondSetDesc}</div>
                </div>

            </form>
        </div>
    );
}