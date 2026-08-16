import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { LearningPathAuthoringForm } from '../../components/content-creator/LearningPathAuthoringForm';
import { errorHandler } from '@ayalaslanguage/types/error';
import { FormHeader } from '../../components/FormHeader';
import type { EditLearningPathRequest } from '@ayalaslanguage/types/sharedfrontlib/learning';

export function LearningPathCreatePage() {
  const navigate = useNavigate();

  const handleSubmit = async (setError: (s: string) => void, createExercises: any, 
      req: EditLearningPathRequest, exerciseType: number, arrData: any[]) => {
    let learningPathId = 0;
    try {

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
    <div className="form-container">
      <FormHeader isPublic={false} title="Generate Lesson" />
      <LearningPathAuthoringForm handleSubmit={handleSubmit} />
    </div>
  );
}
