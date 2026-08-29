import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import { LearningPathAuthoringForm } from '../../../components/content-creator/LearningPathAuthoringForm';
import { ExerciseLine } from './ExerciseLine';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import { errorHandler } from '@ayalaslanguage/types/error';
import { safeParseData } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { FormHeader } from '../../../components/FormHeader';
import type { EditLearningPathRequest, ExerciseData, ExtendedExerciseInfo, LearningPathInfo, PagedExercisesRequest, PagedExercisesResponse } from '@ayalaslanguage/types/sharedfrontlib/learning';
import { InboxMessagesComponent } from '../../../components/inbox/InboxMessagesComponent';
import { PAGE_SIZE } from '../../../constants/learning';
import { GridPager } from '../../../components/GridPager';

export function LearningPathUpdatePage() {
  const [initialRecord, setInitialRecord] = useState<LearningPathInfo | null>(null);
  const [existingExercises, setExistingExercises] = useState<ExtendedExerciseInfo[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [updateFormError, setUpdateFormError] = useState('');
  const navigate = useNavigate();
  const { learningPathId } = useParams();

  const handleSubmit = async (setError: (s: string) => void, createExercises: any, req: EditLearningPathRequest,
    exerciseType: number, arrData: any[]) => {
    try {
      if (initialRecord?.access == AUTHOR_ACCESS.CAN_EDIT) {
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

  async function loadExercises(newPage: number, forceRefresh: boolean) {
    try {
      setPage(newPage);

      if (Number(learningPathId) > 0) {
        const res = await axios.post<PagedExercisesResponse>(`/api/learning/path/${learningPathId}/paged`,
          {
            page: newPage - 1,
            refreshCount: (newPage == totalPages) || forceRefresh
          } as PagedExercisesRequest
        );
        const exercisesTemp: ExtendedExerciseInfo[] = [];
        const pagedResponse = res.data;

        if (pagedResponse.numOfRecords > 0) {
          let numOfPages = Math.trunc(pagedResponse.numOfRecords / PAGE_SIZE);
          if (pagedResponse.numOfRecords % PAGE_SIZE > 0)
            numOfPages++;
          setTotalPages(numOfPages);
        }

        setHasMoreData(pagedResponse.data.length > PAGE_SIZE);
        const tmpExercisesRaw = pagedResponse.data.slice(0, PAGE_SIZE);

        for (const ex of tmpExercisesRaw) {
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
          const res = await axios.get<LearningPathInfo>(`/api/learning/path/${learningPathId}`);
          setInitialRecord(res.data);
          await loadExercises(1, true);
        }
      } catch (err: unknown) {
        errorHandler(err, setUpdateFormError);
      }
    }
    loadAsync();
  }, [learningPathId]);

  return (
    <>
      {updateFormError !== '' && (
        <div className="form-row">
          <label className="form-error">{updateFormError}</label>
        </div>
      )}
      <div className="form-container">
        <FormHeader isPublic={false} title="Lesson editor" />
        {initialRecord != null && (
          <>
            <LearningPathAuthoringForm handleSubmit={handleSubmit} initialRecord={initialRecord} reloadExercise={() => loadExercises(page, true)} />
            <InboxMessagesComponent showOnNoData={false} title="Replies" learningPathId={initialRecord.learningPathId} />
            {existingExercises && existingExercises.length > 0 && (
              <>
                <div className="inform-header">
                  <h2>Existing exercises</h2>
                </div>
                {existingExercises.map((existing) => (
                  <ExerciseLine key={existing.exerciseId} exerciseInfo={existing} />
                ))}
                <GridPager hasMoreData={hasMoreData} page={page} totalPages={totalPages} loadData={(pgNum:number) => loadExercises(pgNum, false)} />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
