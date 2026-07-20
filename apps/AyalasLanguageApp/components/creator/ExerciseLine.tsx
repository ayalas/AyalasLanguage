import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react';
import { SquarePen, Trash2 } from 'lucide-react-native';
import api from '@/lib/api';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import { useRouter } from 'expo-router';
import type { ExtendedExerciseInfo } from '@ayalaslanguage/types/sharedfrontlib/learning';
import { errorHandler } from '@ayalaslanguage/types/error';
import useTextStyles from '@/lib/useTextStyles';

export default function ExerciseLine({ exerciseInfo }: { exerciseInfo: ExtendedExerciseInfo }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [exists, setExists] = useState(true);
  const { styles } = useTextStyles();

  async function onDeleteClick() {
    try {
      await api.delete(`/api/creator/exercise/${exerciseInfo.exerciseId}`);
      setExists(false);
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  }

  function onEditClick() {
    router.replace(`/author/exercise/${exerciseInfo.exerciseId}`)
  }

  return (
    <>
      {exists && (
        <View className="form-row">
          <View className="content-line-part">
            {exerciseInfo.access === AUTHOR_ACCESS.CAN_EDIT && (
              <View className="form-button-cell">
                <TouchableOpacity testID="delete-item" className="form-button button-delete-item" onPress={onDeleteClick}>
                  <Trash2 width="18" height="18" className="color-brand-primary" />
                </TouchableOpacity>
                <TouchableOpacity testID="edit-item" className="form-button button-edit-item" onPress={onEditClick}>
                  <SquarePen width="18" height="18" className="color-brand-primary" />
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.text}>{exerciseInfo.exerciseObject?.First}</Text>
          </View>
        </View>
      )}
      {error !== '' && (
        <View className="form-row">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );
}
