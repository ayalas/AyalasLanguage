import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import { AuthHeader, LANGUAGE_INDICATOR_ENUM } from '../../../components/auth/AuthHeader';

import { LearningPathAuthoringForm } from '../../../components/content-creator/LearningPathAuthoringForm';
import { ExerciseLine } from './ExerciseLine';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import type { ExerciseData, ExerciseInfo, ExtendedExerciseInfo } from '../../../types/exercise/Exercise';
import { errorHandler } from '@ayalaslanguage/types/error';
import { safeParseData } from '../../../logic/ExerciseDataLogic';

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
        navigate(`/path/${learningPathId}`);
      }
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  async function loadExercises() {
    try {
      if (Number(learningPathId) > 0) {
        const res = await axios.get<ExerciseInfo[]>(`/api/learning/path/${learningPathId}/exercises`);
        const exercisesTemp: ExtendedExerciseInfo[] = [];
        for (const ex of res.data) {
          const newExercise: ExtendedExerciseInfo = { ...ex };
          try {
            newExercise.exerciseObject = safeParseData(ex.data) as ExerciseData;
          } catch {
            newExercise.exerciseObject = {};
            newExercise.exerciseObject.First = ex.data;
          }
          exercisesTemp.push(newExercise);
        }
        setExistingExercises(exercisesTemp);
      }
    } catch (err: unknown) {
      errorHandler(err, setUpdateFormError);
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
      } catch (err: unknown) {
        errorHandler(err, setUpdateFormError);
      }
    }
    loadAsync();
  }, [learningPathId]);

  return (
    <>
      <AuthHeader languageIndicator={LANGUAGE_INDICATOR_ENUM.SHOW_LANGUAGE} />
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
            <ExerciseLine key={existing.exerciseId} exerciseInfo={existing} />
          ))}
        </div>
      )}
    </>
  );
}
