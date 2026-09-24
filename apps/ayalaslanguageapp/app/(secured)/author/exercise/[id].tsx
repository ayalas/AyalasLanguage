import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, FlatList, Pressable, ScrollView } from 'react-native'
import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowBigLeft, Save } from "lucide-react-native";

import { errorHandler } from '@ayalaslanguage/types/error';
import type { ExerciseData, ExerciseInfo, ExtendedExerciseInfo } from '@ayalaslanguage/types/sharedfrontlib/learning';
import { EXERCISE_TYPE_LOGIC } from '@ayalaslanguage/types/sharedfrontlib/logic';
import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { getAIInstructions, type AIChatRequestDto, type IChatMessage } from '@ayalaslanguage/types/sharedfrontlib/ai';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';

import { AlternativeLine, type AlternativeHandle } from "@/components/creator/AlternativeLine";
import SecuredHeader from "@/components/SecuredHeader";
import { FormHeader } from "@/components/FormHeader";
import api from "@/lib/api";
import useTextStyles from '@/lib/useTextStyles';
import { OWNERSHIP_TYPE, OwnershipType } from '@ayalaslanguage/types/auth';
import Checkbox from 'expo-checkbox';
import { useAuth } from '@/lib/AuthContext';


export default function ExerciseScreen() {
  const { id: exerciseId, returnToPage } = useLocalSearchParams<{ id?: string; returnToPage?: string }>();
  const router = useRouter();
  const [error, setError] = useState('');
  const [typeName, setTypeName] = useState('');
  const [initialRecord, setInitialRecord] = useState<ExtendedExerciseInfo | null>(null);
  const [firstLine, setFirstLine] = useState('');
  const [secondLine, setSecondLine] = useState('');
  const [translation, setTranslation] = useState('');
  const [corrections, setCorrections] = useState('');
  const [aiCheckCompleted, setAICheckCompleted] = useState(false);
  const [aiCorrections, setAICorrections] = useState<ExerciseData | null>(null);
  const [extraOptions, setExtraOptions] = useState('');
  const [ownershipType, setOwnershipType] = useState<OwnershipType>(OWNERSHIP_TYPE.PUBLIC);
  const [propagateChanges, setPropagateChanges] = useState(false);
  const { styles } = useTextStyles();
  const alternativeRefs = useRef<Map<string, AlternativeHandle>>(new Map());
  const { user } = useAuth();

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

      await api.put(`/api/creator/exercise/${exerciseId}`, { Data: data, ownershipType, propagateChanges });

      if (returnToPage != null) {
        router.replace({
          pathname: `/author/path/[id]`,
          params: {
            id: initialRecord?.learningPathId || '',
            page: returnToPage
          }
        });
      }
      else {
        router.replace(`/path/${initialRecord?.learningPathId}`);
      }
    } catch (ex: unknown) {
      errorHandler(ex, setError);
    }
  }

  function prepareAIRequest() {
        const exrTypeValue: ExerciseType = initialRecord?.exerciseTypeId as ExerciseType;
        const exType = EXERCISE_TYPE_LOGIC[exrTypeValue].GenerationInfo;
        if (exType == null) return null;

        let aiMessages: IChatMessage[];
        const numOfExercises = 1;
        const targetLanguage = user?.languageSettings?.targetLanguageEnglishName || '';
        const targetLanguageCode = user?.languageSettings?.targetLanguageCode || '';
        const knownLanguage = user?.languageSettings?.knownLanguage || '';
        const matchesNum = EXERCISE_TYPE_LOGIC[exrTypeValue].IsMatchingType ? initialRecord?.exerciseObject?.Second?.split(',').length || 0 : 0;
        const extraOptionsNum = EXERCISE_TYPE_LOGIC[exrTypeValue].HasExtraOptions ? initialRecord?.exerciseObject?.ExtraOptions?.split(' ').length || 0 : 0;

        //automatic ai instructions (returning json)
        aiMessages = getAIInstructions(exType, targetLanguage, targetLanguageCode, knownLanguage, numOfExercises, matchesNum, extraOptionsNum, true, "", initialRecord?.data || '');

        return {
            exerciseType: exrTypeValue,
            numOfExercises,
            matches: matchesNum,
            extraOptions: extraOptionsNum,
            messages: aiMessages
        } as AIChatRequestDto;
    }

    async function sendCheckRequestToAI(req: AIChatRequestDto) {
        let response: any;
        let arrObjects: ExerciseData[] = [];
        try {
            response = await api.post('/api/ai/unclose/chat', req);
        }
        catch (err: unknown) {
            errorHandler(err, (errMsg: string) => {
                setError(`AI check failed. Error: ${errMsg}`);
            });
            return null;
        }

        if (response.data !== undefined && response.data !== null) {
            // Extract the raw string response
            const objData = response.data;

            if (objData === undefined || objData.content === undefined) {
                setError('AI check did not return a result.');
                return null;
            }
            // Extract the raw string response
            const jsonOutput = objData.content;

            if (!Array.isArray(jsonOutput)) {
                setError('AI check did not return the expected result.');
                return null;
            }
            else {
                //verify that has at least one element that can be assigned to ExerciseData
                if (jsonOutput.length == 0) {
                    setError('AI check returned an empty result.');
                    return null;
                }
                else {
                    //validate array structure
                    let isValid = true;
                    for (const item of jsonOutput) {
                        if (!(typeof item === 'object') && item !== null && !Array.isArray(item)) {
                            isValid = false;
                            break;
                        }
                        if (!('First' in item) || !('Second' in item)
                            || (EXERCISE_TYPE_LOGIC[req.exerciseType].HasExtraOptions && !('ExtraOptions' in item))) {
                            isValid = false;
                            break;
                        }

                        if ((typeof (item as Record<string, unknown>).First !== 'string') || (typeof (item as Record<string, unknown>).Second !== 'string')
                            || (EXERCISE_TYPE_LOGIC[req.exerciseType].HasExtraOptions && (typeof (item as Record<string, unknown>).ExtraOptions !== 'string'))) {
                            isValid = false;
                            break;
                        }
                    }

                    if (!isValid) {
                        setError('AI check returned the expected result structure.');
                        return null;
                    }

                    arrObjects = jsonOutput;
                }
            }
        }
        else {
            setError('AI check did not return a result.');
            return null;
        }

        return arrObjects;
    }

    async function onAICheckClick() {
        setAICheckCompleted(false);
        setCorrections('');
        setAICorrections(null);
        setError('Processing AI check...');
        const req = prepareAIRequest();


        if (!req || req.messages.length == 0) {
            setError('There is no automated AI instruction for this exercise type.');
            return;
        }

        const arrObjects: ExerciseData[] | null = await sendCheckRequestToAI(req);

        if (arrObjects == null || arrObjects.length == 0) {
            return;
        }

        const theExercise = arrObjects[0];

        if (theExercise.First !== initialRecord?.exerciseObject?.First
            || theExercise.Second !== initialRecord?.exerciseObject?.Second
            || (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].ShowsTranslationOnRevealedAnswer
                && theExercise.Translation !== initialRecord?.exerciseObject?.Translation)
            || (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].HasExtraOptions 
                && theExercise.ExtraOptions !== initialRecord?.exerciseObject?.ExtraOptions)) {
            setAICorrections(theExercise);
            setError('AI check offers corrections for this exercise:');
            let messageArr = [
                `First line: ${theExercise.First}`,
                `Second line: ${theExercise.Second}`
            ];
            if ( EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].HasExtraOptions  &&
                theExercise.ExtraOptions !== undefined && theExercise.ExtraOptions !== '') {
                messageArr.push(`Extra options: ${theExercise.ExtraOptions}`);
            }
            if (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].ShowsTranslationOnRevealedAnswer &&
                theExercise.Translation !== undefined && theExercise.Translation !== '') {
                messageArr.push(`Translation: ${theExercise.Translation}`);
            }
            setCorrections(messageArr.join('\n'));
        }
        else {
            setAICheckCompleted(true);
            setError('');
        }

    }

    function onApplyAICorrections() {
        if (aiCorrections) {
            setFirstLine(aiCorrections.First || '');
            setSecondLine(aiCorrections.Second || '');
            if (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].ShowsTranslationOnRevealedAnswer) {
                setTranslation(aiCorrections.Translation as string);
            }
            if (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].HasExtraOptions) {
                setExtraOptions(aiCorrections.ExtraOptions as string);
            }
        }

        setAICheckCompleted(false);
        setCorrections('');
        setAICorrections(null);
        setError('');
    }

    function onDismissAICorrections() {
        setAICheckCompleted(false);
        setCorrections('');
        setAICorrections(null);
        setError('');
    }

  function onBackClick() {

    if (initialRecord != null && initialRecord.learningPathId != null) {
      router.replace(`/path/${initialRecord?.learningPathId}`);
    }
  }

  function onBackEditorClick() {

    if (initialRecord != null && initialRecord.learningPathId != null) {
      router.replace({
        pathname: `/author/path/[id]`,
        params: {
          id: initialRecord?.learningPathId || '',
          page: returnToPage
        }
      });
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
          setOwnershipType(exerciseTemp.ownershipType);
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

              {corrections !== '' && (
                        <View className="form-row">
                             <View className="form-input-long">
                                <TextInput multiline={true} numberOfLines={4} testID="corrections" className="text-area-wide" readOnly={true} value={corrections} />
                             </View>
                        </View>
                    ) || (aiCheckCompleted && (
                        <View className="form-row">
                            <Text style={styles.dimmedText}>AI check completed. No corrections found.</Text>
                        </View>
                    ))}
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
              <View className="form-input-long">
                <TextInput multiline={true} numberOfLines={2} testID="first-line" className="text-area-minimal" value={firstLine} onChangeText={setFirstLine} />
              </View>
            </View>
            <Text style={styles.label}>Second line</Text>
            <View className="form-row">
              <View className="form-input-long">
                <TextInput multiline={true} numberOfLines={2} testID="second-line" className="text-area-minimal" value={secondLine} onChangeText={setSecondLine} />
              </View>
            </View>
            {initialRecord != null && EXERCISE_TYPE_LOGIC[initialRecord.exerciseTypeId].ShowsTranslationOnRevealedAnswer && (
              <>
                <Text style={styles.label}>Translation</Text>
                <View className="form-row">
                  <View className="form-input-long">
                    <TextInput multiline={true} numberOfLines={2} testID="translation" className="text-area-minimal" value={translation} onChangeText={setTranslation} />
                  </View>
                </View>
              </>
            )}
            {initialRecord != null && EXERCISE_TYPE_LOGIC[initialRecord.exerciseTypeId].HasExtraOptions && (
              <>
                <Text style={styles.label}>Extra Options</Text>
                <View className="form-row">
                  <View className="form-input-long">
                    <TextInput multiline={true} numberOfLines={2} testID="extra-options" className="text-area-minimal" value={extraOptions} onChangeText={setExtraOptions} />
                  </View>
                </View>
              </>
            )}

            <View className="form-row">
              <View className="form-input-row">
                <Checkbox data-testid="propagateChanges" value={propagateChanges} onValueChange={setPropagateChanges} />
                <Text style={styles.text}>Change everywhere</Text>
              </View>
              <Text style={styles.dimmedText}>Propagate to copies of this exercise</Text>
            </View>

            <View className="form-row">
              <View className="form-input-row">
                <Checkbox data-testid="private" value={ownershipType == OWNERSHIP_TYPE.USER} onValueChange={(isChecked: boolean) => { setOwnershipType(isChecked ? OWNERSHIP_TYPE.USER : OWNERSHIP_TYPE.PUBLIC) }} />
                <Text style={styles.text}>Private</Text>
              </View>
              <Text style={styles.dimmedText}>Make this exercise private, so only you can see it</Text>
            </View>

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
                  renderItem={({ item }) => {
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
              <TouchableOpacity testID="back" className="form-button" onPress={onBackClick}><ArrowBigLeft className='color-brand-primary' /><Text style={styles.text}>&nbsp;Back to Lesson</Text></TouchableOpacity>
            </View>
            <View className="form-button-cell">
              <TouchableOpacity testID="back-editor" className="form-button" onPress={onBackEditorClick}><Text style={styles.text}>Lesson Editor</Text></TouchableOpacity>
            </View>
            {corrections !== '' && (
                            <>
                                <View className="form-button-cell">
                                    <TouchableOpacity testID="ai-check" className="form-button" onPress={onApplyAICorrections}><Text style={styles.text}>Apply AI corrections</Text></TouchableOpacity>
                                </View>
                                <View className="form-button-cell">
                                    <TouchableOpacity testID="ai-check" className="form-button" onPress={onDismissAICorrections}><Text style={styles.text}>Dismiss AI corrections</Text></TouchableOpacity>
                                </View>
                            </>
                        ) || (
                                <View className="form-button-cell">
                                    <TouchableOpacity testID="ai-check" className="form-button" onPress={onAICheckClick}><Text style={styles.text}>Check with AI</Text></TouchableOpacity>
                                </View>
                        )}
            <View className="form-button-cell">
              <TouchableOpacity testID="save" className="form-button" onPress={onFormSubmit}><Save className='color-brand-primary' /><Text style={styles.text}>&nbsp;Save</Text></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}