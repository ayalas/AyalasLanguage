import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

import { AuthHeader } from '../../components/AuthHeader';
import { EXERCISE_TYPES, PLACEHOLDERS } from '../../constants/learning';
import { getMissingParts } from '../../utils/utils';
import { Exercise }  from '../../components/Exercise';

export function LessonPage() {
    const { learningPathId } = useParams();
    const [exercises, setExercises] = useState([]);
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
            const refItem = exerciseRefs.current.get(curItem.exerciseId);
            if (refItem) {
                exerciseRefs.current.get(curItem.exerciseId).setFocus();
            }
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

    const moveNext = async function() {
        if (currentExercise.index < exercises.length-1) {
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

    useEffect(() => {
        async function getData() {
            try {
                const response = await axios.get('/api/learning/path/24/exercises');

                if (response && response.data && response.data.length > 0) {
                    setExercises(response.data);
                    changeCurrentExercise(response.data, 0);
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
                    <div className="form-header">
                        <h1>Exercise</h1>
                    </div>
                    
                    {currentExercise &&
                        (
                            <Exercise key={currentExercise.exerciseId} 
                                ref={setRef}
                                exerciseInfo={currentExercise} 
                                moveNext={moveNext}
                                childLoaded={childLoaded} />
                        )
                    }
                </form>
            </div>
        </>
    );
}