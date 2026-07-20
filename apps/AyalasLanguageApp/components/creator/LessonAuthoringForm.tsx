import { useState, useEffect, useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { LayersPlus, Trash,  Ban, Workflow, UserPen, BookOpenCheck, Save, History } from 'lucide-react-native';
import { puter, type ChatMessage } from '@heyputer/puter.js';
import { Slider } from '@miblanchard/react-native-slider';

import { errorHandler } from '@ayalaslanguage/types/error';
import { removeLastCharIfMatch, parseLLMResponse, writeToLog } from '@ayalaslanguage/types/sharedfrontlib/utils';
import {
  DEFAULT_NUM_OF_EXERCISES, MAX_MATCHES, MIN_MATCHES,
  BUCKET_LIST_EXTRA_OPTIONS, type LearningPathInfo, type ExerciseData
} from '@ayalaslanguage/types/sharedfrontlib/learning';
import { ROLE_TYPE, AUTHOR_ACCESS, type AuthorAccess } from '@ayalaslanguage/types/auth';
import {
  EXERCISE_TYPE_LOGIC, SORTED_EXERCISE_TYPES,
  getAIInstructions, type IChatMessage
} from '@ayalaslanguage/types/sharedfrontlib/logic';
import type { ExerciseType } from '@ayalaslanguage/types/exercise';
import { LOG_TYPE, type LogAutoAIFailure } from '@ayalaslanguage/types/log';
import type { NextChapterResponse } from '@ayalaslanguage/types/sharedfrontlib/learning';

import { useMistakesReadd } from '@/lib/useMistakesReadd';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';
import { initializePuter } from '@/lib/puter';

import { ExerciseTypeIcon } from '@/components/ExerciseTypeIcon';
import { ActionsMenuComponent, type ActionsMenuItem } from '@/components/ActionsMenuComponent';
import useTextStyles from '@/lib/useTextStyles';
import FormDropDown from '../FormDropDown';
import { ItemType, ValueType } from 'react-native-dropdown-picker';

export default function LessonAuthoringForm({ handleSubmit, initialRecord, reloadExercise }:
  { handleSubmit: (...args: any[]) => Promise<void>; initialRecord?: LearningPathInfo; reloadExercise?: () => void }) {
  const [error, setError] = useState('');
  const [level, setLevel] = useState(1);
  const [chapter, setChapter] = useState(1);
  const [matches, setMatches] = useState<number>(MAX_MATCHES);
  const [extraOptions, setExtraOptions] = useState<number>(BUCKET_LIST_EXTRA_OPTIONS.MAX_WORDS);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [access, setAccess] = useState<AuthorAccess>(AUTHOR_ACCESS.CAN_EDIT);

  const [exerciseType, setExerciseType] = useState<ExerciseType | 0>(0);
  const [firstSet, setFirstSet] = useState('');
  const [secondSet, setSecondSet] = useState('');
  const [wrongExtraOptions, setWrongExtraOptions] = useState('');
  const [aiInstructions, setAIInstructions] = useState('');
  const { level: initLevel, chapter: initChapter } = useLocalSearchParams<{ level?: string, chapter?: string }>();
  const router = useRouter();
  const [puterSignedIn, setPuterSignedIn] = useState(false);
  const [usePuterAI, setUsePuterAI] = useState(true);

  const { styles } = useTextStyles();

  const { user } = useAuth();

  const exerciseTypes = useMemo(() => {
      return SORTED_EXERCISE_TYPES.map((exType) => { 
                  return {
                    value: exType.Type, 
                    label: exType.Name
                } as ItemType<ValueType>;}) as ItemType<ValueType>[];
      }, []); 

  const { practiseMistakesInThisPath, readdMistakes, cancelMistakesAdd } = useMistakesReadd({
    learningPathId: initialRecord?.learningPathId,
    exerciseId: initialRecord?.exerciseId, setError, initialValue: initialRecord?.practiseMistakesInThisPath ?? false
  });


  const loadFromLocalStorage = function () {
    let tempValue = localStorage.getItem("lesson-generator-matches");
    if (tempValue != null) {
      setMatches(Number(tempValue))
    }

    tempValue = localStorage.getItem("lesson-generator-wrong-options");
    if (tempValue != null) {
      setExtraOptions(Number(tempValue))
    }
  }

  const saveToLocalStorage = function () {
    if (EXERCISE_TYPE_LOGIC[exerciseType].IsMatchingType) {
      localStorage.setItem("lesson-generator-matches", matches.toString());
    }

    if (EXERCISE_TYPE_LOGIC[exerciseType].HasExtraOptions) {
      localStorage.setItem("lesson-generator-wrong-options", extraOptions.toString());
    }
  }

  const parseForm = async function () {
    let arrObjects: ExerciseData[] = [];
    if (!usePuterAI) {

      if (firstSet === '' && secondSet === '') {
        return [];
      }

      if (firstSet === '' || secondSet === '') {
        setError(`Must fill both sets. Found '${firstSet}' on the first set, and '${secondSet}' on the second set.`);
        return null;
      }

      const arrFirstSet = (removeLastCharIfMatch(firstSet.trim(), ';') ?? '').split(';');
      const arrSecondSet = (removeLastCharIfMatch(secondSet.trim(), ';') ?? '').split(';');

      if ((!arrFirstSet || arrFirstSet.length === 0) && (!arrSecondSet || arrSecondSet.length === 0)) {

        return [];
      }

      if (!arrFirstSet || !arrSecondSet || arrFirstSet.length !== arrSecondSet.length) {
        setError(`Must have a match between the number of words/sentences on both sets. Found ${arrFirstSet.length} on the first set, and ${arrSecondSet.length} on the second set.`);
        return null;
      }

      let arrExtraOptions: string[] = [];
      if (EXERCISE_TYPE_LOGIC[exerciseType].HasExtraOptions) {
        arrExtraOptions = (removeLastCharIfMatch(wrongExtraOptions.trim(), ';') ?? '').split(';');
        if (arrFirstSet.length !== arrExtraOptions.length) {
          setError(`Must have a match between the number of words/sentences and sets of extra options. Found ${arrFirstSet.length} on the first set, and ${arrExtraOptions.length} on the wrong extra options.`);
          return null;
        }
      }

      for (let i = 0; i < arrFirstSet.length; i++) {
        const objExerciseData: ExerciseData = {
          First: arrFirstSet[i].trim(),
          Second: arrSecondSet[i].trim()
        };
        if (EXERCISE_TYPE_LOGIC[exerciseType].HasExtraOptions) {
          objExerciseData.ExtraOptions = arrExtraOptions[i].trim();
        }
        arrObjects.push(objExerciseData);
      }
    }
    else { //use AI to generate exercises
      if (exerciseType === 0) {
        if (initialRecord != null) {
          return [];
        }
        setError('Select Exercise Type to generate exercises automatically.');
        return null;
      }

      let tempPuterSignin = puterSignedIn;
      if (!tempPuterSignin) {
        tempPuterSignin = (await initializePuter() == true);
        setPuterSignedIn(tempPuterSignin);
      }

      if (!tempPuterSignin) {
        setError('Sign-in to the AI engine failed. Switch to manual use of AI or try again.');
        return null;
      }

      //set auto AI instructions to have the latest subject
      const aiAutoDescNew = handleExerciseTypeLogic(exerciseType);

      if (!aiAutoDescNew || aiAutoDescNew.length == 0) {
        setError('There is no automated AI instruction for this exercise type. Switch to manual use of AI or try a different exercise type.');
        return null;
      }
      const response = await puter.ai.chat(aiAutoDescNew as ChatMessage[]);
      if (response !== undefined && response.message !== undefined) {
        // Extract the raw string response
        const rawText = response.message.content.toString();

        // Parse the string into a JSON object
        let jsonOutput: unknown;
        try {
          jsonOutput = parseLLMResponse(rawText);
        }
        catch {
          setError('Automated generation did not return in the expected result format. Switch to manual use of AI or try again.');
          writeToLog<LogAutoAIFailure>(api, LOG_TYPE.AUTO_AI_FAILURE, {
            Title: "parsing LLM response failed",
            Instruction: aiAutoDescNew.map(it => it.content).join(' '),
            Result: rawText
          } as LogAutoAIFailure);
          return null;
        }
        if (!Array.isArray(jsonOutput)) {
          setError('Automated generation did not return the expected result. Switch to manual use of AI or try again.');
          writeToLog<LogAutoAIFailure>(api, LOG_TYPE.AUTO_AI_FAILURE, {
            Title: "Result is not an array",
            Instruction: aiAutoDescNew.map(it => it.content).join(' '),
            Result: rawText
          } as LogAutoAIFailure);
          return null;
        }
        else {
          //verify that has at least one element that can be assigned to ExerciseData
          if (jsonOutput.length === 0) {
            setError('Automated generation returned an empty result. Switch to manual use of AI or try again.');
            writeToLog<LogAutoAIFailure>(api, LOG_TYPE.AUTO_AI_FAILURE, {
              Title: "Result is an empty array",
              Instruction: aiAutoDescNew.map(it => it.content).join(' '),
              Result: rawText
            } as LogAutoAIFailure);
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
                || (EXERCISE_TYPE_LOGIC[exerciseType].HasExtraOptions && !('ExtraOptions' in item))) {
                isValid = false;
                break;
              }

              if ((typeof (item as Record<string, unknown>).First !== 'string') || (typeof (item as Record<string, unknown>).Second !== 'string')
                || (EXERCISE_TYPE_LOGIC[exerciseType].HasExtraOptions && (typeof (item as Record<string, unknown>).ExtraOptions !== 'string'))) {
                isValid = false;
                break;
              }
            }

            if (!isValid) {
              setError('Automated generation returned the expected result structure. Switch to manual use of AI or try again.');
              writeToLog<LogAutoAIFailure>(api, LOG_TYPE.AUTO_AI_FAILURE, {
                Title: "Result is invalid",
                Instruction: aiAutoDescNew.map(it => it.content).join(' '),
                Result: rawText
              } as LogAutoAIFailure);
              return null;
            }

            // writeToLog<LogAutoAIFailure>(LOG_TYPE.AUTO_AI_FAILURE, {
            //   Title: "TRACE LLM response",
            //   Instruction: aiAutoDescNew.map(it => it.content).join(' '),
            //   Result: rawText
            // } as LogAutoAIFailure);

            arrObjects = jsonOutput;
          }
        }
      }
      else {
        setError('Automated generation did not return a result. Switch to manual use of AI or try again.');
        return null;
      }
    }
    setError('');
    return arrObjects;
  };

  const onFormSubmit = async function () {
    setLoadingMessage('Generating exercises...');
    setIsLoading(true);


    const arrData = await parseForm();

    //error is displayed when arrData is null
    if (arrData != null) {
      saveToLocalStorage();
      await handleSubmit(setError, createExercises, level, chapter, title, exerciseType, arrData);
    }
    setIsLoading(false);
  };

  const saveOnly = async function () {
    setLoadingMessage('Saving lesson...');
    setIsLoading(true);

    await handleSubmit(setError, null, level, chapter, title, exerciseType, null);

    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }

  const createExercises = async function (pathId: number, exerciseType: ExerciseType, arrData: any[]) {
    const created: number[] = [];
    for (const exer of arrData) {
      try {
        const responseEx = await api.post('/api/creator/exercise', {
          learningPathId: pathId,
          exerciseTypeId: exerciseType,
          data: JSON.stringify(exer)
        });
        if (responseEx.data && responseEx.data.exerciseId) {
          created.push(responseEx.data.exerciseId);
        }
      } catch (ex: any) {
        if (created.length > 0) {
          for (const exerId of created) {
            await api.delete(`/api/creator/exercise/${exerId}`);
          }
        }
        if (ex.response && ex.response.data) {
          throw new Error(ex.response.data, { cause: ex });
        }
        throw ex;
      }
    }
  };

  const deleteLesson = async function () {
    try {
      if (initialRecord == null) return;
      await api.delete(`/api/creator/learning-path/${initialRecord.learningPathId}`);
      router.replace('/');
    } catch (ex: unknown) {
      errorHandler(ex, setError);
    }
  };

  const handleExerciseTypeLogic = function (exrTypeValue: ExerciseType) {
    const exType = EXERCISE_TYPE_LOGIC[exrTypeValue].GenerationInfo;
    if (exType == null) return [];

    let aiMessages: IChatMessage[];
    const numOfExercises = user?.numOfExercisesToGenerate ?? DEFAULT_NUM_OF_EXERCISES;
    const targetLanguage = user?.languageSettings?.targetLanguageEnglishName || '';
    const knownLanguage = user?.languageSettings?.knownLanguage || '';
    let subject = title.trim();
    if (subject === '') {
      subject = 'any language exchange';
    }
    //manual ai instructions
    aiMessages = getAIInstructions(exType, targetLanguage, knownLanguage, numOfExercises, matches, extraOptions, false, subject);
    setAIInstructions(aiMessages.map(it => it.content).join(' '));
    //automatic ai instructions (returning json)
    aiMessages = getAIInstructions(exType, targetLanguage, knownLanguage, numOfExercises, matches, extraOptions, true, subject);

    return aiMessages;
  };

  const onChangeExerciseType = async (value: string | number) => {
    const exType = Number(value) as ExerciseType;
    setExerciseType(exType);
    handleExerciseTypeLogic(exType);
  };

  useEffect(() => {
    async function execAsync() {
      try {
        loadFromLocalStorage();
        if (initialRecord != null) {
          setLevel(initialRecord.level);
          setChapter(initialRecord.chapter);
          setTitle(initialRecord.name ?? "");
          setAccess(initialRecord.access);
        } else {
          let tempLevel = 1;
          if (initLevel !== '' && Number(initLevel) > 0) {
            tempLevel = Number(initLevel);
            setLevel(tempLevel);
          }
          let hintChapter = 0;
          if (initChapter !== '' && Number(initChapter) > 0) {
            hintChapter = Number(initChapter);
          }
          const res = await api.post<NextChapterResponse>('/api/creator/next-chapter', { Level: tempLevel, ChapterHint: hintChapter });
          setChapter(res.data.chapter);
        }
        setIsLoading(false);
        if (user?.disablePuter) {
          setUsePuterAI(false);
        }
        else {
          const tempPuterSignin = (await initializePuter() == true);
          setPuterSignedIn(tempPuterSignin);
          if (!tempPuterSignin) {
            //default to manual use of AI if could not sign in
            setUsePuterAI(false);
          }
        }

        titleRef.current?.focus();
      } catch (ex: unknown) {
        errorHandler(ex, setError);
      }
    }
    execAsync();
  }, [initialRecord, initLevel, initChapter, user]);

  useEffect(() => {
    const timeoutid = setTimeout(() => {
      if (exerciseType > 0) {
        handleExerciseTypeLogic(exerciseType as ExerciseType);
      }
    }, 500);
    // This cleans up the OLD timer before starting a NEW one (for key stroke changes in title)
    return () => clearTimeout(timeoutid);
  }, [exerciseType, title, matches, extraOptions]);

  return (
    <>
      {user?.role !== ROLE_TYPE.ADMIN && user?.role !== ROLE_TYPE.CONTENT_CREATOR && (
        <View className="form-row">
          <Text style={styles.text}>An email address confirmation request has been sent to &apos;{user?.userName}&apos;. Please confirm your email, so you&apos;ll be able to generate exercise content on this page and recover your account, in case you forget your password. </Text>
          <Text style={styles.text}>You can update your email address and resend the email confirmation request on the <Link href="/account">Manage account page</Link>.</Text>
        </View>
      ) || (
          <>
            {(error !== '') && (
              <View className="form-row">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {isLoading && (
              <View className="loadingOverlay">
                <Text testID="loadingBox" style={styles.text}>
                  {loadingMessage}
                </Text>
              </View>
            ) || (
                <>
                  <Text style={styles.label}>Level</Text>
                  <View className="form-row">
                    <View className="form-input-row">
                      <TextInput className="form-input" keyboardType='number-pad' testID="level" editable={access === AUTHOR_ACCESS.CAN_EDIT} value={level.toString()} onChangeText={(text: string) => { setLevel(Number(text)) }} />
                    </View>
                  </View>
                  <Text style={styles.label}>Chapter</Text>
                  <View className="form-row">
                    <View className="form-input-row">
                      <TextInput className="form-input" testID="chapter" keyboardType='numeric' editable={access === AUTHOR_ACCESS.CAN_EDIT} value={chapter.toString()} onChangeText={(text: string) => { setChapter(Number(text)) }} />
                    </View>
                  </View>
                  <Text style={styles.label}>Subject</Text>
                  <View className="form-row">
                    <View className="form-input-row">
                      <TextInput className="form-input form-input-long" testID="title" editable={access === AUTHOR_ACCESS.CAN_EDIT} value={title} onChangeText={setTitle} />
                    </View>
                    <Text style={styles.text}>AI will generate exercises on this subject.</Text>
                  </View>
                  <Text style={styles.label}>Exercise Type</Text>
                  <View className="form-row">
                    <View className="exercise-type-selector-container">
                      <FormDropDown
                        value={exerciseType}
                        setValue={setExerciseType}
                        items={exerciseTypes}
                        placeholder='-- Please choose an option --'
                        onChangeValue={(val) => onChangeExerciseType(val?.toString() ?? 0)}
                      />
                      <View className="exercise-type-difficulty">
                        <ExerciseTypeIcon exerciseTypeId={exerciseType} />
                      </View>
                    </View>
                    <Text style={styles.text}>{EXERCISE_TYPE_LOGIC[exerciseType].GenerationInfo?.description ?? ''}</Text>
                  </View>
                  {EXERCISE_TYPE_LOGIC[exerciseType].IsMatchingType && (
                    <>
                      <Text style={styles.label}>Number of Matches: {matches}</Text>
                      <Slider
                        minimumValue={MIN_MATCHES}
                        maximumValue={MAX_MATCHES}
                        step={1}
                        // Note: this library expects value to be an array or a number
                        value={matches}
                        // Note: onValueChange returns an array [number]
                        onValueChange={(value: number[]) => setMatches(Array.isArray(value) ? value[0] : value)}
                        minimumTrackTintColor="#1EB1FC"
                        maximumTrackTintColor="#D3D3D3"
                        thumbTintColor="#1EB1FC"
                      />
                    </>
                  )}
                  {EXERCISE_TYPE_LOGIC[exerciseType].HasExtraOptions && (
                    <>
                      <Text style={styles.label}>Wrong Extra Options: {extraOptions}</Text>
                      <Slider
                        minimumValue={BUCKET_LIST_EXTRA_OPTIONS.MIN_WORDS}
                        maximumValue={BUCKET_LIST_EXTRA_OPTIONS.MAX_WORDS}
                        step={1}
                        // Note: this library expects value to be an array or a number
                        value={extraOptions}
                        // Note: onValueChange returns an array [number]
                        onValueChange={(value: number[]) => setExtraOptions(Array.isArray(value) ? value[0] : value)}
                        minimumTrackTintColor="#1EB1FC"
                        maximumTrackTintColor="#D3D3D3"
                        thumbTintColor="#1EB1FC"
                      />
                    </>
                  )}
                  {!usePuterAI && (
                    <>
                      <Text style={styles.label}>AI instructions</Text>
                      <View className="form-row">
                        <Text style={styles.text}>{aiInstructions}</Text>
                      </View>
                      <Text style={styles.label}>First set of words/sentences</Text>
                      <View className="form-row">
                        <View className="form-input-row">
                          <TextInput multiline={true} numberOfLines={8}
                            testID="first-set" className="text-area-wide"
                            value={firstSet} onChangeText={setFirstSet} />
                        </View>
                        <Text style={styles.text}>{EXERCISE_TYPE_LOGIC[exerciseType].GenerationInfo?.first_data_instructions ?? ''}</Text>
                      </View>
                      <Text style={styles.label}>Second set of words/sentences</Text>
                      <View className="form-row">
                        <View className="form-input-row">
                          <TextInput testID="second-set" multiline={true} numberOfLines={8}
                            className="text-area-wide" value={secondSet} onChangeText={setSecondSet} />
                        </View>
                        <Text style={styles.text}>{EXERCISE_TYPE_LOGIC[exerciseType].GenerationInfo?.second_data_instructions ?? ''}</Text>
                      </View>
                      {EXERCISE_TYPE_LOGIC[exerciseType].HasExtraOptions && (
                        <>
                          <Text style={styles.label}>Wrong Extra Options</Text>
                          <View className="form-row">
                            <View className="form-input-row">
                              <TextInput testID="extra-options" multiline={true} numberOfLines={8}
                                className="text-area-wide"
                                value={wrongExtraOptions} onChangeText={setWrongExtraOptions} />
                            </View>
                            <Text style={styles.text}>{EXERCISE_TYPE_LOGIC[exerciseType].GenerationInfo?.extra_options_instructions ?? ''}</Text>
                          </View>
                        </>
                      )}
                    </>)}
                </>
              )
            }
            <View className="buttons-container">
              <ActionsMenuComponent anchorTitle="More" items={[
                {
                  isVisible: usePuterAI,
                  dataTestId: "switch-ai-use",
                  disabled: isLoading || user?.disablePuter,
                  itemText: "Switch to Manual Entry",
                  leadingIcon: <UserPen className="color-brand-primary" />,
                  onClick: () => { setUsePuterAI(!usePuterAI) }
                },
                {
                  isVisible: !usePuterAI,
                  dataTestId: "switch-ai-use",
                  disabled: isLoading || user?.disablePuter,
                  itemText: "Switch to AI Generation",
                  leadingIcon: <Workflow className="color-brand-primary" />,
                  onClick: () => { setUsePuterAI(!usePuterAI) }
                },
                {
                  dataTestId: "cancel-readding",
                  itemText: "Stop readding my mistakes",
                  onClick: cancelMistakesAdd,
                  leadingIcon: <Ban className="color-brand-primary" />,
                  isVisible: initialRecord != null && practiseMistakesInThisPath,
                },
                {
                  dataTestId: "readd-mistakes",
                  itemText: "Readd my mistakes here",
                  onClick: readdMistakes,
                  leadingIcon: <History className="color-brand-primary" />,
                  isVisible: initialRecord != null && !practiseMistakesInThisPath,
                },
                {
                  isVisible: initialRecord != null && initialRecord.access === AUTHOR_ACCESS.CAN_EDIT 
                    && initialRecord.exerciseCount === 0,
                  dataTestId: "delete-lesson",
                  disabled: isLoading,
                  onClick: deleteLesson,
                  itemText: "Delete Lesson",
                  leadingIcon: <Trash className="color-brand-primary" />
                },
                {
                  isVisible: initialRecord != null && !isLoading,
                  dataTestId: "back-to-lesson",
                  itemText: "Back to Lesson",
                  leadingIcon: <BookOpenCheck className="color-brand-primary" />,
                  toPath: `/path/${initialRecord?.learningPathId}`
                }
              ] as ActionsMenuItem[]} />
              {initialRecord && initialRecord.access === AUTHOR_ACCESS.CAN_EDIT && usePuterAI && (
                <View className="form-button-cell">
                  <TouchableOpacity testID="save-only" className="top-button" onPress={saveOnly}>
                    <Save /><Text style={styles.text}> Save</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View className="form-button-cell">
                <TouchableOpacity testID="save"
                  disabled={isLoading} className="top-button" onPress={onFormSubmit}><LayersPlus />
                  <Text style={styles.text}> {usePuterAI ? "Generate" : "Save & Generate"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
    </>
  );
}
