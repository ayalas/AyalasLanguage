import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, FlatList, Pressable, ScrollView } from 'react-native'
import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowBigLeft, Save } from "lucide-react-native";

import { errorHandler } from '@ayalaslanguage/types/error';
import type { ExerciseData, ExerciseInfo, ExtendedExerciseInfo } from '@ayalaslanguage/types/sharedfrontlib/learning';
import { EXERCISE_TYPE_LOGIC } from '@ayalaslanguage/types/sharedfrontlib/logic';

import { AlternativeLine, type AlternativeHandle } from "@/components/creator/AlternativeLine";
import SecuredHeader from "@/components/SecuredHeader";
import { FormHeader } from "@/components/FormHeader";
import api from "@/lib/api";
import useTextStyles from '@/lib/useTextStyles';

export default function ExerciseScreen() {
  const { id: exerciseId } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [error, setError] = useState('');
  const [typeName, setTypeName] = useState('');
  const [initialRecord, setInitialRecord] = useState<ExtendedExerciseInfo | null>(null);
  const [firstLine, setFirstLine] = useState('');
  const [secondLine, setSecondLine] = useState('');
  const [translation, setTranslation] = useState('');
  const [extraOptions, setExtraOptions] = useState('');
  const { styles } = useTextStyles();
  const alternativeRefs = useRef<Map<string, AlternativeHandle>>(new Map());

  async function onFormSubmit() {
    try {

      const arr: string[] = [];
      if (initialRecord?.exerciseObject?.Alternatives != null
        && initialRecord?.exerciseObject?.Alternatives.length > 0
      ) {
        const map = alternativeRefs.current;
        for (const [key, handle] of map.entries()) {
          if (handle.exists()) {
            arr.push(key);
          }
        }
      }

      const dataToSend: ExerciseData = {
        First: firstLine,
        Second: secondLine,
        ExtraOptions: extraOptions,
        Translation: translation,
        Alternatives: arr
      };

      const data = JSON.stringify(dataToSend);

      await api.put(`/api/creator/exercise/${exerciseId}`, { Data: data });

      router.replace(`/author/path/${initialRecord?.learningPathId}`);
    } catch (ex: unknown) {
      errorHandler(ex, setError);
    }
  }

  function onBackClick() {

    if (initialRecord != null && initialRecord.learningPathId != null) {
      router.replace(`/author/path/${initialRecord?.learningPathId}`);
    }
  }



  useEffect(() => {
    async function loadAsync() {
      try {
        if (Number(exerciseId) > 0) {
          const res = await api.get<ExerciseInfo>(`/api/creator/exercise/${exerciseId}`);
          const exerciseTemp: ExtendedExerciseInfo = { ...res.data };
          console.log(exerciseTemp);
          if (exerciseTemp.data != null && exerciseTemp.data !== "") {
            exerciseTemp.exerciseObject = JSON.parse(exerciseTemp.data);
            
          }
          setInitialRecord(exerciseTemp);
          setTypeName(EXERCISE_TYPE_LOGIC[exerciseTemp.exerciseTypeId].Name);
          if (exerciseTemp.exerciseObject != null) {
            if (exerciseTemp.exerciseObject.First != null) {
              setFirstLine(exerciseTemp.exerciseObject.First);
            }
            if (exerciseTemp.exerciseObject.Second != null) {
              setSecondLine(exerciseTemp.exerciseObject.Second);
            }
            if (EXERCISE_TYPE_LOGIC[exerciseTemp.exerciseTypeId].ShowsTranslationOnRevealedAnswer) {
              setTranslation(exerciseTemp.exerciseObject.Translation as string);
            }
            if (EXERCISE_TYPE_LOGIC[exerciseTemp.exerciseTypeId].HasExtraOptions) {
              setExtraOptions(exerciseTemp.exerciseObject.ExtraOptions as string);
            }
          }
        }
      } catch (err: unknown) {
        errorHandler(err, setError);
      }
    }
    loadAsync();
  }, [exerciseId]);

  return (
    <View className="root">
      <SecuredHeader />
      <View className="form-container">
        <FormHeader title="Exercise editor" />
        <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={true}>
        <Pressable onPress={Keyboard.dismiss} accessible={false}>
          <View>
            {error !== '' && (
              <View className="form-row">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <Text style={styles.label}>Exercise Type</Text>
            <View className="form-row">
              <View className="form-input-row">
                <Text style={styles.text}>{typeName}</Text>
              </View>
            </View>
          </View>
        </Pressable>
        <KeyboardAvoidingView>
          <Text style={styles.label}>First line</Text>
          <View className="form-row">
            <View className="form-input-row">
              <TextInput multiline={true} numberOfLines={2} testID="first-line" className="text-area-minimal" value={firstLine} onChangeText={setFirstLine} />
            </View>
          </View>
          <Text style={styles.label}>Second line</Text>
          <View className="form-row">
            <View className="form-input-row">
              <TextInput multiline={true} numberOfLines={2} testID="second-line" className="text-area-minimal" value={secondLine} onChangeText={setSecondLine} />
            </View>
          </View>
          {initialRecord != null && EXERCISE_TYPE_LOGIC[initialRecord.exerciseTypeId].ShowsTranslationOnRevealedAnswer && (
            <>
              <Text style={styles.label}>Translation</Text>
              <View className="form-row">
                <View className="form-input-row">
                  <TextInput multiline={true} numberOfLines={2} testID="translation" className="text-area-minimal" value={translation} onChangeText={setTranslation} />
                </View>
              </View>
            </>
          )}
          {initialRecord != null && EXERCISE_TYPE_LOGIC[initialRecord.exerciseTypeId].HasExtraOptions && (
            <>
              <Text style={styles.label}>Extra Options</Text>
              <View className="form-row">
                <View className="form-input-row">
                  <TextInput multiline={true} numberOfLines={2} testID="extra-options" className="text-area-minimal" value={extraOptions} onChangeText={setExtraOptions} />
                </View>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
        {initialRecord != null && initialRecord.exerciseObject != null
          && initialRecord.exerciseObject.Alternatives != null
          && initialRecord.exerciseObject.Alternatives.length > 0 && (
            <>
              <Text style={styles.label}>Alternatives</Text>
              <FlatList
                keyExtractor={(item) => item}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                data={initialRecord.exerciseObject.Alternatives}
                renderItem={({item}) => {
                  const setRef = (el: AlternativeHandle) => {
                    if (el) {
                      alternativeRefs.current.set(item, el);
                    } else {
                      alternativeRefs.current.delete(item);
                    }
                  };
                  return (
                    <AlternativeLine ref={setRef} alternative={item} />
                  );
                }}
              />
            </>)}
        <View className="buttons-container">
          <View className="form-button-cell">
            <TouchableOpacity testID="back" className="form-button" onPress={onBackClick}><ArrowBigLeft className='color-brand-primary' /><Text style={styles.text}>&nbsp;Back</Text></TouchableOpacity>
          </View>
          <View className="form-button-cell">
            <TouchableOpacity testID="save" className="form-button" onPress={onFormSubmit}><Save className='color-brand-primary' /><Text style={styles.text}>&nbsp;Save</Text></TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </View>
    </View>
  );
}