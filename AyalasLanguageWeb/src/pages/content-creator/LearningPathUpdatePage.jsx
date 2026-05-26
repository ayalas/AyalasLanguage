import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import { AuthHeader } from '../../components/AuthHeader';

import { LearningPathAuthoringForm } from '../../components/content-creator/LearningPathAuthoringForm';
import { ExerciseLineForDelete } from '../../components/content-creator/ExerciseLineForDelete';
import { AUTHOR_ACCESS } from '../../constants/learning';

export function LearningPathUpdatePage() {
    const [initialRecord, setInitialRecord] = useState(null);
    const [existingExercises, setExistingExercises] = useState([]);
    const [updateFormError, setUpdateFormError] = useState("");
    const navigate = useNavigate();
    const { learningPathId } = useParams();

    const handleSubmit = async (setError, createExercises, level, chapter, title, exerciseType, arrData) => {
        try {
            //first, update the learning path if has access to
            if (initialRecord.access == AUTHOR_ACCESS.CAN_EDIT){
                const req = {
                    level,
                    chapter,
                    name: title
                };

                await axios.put(`/api/creator/learning-path/${learningPathId}`, req);
            }

            //then, create the exercises within it (anyone can add exercises - currently not supporting in the UI a pure learner role,
            //although the API does)
            if (arrData != null && arrData.length > 0) {
                await createExercises(learningPathId, exerciseType, arrData);
            }

            //navigate to home
            navigate('/home');

        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        async function loadAsync() {
            try {
                if (learningPathId > 0) {
                    let res = await axios.get(`/api/learning/path/${learningPathId}`);
                    setInitialRecord(res.data);

                    //get exercises
                    res = await axios.get(`/api/learning/path/${learningPathId}/exercises`);
                    const exercisesTemp = [
                    ]
                    for (const ex of res.data)
                    {
                        const newExercise = {
                            ...ex
                        };
                        try {
                            newExercise.exerciseObject = JSON.parse(ex.data);
                        }
                        catch {
                            newExercise.exerciseObject = {};
                            newExercise.exerciseObject.First = ex.data;
                        }
                        exercisesTemp.push(newExercise);
                    }
                    
                    setExistingExercises(exercisesTemp);
                }
            }
            catch (err) {
                setUpdateFormError(err.message);
            }
        }

        loadAsync();
    }, [learningPathId]);

    return (
        <>
            <AuthHeader />
            {updateFormError != "" && (
                <div className="form-row">
                    <label className="form-error">{updateFormError}</label>
                </div>
            )}
            <LearningPathAuthoringForm handleSubmit={handleSubmit} initialRecord={initialRecord} />
            {
                existingExercises && existingExercises.length > 0 && (
                    <div className="form-row">
                        <div className="form-content-row">
                            <h2>Existing exercises</h2>
                        </div>
                        {
                            existingExercises.map((existing) => {
                                return (
                                    <ExerciseLineForDelete key={existing.exerciseId} exerciseInfo={existing} />
                                );
                            })
                        }
                    </div>)
            }
        </>
    );
}