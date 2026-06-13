import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

import { AuthHeader } from '../../components/auth/AuthHeader';

import { LearningPathAuthoringForm } from '../../components/content-creator/LearningPathAuthoringForm';
import { errorHandler } from '../../utils/utils';

export function LearningPathCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prevId = searchParams.get('prev');
  const nextId = searchParams.get('next');

  const handleSubmit = async (setError: (s: string) => void, createExercises: any, level: number, chapter: number, title: string, exerciseType: number, arrData: any[]) => {
    let learningPathId = 0;
    try {
      const req: any = { level, chapter, name: title };

      if (prevId && Number(prevId) > 0) {
        req.prevLearningPathId = prevId;
      }
      if (nextId && Number(nextId) > 0) {
        req.nextLearningPathId = nextId;
      }
      const response = await axios.post('/api/creator/learning-path', req);
      learningPathId = response.data.learningPathId;

      if (arrData != null && arrData.length > 0) {
        await createExercises(learningPathId, exerciseType, arrData);
        navigate(`/path/${learningPathId}`);
      } else {
        navigate(`/author/path/${learningPathId}`);
      }
    } catch (err: unknown) {
      if (learningPathId > 0) {
        await axios.delete(`/api/creator/learning-path/${learningPathId}`);
      }
      errorHandler(err, setError);
    }
  };

  return (
    <>
      <AuthHeader />
      <LearningPathAuthoringForm handleSubmit={handleSubmit} />
    </>
  );
}
