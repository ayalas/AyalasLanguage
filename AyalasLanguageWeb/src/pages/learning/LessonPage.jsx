import { useParams, useNavigate, Link } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FilePenLine } from 'lucide-react';

import { AuthHeader } from '../../components/AuthHeader';
import { EXERCISE_TYPES, PLACEHOLDERS } from '../../constants/learning';
import { getMissingParts } from '../../utils/utils';
import { Exercise } from '../../components/Exercise';

export function LessonPage() {
    const { learningPathId } = useParams();
    const [exercises, setExercises] = useState([]);
    const [learningPathData, setLearningPathData] = useState(null);
    const [currentExercise, setCurrentExercise] = useState(null);
    const [error, setError] = useState("");
    const exerciseRefs = useRef(new Map());
    const navigate = useNavigate();


    const changeCurrentExercise = function (arrExercises, index) {
        const curItem = arrExercises[index];

        let data = JSON.parse(curItem.data);
        if (curItem.exerciseTypeId == EXERCISE_TYPES.FILL_IN_THE_BLANKS) {
            let sentenceElements = data.First.split(PLACEHOLDERS.BLANKS);

            let answers = getMissingParts(data.Second, sentenceElements);
            setCurrentExercise({
                ...curItem,
                data,
                sentenceElements,
                answers,
                index
            });
            
        }
        else if (curItem.exerciseTypeId != EXERCISE_TYPES.MATCHING) {
            setCurrentExercise({
                ...curItem,
                data,
                sentenceElements: [data.First],
                answers: [data.Second],
                index
            });
        }
        else {
            let sentenceElements = data.First.split(',');

            let answers = data.Second.split(',');

            setCurrentExercise({
                ...curItem,
                data,
                sentenceElements,
                answers,
                index
            });
        }
        const refItem = exerciseRefs.current.get(curItem.exerciseId);
        if (refItem) {
            exerciseRefs.current.get(curItem.exerciseId).setFocus();
        }
    }

    const childLoaded = function (exerciseId) {
        if (exerciseId == currentExercise.exerciseId) {
            const refItem = exerciseRefs.current.get(currentExercise.exerciseId);
            if (refItem) {
                exerciseRefs.current.get(currentExercise.exerciseId).setFocus();
            }
        }
    }

    const setRef = (el) => {
        exerciseRefs.current.set(currentExercise.exerciseId, el);
    };

    const moveNext = async function () {
        if (currentExercise.index < exercises.length - 1) {
            changeCurrentExercise(exercises, currentExercise.index + 1);
        }
        else {
            try {
                await axios.post('/api/learning/progress',
                    {
                        learningPathId: learningPathId
                    }
                );

                navigate('/home');
            } catch (err) {
                setError(err.message);
            }
        }
    }

    const saveProgress = async function () {
        try {
            let exCurInd = exercises.findIndex(e => e.exerciseId == currentExercise.exerciseId);
            let exerId = null;
            if (exCurInd > 0) {
                exerId = currentExercise.exerciseId;
            }

            if (exerId == null) {
                await axios.delete(`/api/learning/progress/${learningPathId}`);
            }
            else {
                await axios.post('/api/learning/progress',
                    {
                        learningPathId: learningPathId,
                        exerciseId: exerId
                    }
                );
            }

            navigate('/home');
        } catch (err) {
            setError(err.message);
        }
    }

    const restartLesson = async function () {
        changeCurrentExercise(exercises, 0);
    }

    useEffect(() => {
        async function getData() {
            try {
                let response = await axios.get(`/api/learning/path/${learningPathId}`);
                const learningPathTemp = response.data;
                setLearningPathData(learningPathTemp);
                response = await axios.get(`/api/learning/path/${learningPathId}/exercises`);

                if (response && response.data && response.data.length > 0) {
                    const exercisesTemp = response.data;
                    setExercises(exercisesTemp);
                    let exCurInd = 0;
                    if (learningPathTemp.exerciseId != null) {
                        exCurInd = exercisesTemp.findIndex(e => e.exerciseId == learningPathTemp.exerciseId);
                        if (exCurInd < 0) {
                            exCurInd = 0;
                        }
                    }
                    changeCurrentExercise(exercisesTemp, exCurInd);
                }
            } catch (err) {
                setError(err.message);
            }
        }
        getData();

    }, [learningPathId]);


    return (
        <>
            <AuthHeader />
            <div className="form-container">
                {error != "" && (
                    <div className="form-row">
                        <label className="form-error">{error}</label>
                    </div>
                )}
                <form>
                    {learningPathData && (
                        <>
                            <div className="form-header">
                                <h1>{`Level ${learningPathData.level}, ${learningPathData.chapter} ${learningPathData.name}`}</h1>
                            </div>
                            {!currentExercise && (
                                <div className="form-row">
                                    <div className="form-button-cell">
                                        <Link to={`/author/path/${learningPathId}`} className="link-button" title="Edit lesson"><FilePenLine /></Link>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {currentExercise &&
                        (
                            <>
                                <div className="form-row">
                                    <label className="form-label-row">{`Exercise ${(currentExercise.index + 1)} of ${learningPathData.exerciseCount}`}</label>
                                </div>
                                <Exercise key={currentExercise.exerciseId}
                                    ref={setRef}
                                    exerciseInfo={currentExercise}
                                    moveNext={moveNext}
                                    childLoaded={childLoaded}
                                    saveProgress={saveProgress}
                                    restartLesson={restartLesson}
                                    learningPathId={learningPathId} />
                            </>
                        )
                    }
                </form>
            </div>
        </>
    );
}