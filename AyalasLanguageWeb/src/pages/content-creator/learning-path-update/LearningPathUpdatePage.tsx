import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import { AuthHeader } from '../../../components/auth/AuthHeader';

import { LearningPathAuthoringForm } from '../../../components/content-creator/LearningPathAuthoringForm';
import { ExerciseLineForDelete } from './ExerciseLineForDelete';
import { AUTHOR_ACCESS } from '../../../constants/learning';

export function LearningPathUpdatePage() {
  const [initialRecord, setInitialRecord] = useState<any | null>(null);
  const [existingExercises, setExistingExercises] = useState<any[]>([]);
  const [updateFormError, setUpdateFormError] = useState('');
  const navigate = useNavigate();
  const { learningPathId } = useParams();

  const handleSubmit = async (setError: (s: string) => void, createExercises: any, level: number, chapter: number, title: string, exerciseType: number, arrData: any[]) => {
    try {
      if (initialRecord?.access == AUTHOR_ACCESS.CAN_EDIT) {
        const req = { level, chapter, name: title } as any;
        await axios.put(`/api/creator/learning-path/${learningPathId}`, req);
      }

      if (arrData != null && arrData.length > 0) {
        await createExercises(learningPathId, exerciseType, arrData);
      }

      if (arrData !== null) { //empty array is ok, null means there was an error
        navigate('/home');
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  };

  async function loadExercises() {
    try {
      if (Number(learningPathId) > 0) {
        const res = await axios.get(`/api/learning/path/${learningPathId}/exercises`);
        const exercisesTemp: any[] = [];
        for (const ex of res.data) {
          const newExercise: any = { ...ex };
          try {
            newExercise.exerciseObject = JSON.parse(ex.data);
          } catch {
            newExercise.exerciseObject = {};
            newExercise.exerciseObject.First = ex.data;
          }
          exercisesTemp.push(newExercise);
        }
        setExistingExercises(exercisesTemp);
      }
    } catch (err: any) {
      setUpdateFormError(err?.message || String(err));
    }
  }

  useEffect(() => {
    async function loadAsync() {
      try {
        if (Number(learningPathId) > 0) {
          const res = await axios.get(`/api/learning/path/${learningPathId}`);
          setInitialRecord(res.data);
          await loadExercises();
        }
      } catch (err: any) {
        setUpdateFormError(err?.message || String(err));
      }
    }
    loadAsync();
  }, [learningPathId]);

  return (
    <>
      <AuthHeader />
      {updateFormError !== '' && (
        <div className="form-row">
          <label className="form-error">{updateFormError}</label>
        </div>
      )}
      <LearningPathAuthoringForm handleSubmit={handleSubmit} initialRecord={initialRecord} reloadExercise={loadExercises} />
      {existingExercises && existingExercises.length > 0 && (
        <div className="form-row">
          <div className="form-content-row">
            <h2>Existing exercises</h2>
          </div>
          {existingExercises.map((existing) => (
            <ExerciseLineForDelete key={existing.exerciseId} exerciseInfo={existing} />
          ))}
        </div>
      )}
    </>
  );
}
