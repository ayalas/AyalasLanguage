import { useParams, useNavigate, Link, useOutletContext } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FilePenLine } from 'lucide-react';

import { AuthHeader } from '../../components/auth/AuthHeader';
import { EXERCISE_TYPES, PLACEHOLDERS } from '../../constants/learning';
import { getMissingParts, replaceCharsForLanguage } from '../../utils/languageUtils';
import { Exercise } from './exercise/Exercise';

export function LessonPage() {
    const { learningPathId } = useParams();
    const [exercises, setExercises] = useState([]);
    const [learningPathData, setLearningPathData] = useState(null);
    const [currentExercise, setCurrentExercise] = useState(null);
    const [practiseMistakesInThisPath, setPractiseMistakesInThisPath] = useState(false);
    const [error, setError] = useState("");
    const exerciseRefs = useRef(new Map());
    const navigate = useNavigate();
    const { user } = useOutletContext();

    const changeCurrentExercise = function (arrExercises, index) {
        const curItem = arrExercises[index];

        const data = JSON.parse(curItem.data);

        const firstData = replaceCharsForLanguage(
            user.languageSettings.targetLanguage, data.First
        );
        const secondData = replaceCharsForLanguage(
            user.languageSettings.targetLanguage, data.Second
        );

        if (curItem.exerciseTypeId == EXERCISE_TYPES.FILL_IN_THE_BLANKS) {
            let sentenceElements = firstData.split(PLACEHOLDERS.BLANKS);
            for (let i=0;i<sentenceElements.length;i++) {
                sentenceElements[i] = sentenceElements[i].trim();
            }

            let answers = getMissingParts(secondData, sentenceElements);
            setCurrentExercise({
                ...curItem,
                data,
                sentenceElements,
                answers,
                index
            });
        }
        else if (curItem.exerciseTypeId == EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET) {
            setCurrentExercise({
                ...curItem,
                data,
                sentenceElements: [firstData],
                answers: secondData.trim().split(' '),
                extraItems: replaceCharsForLanguage(
                        user.languageSettings.targetLanguage,data.ExtraOptions).trim().split(' '),
                index
            });
        }
        else if (curItem.exerciseTypeId != EXERCISE_TYPES.MATCHING) {
            setCurrentExercise({
                ...curItem,
                data,
                sentenceElements: [firstData],
                answers: [secondData],
                index
            });
        }
        else {
            let sentenceElements = firstData.split(',');

            let answers = secondData.split(',');

            setCurrentExercise({
                ...curItem,
                data,
                sentenceElements,
                answers,
                index
            });
        }
        if (curItem.exerciseTypeId != EXERCISE_TYPES.MATCHING
            && curItem.exerciseTypeId != EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET
        ) {
            const refItem = exerciseRefs.current.get(curItem.exerciseId);
            if (refItem) {
                exerciseRefs.current.get(curItem.exerciseId).setFocus();
            }
        }
    }

    const childLoaded = function (exerciseId) {
        if (exerciseId == currentExercise.exerciseId) {
            if (currentExercise.exerciseTypeId != EXERCISE_TYPES.MATCHING &&
                currentExercise.exerciseTypeId != EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET
            ) {
                const refItem = exerciseRefs.current.get(currentExercise.exerciseId);
                if (refItem) {
                    exerciseRefs.current.get(currentExercise.exerciseId).setFocus();
                }
            }
        }
    }

    

    const changeMistakesSetting = async function (readd) {
        try {

            //save the exercise to preserve the record even if it's the first one
            await axios.post('/api/learning/progress',
                {
                    learningPathId: learningPathId,
                    exerciseId: currentExercise.exerciseId,
                    practiseMistakesInThisPath: readd
                }
            );

            setPractiseMistakesInThisPath(readd);
        } catch (err) {
            setError(err.message);
        }
    }

    const addMistake = async function (exerciseId) {
        try {

            //save the exercise to preserve the record even if it's the first one
            await axios.post('/api/learning/mistake',
                {
                    exerciseId: exerciseId
                }
            );
        } catch (err) {
            setError(err.message);
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
                setPractiseMistakesInThisPath(learningPathTemp.practiseMistakesInThisPath);
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
                                    learningPathId={learningPathId}
                                    changeMistakesSetting={changeMistakesSetting}
                                    practiseMistakesInThisPath={practiseMistakesInThisPath}
                                    addMistake={addMistake} />
                            </>
                        )
                    }
                </form>
            </div>
        </>
    );
}