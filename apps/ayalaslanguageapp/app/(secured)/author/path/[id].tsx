import { View, Text, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/lib/api';
import ExerciseLine from '@/components/creator/ExerciseLine';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import { errorHandler } from '@ayalaslanguage/types/error';
import { safeParseData } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { FormHeader } from '@/components/FormHeader';
import type { EditLearningPathRequest, ExerciseData, ExerciseInfo, ExtendedExerciseInfo, LearningPathInfo, PagedExercisesRequest, PagedExercisesResponse } from '@ayalaslanguage/types/sharedfrontlib/learning';
import LessonAuthoringForm from '@/components/creator/LessonAuthoringForm';
import useTextStyles from '@/lib/useTextStyles';
import InboxMessagesComponent from '@/components/inbox/InboxMessagesComponent';
import { PAGE_SIZE } from '@/constants';
import { GridPager } from '@/components/GridPager';

export default function LessonUpdateScreen() {
  const { id: learningPathId } = useLocalSearchParams<{ id?: string }>();
  const [initialRecord, setInitialRecord] = useState<LearningPathInfo | null>(null);
  const [existingExercises, setExistingExercises] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [updateFormError, setUpdateFormError] = useState('');
  const router = useRouter();
  const { styles } = useTextStyles();

  const handleSubmit = async (setError: (s: string) => void, createExercises: any, 
    req: EditLearningPathRequest, exerciseType: number, arrData: any[]) => {
    try {
      if (initialRecord?.access == AUTHOR_ACCESS.CAN_EDIT) {
        await api.put(`/api/creator/learning-path/${learningPathId}`, req);
      }

      if (arrData != null && arrData.length > 0) {
        await createExercises(learningPathId, exerciseType, arrData);
      }

      if (arrData !== null) { //empty array is ok, null means there was an error
        router.replace(`/path/${learningPathId}`);
      }
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  async function loadExercises(newPage: number, forceRefresh: boolean) {
    try {
      setPage(newPage);

      if (Number(learningPathId) > 0) {
        const res = await api.post<PagedExercisesResponse>(`/api/learning/path/${learningPathId}/paged`,
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
          const res = await api.get<LearningPathInfo>(`/api/learning/path/${learningPathId}`);
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
        <View className="form-row">
          <Text style={styles.errorText}>{updateFormError}</Text>
        </View>
      )}
      <View className="lesson-outer-container">
        {initialRecord != null && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <LessonAuthoringForm handleSubmit={handleSubmit} initialRecord={initialRecord} reloadExercise={() => loadExercises(page, true)} headerTitle="Lesson editor" />
            <InboxMessagesComponent showOnNoData={false} title="Replies" learningPathId={initialRecord.learningPathId}  />
            {existingExercises && existingExercises.length > 0 && (
              <View style={{ paddingTop: 10 }}>
                  <Text style={styles.h2}>Existing exercises</Text>
                {existingExercises.map((existing) => (
                  <ExerciseLine key={existing.exerciseId} exerciseInfo={existing} />
                ))}
                <GridPager hasMoreData={hasMoreData} page={page} totalPages={totalPages} loadData={(pgNum:number) => loadExercises(pgNum, false)} />
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}
