import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

import { AuthHeader } from '../../components/auth/AuthHeader';

import { LearningPathAuthoringForm } from '../../components/content-creator/LearningPathAuthoringForm';


export function LearningPathCreatePage() {
    const navigate = useNavigate();
    const [ searchParams ] = useSearchParams();
    const prevId = searchParams.get('prev');
    const nextId = searchParams.get('next');

    const handleSubmit = async (setError, createExercises, level, chapter, title, exerciseType, arrData) => {
        let learningPathId = 0;
        try {
            if (arrData == null || arrData.length == 0) {
                setError("Please fill in initial exercises data.");
                return;
            }
            //first, create the learning path
            const req = {
                    level,
                    chapter,
                    name: title   
                };
            
            if (prevId > 0) {
                req.prevLearningPathId = prevId;
            }
            if (nextId > 0) {
                req.nextLearningPathId = nextId;
            }
            const response = await axios.post('/api/creator/learning-path', req);
            learningPathId = response.data.learningPathId;

            //then, create the exercises within it
            await createExercises(learningPathId, exerciseType, arrData);

            //navigate to home
            navigate('/home');

        } catch (err) {
            if (learningPathId > 0) {
                await axios.delete(`/api/creator/learning-path/${learningPathId}`);
            }
            setError(err.message);
        }
    };

    return (
        <>
            <AuthHeader />
            <LearningPathAuthoringForm handleSubmit={handleSubmit} />
        </>
    );
}