import { useRouter } from 'expo-router';
import SecuredHeader, { LANGUAGE_INDICATOR_ENUM } from '@/components/SecuredHeader';
import LessonAuthoringForm from '@/components/creator/LessonAuthoringForm';
import { errorHandler } from '@ayalaslanguage/types/error';
import { FormHeader } from '@/components/FormHeader';
import api from '@/lib/api';
import { View } from 'react-native';

export default function LessonCreateScreen() {
  const router = useRouter();

  const handleSubmit = async (setError: (s: string) => void, createExercises: any, level: number, chapter: number, title: string, exerciseType: number, arrData: any[]) => {
    let learningPathId = 0;
    try {
      const req: any = { level, chapter, name: title };

      const response = await api.post('/api/creator/learning-path', req);
      learningPathId = response.data.learningPathId;

      if (arrData != null && arrData.length > 0) {
        await createExercises(learningPathId, exerciseType, arrData);
        router.replace(`/path/${learningPathId}`);
      } else {
        router.replace(`/author/path/${learningPathId}`);
      }
    } catch (err: unknown) {
      if (learningPathId > 0) {
        await api.delete(`/api/creator/learning-path/${learningPathId}`);
      }
      errorHandler(err, setError);
    }
  };

  return (
    <>
      <SecuredHeader languageIndicator={LANGUAGE_INDICATOR_ENUM.SHOW_LANGUAGE} />
      <View className="form-container">
        <FormHeader title="Generate Lesson" />
        <LessonAuthoringForm handleSubmit={handleSubmit} />
      </View>
    </>
  );
}
