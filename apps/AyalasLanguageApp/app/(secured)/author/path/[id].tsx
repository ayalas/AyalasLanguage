import { View, Text, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/lib/api';
import ExerciseLine from '@/components/creator/ExerciseLine';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import { errorHandler } from '@ayalaslanguage/types/error';
import { safeParseData } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { FormHeader } from '@/components/FormHeader';
import type { ExerciseData, ExerciseInfo, ExtendedExerciseInfo, LearningPathInfo } from '@ayalaslanguage/types/sharedfrontlib/learning';
import LessonAuthoringForm from '@/components/creator/LessonAuthoringForm';
import useTextStyles from '@/lib/useTextStyles';

export default function LessonUpdateScreen() {
  const { id: learningPathId } = useLocalSearchParams<{ id?: string }>();
  const [initialRecord, setInitialRecord] = useState<LearningPathInfo | null>(null);
  const [existingExercises, setExistingExercises] = useState<any[]>([]);
  const [updateFormError, setUpdateFormError] = useState('');
  const router = useRouter();
  const { styles } = useTextStyles();

  const handleSubmit = async (setError: (s: string) => void, createExercises: any, level: number, chapter: number, title: string, exerciseType: number, arrData: any[]) => {
    try {
      if (initialRecord?.access == AUTHOR_ACCESS.CAN_EDIT) {
        const req = { level, chapter, name: title } as any;
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

  async function loadExercises() {
    try {
      if (Number(learningPathId) > 0) {
        const res = await api.get<ExerciseInfo[]>(`/api/learning/path/${learningPathId}/exercises`);
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
          const res = await api.get<LearningPathInfo>(`/api/learning/path/${learningPathId}`);
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
      {updateFormError !== '' && (
        <View className="form-row">
          <Text style={styles.errorText}>{updateFormError}</Text>
        </View>
      )}
      <View className="lesson-outer-container">
        {initialRecord != null && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <LessonAuthoringForm handleSubmit={handleSubmit} initialRecord={initialRecord} reloadExercise={loadExercises} headerTitle="Lesson editor" />
            {existingExercises && existingExercises.length > 0 && (
              <View style={{ paddingTop: 10 }}>
                <View className="inform-header">
                  <Text style={styles.h2}>Existing exercises</Text>
                </View>
                {existingExercises.map((existing) => (
                  <ExerciseLine key={existing.exerciseId} exerciseInfo={existing} />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}
