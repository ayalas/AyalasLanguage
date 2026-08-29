import { View, Text, ScrollView, Pressable, Platform, Alert } from 'react-native'
import { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams, Link, useRouter } from 'expo-router';
import api from '@/lib/api';
import { FilePenLine } from 'lucide-react-native';

import { getMissingParts, replaceCharsForLanguage, setLanguageSettings, splitAndKeep } from '@ayalaslanguage/types/sharedfrontlib/utils';
import Exercise, { type ExerciseHandle } from '@/components/learning/Exercise';
import { errorHandler } from '@ayalaslanguage/types/error';
import { EXERCISE_TYPE_LOGIC, safeParseData } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { PagedExercisesRequest, PagedExercisesResponse, PLACEHOLDERS, type ExerciseInfo, type ExtendedExerciseInfo, type LearningPathInfo } from '@ayalaslanguage/types/sharedfrontlib/learning';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { useAuth } from '@/lib/AuthContext';
import { FormHeader } from '@/components/FormHeader';
import useTextStyles from '@/lib/useTextStyles';
import { PAGE_SIZE } from '@/constants';

export default function LessonScreen() {
  const { id: learningPathId } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isChildMounted, setIsChildMounted] = useState(false);
  const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
  const [scoreToAdd, setScoreToAdd] = useState(0);
  const [learningPathData, setLearningPathData] = useState<LearningPathInfo | null>(null);
  const [currentExercise, setCurrentExercise] = useState<ExtendedExerciseInfo | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [numOfRecords, setNumOfRecords] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [practiseMistakesInThisPath, setPractiseMistakesInThisPath] = useState(false);
  const [error, setError] = useState('');
  const exerciseRefs = useRef<Map<number, ExerciseHandle | undefined>>(new Map());
  const { user, login } = useAuth();
  const { styles } = useTextStyles();

  const changeCurrentExercise = function (arrExercises: ExerciseInfo[], index: number) {
    setIsChildMounted(false);
    const curItem = arrExercises[index];

    // Defensive: ensure curItem and curItem.data are present
    const raw = curItem?.data;
    const dataObj = safeParseData(raw);
    if (dataObj == null) return;

    const targetLang = user?.languageSettings?.targetLanguage || '';
    const firstData = replaceCharsForLanguage(targetLang, dataObj?.First || '') || '';
    const secondData = replaceCharsForLanguage(targetLang, dataObj?.Second || '') || '';

    if (EXERCISE_TYPE_LOGIC[curItem.exerciseTypeId].UsesInlineExerciseWithBlanks) {
      const sentenceElements = splitAndKeep((firstData || ''), PLACEHOLDERS.BLANKS).map((s) => s.trim()).filter(s => s !== '');
      const tempElements = (firstData || '').split(PLACEHOLDERS.BLANKS).map((s) => s.trim()).filter(s => s !== '');
      let answersTemp = getMissingParts(secondData || '', tempElements);
      //flat the result of getMissingParts - it return answers of more than one word as one element
      //but the inline exercise needs each word to have its own input
      answersTemp = answersTemp.flatMap(item => item.split(' ').map((s) => s.trim()).filter(s => s !== ''));
      let iAnswers = 0;
      const answers = sentenceElements.map((s) => {
        if (s == PLACEHOLDERS.BLANKS) {
          iAnswers++;
          return answersTemp[iAnswers - 1];
        }
        else {
          return PLACEHOLDERS.BLANKS;
        }
      });
      setCurrentExercise({
        ...curItem,
        exerciseObject: dataObj,
        sentenceElements,
        answers,
        index
      });
    } else if (EXERCISE_TYPE_LOGIC[curItem.exerciseTypeId].HasExtraOptions) {
      const separator = EXERCISE_TYPE_LOGIC[curItem.exerciseTypeId].ExtraOptionsSeparator;
      let tempAnswers: string[];
      const secondAsStr = (secondData || '').trim();
      if (EXERCISE_TYPE_LOGIC[curItem.exerciseTypeId].HasSingleBucketAnswer) {
        tempAnswers = [secondAsStr];
      }
      else {
        tempAnswers = secondAsStr.split(separator);
      }
      setCurrentExercise({
        ...curItem,
        exerciseObject: dataObj,
        sentenceElements: [firstData],
        answers: tempAnswers,
        extraItems: (replaceCharsForLanguage(targetLang, dataObj.ExtraOptions || '') || '').trim().split(separator),
        index
      });
    } else if (EXERCISE_TYPE_LOGIC[curItem.exerciseTypeId].IsMatchingType) {
      const sentenceElements = (firstData || '').split(',');
      let answers = (secondData || '').split(',');
      if (answers.length < sentenceElements.length) {
        const tmpAnswers = (secondData || '').split(' ');
        if (tmpAnswers.length === sentenceElements.length) {
          answers = tmpAnswers;
        }
      }

      setCurrentExercise({
        ...curItem,
        exerciseObject: dataObj,
        sentenceElements,
        answers,
        index
      });
    }
    else { //all other types
      setCurrentExercise({
        ...curItem,
        exerciseObject: dataObj,
        sentenceElements: [firstData],
        answers: [secondData],
        index
      });
    }
  };

  const childLoaded = function (exerciseId: number) {
    setIsChildMounted(true);
  };

  const addMistake = async function (exerciseId: number) {
    try {
      await api.post('/api/learning/mistake', { exerciseId });
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  const setRef = (el: unknown) => {
    // el is expected to be the ExerciseHandle forwarded by the child. Associate it with the current exercise id.
    const handle = el as ExerciseHandle | null | undefined;
    if (currentExercise) {
      exerciseRefs.current.set(currentExercise.exerciseId, handle ?? undefined);
    }
  };

  const setScore = async function (newScore: number) {
    //add profile score
    const res = await api.post('/api/profile/score', { scoreToAdd: newScore });
    setScoreToAdd(0);
    setLanguageSettings(res.data, user as User, login);
  };

  const loadExercises = async function (newPage: number, forceRefresh: boolean, startExerciseId?: number) {
    try {
      const res = await api.post<PagedExercisesResponse>(`/api/learning/path/${learningPathId}/paged`,
        {
          startExerciseId,
          page: newPage - 1,
          refreshCount: (newPage == totalPages) || forceRefresh
        } as PagedExercisesRequest
      );
      const pagedResponse = res.data;
      if (pagedResponse) {
        if (pagedResponse.numOfRecords > 0) {
          let numOfPages = Math.trunc(pagedResponse.numOfRecords / PAGE_SIZE);
          if (pagedResponse.numOfRecords % PAGE_SIZE > 0)
            numOfPages++;
          setTotalPages(numOfPages);
          setNumOfRecords(pagedResponse.numOfRecords);
        }

        setPage(pagedResponse.page + 1);

        if (pagedResponse.data && pagedResponse.data.length > 0) {
          setHasData(true);
          setHasMoreData(pagedResponse.data.length > PAGE_SIZE);
          const exercisesTemp = pagedResponse.data.slice(0, PAGE_SIZE);

          setExercises(exercisesTemp);
          return exercisesTemp;
        }
        else {
          setHasData(false);
        }
      }
    } catch (err: unknown) {
      errorHandler(err, setError);
    }

    return [];
  }

  const moveNext = async function () {
    if (!currentExercise) return;

    const newScore = scoreToAdd + 1;
    setScoreToAdd(newScore);

    if ((currentExercise.index ?? 0) === exercises.length - 1) {
      let targetPage = page;
      let changedPage = false;
      if (exercises.length == PAGE_SIZE || hasMoreData) {
        //stay on page and see if there are new exercises
        targetPage = page + 1;
        changedPage = true;
      }

      const tempExercises = await loadExercises(targetPage, !hasMoreData || page + 1 >= totalPages);
      if (tempExercises && tempExercises.length > 0 && changedPage) {
          changeCurrentExercise(tempExercises, 0);
          return;
      }
      else if ((currentExercise.index ?? 0) < tempExercises.length - 1) {
        changeCurrentExercise(tempExercises, (currentExercise.index ?? 0) + 1);
        return;
      }
    }

    if ((currentExercise.index ?? 0) < exercises.length - 1) {
      changeCurrentExercise(exercises, (currentExercise.index ?? 0) + 1);
    } else {
      try {
        await setScore(newScore);
        //set path as done
        await api.post('/api/learning/progress', { learningPathId });
        router.replace('/');
      } catch (err: unknown) {
        errorHandler(err, setError);
      }
    }
  };

  const movePrev = async function () {
    if (currentExercise == null) return;
    if ((currentExercise.index ?? 0) > 0) {
      changeCurrentExercise(exercises, (currentExercise.index ?? 0) - 1);
    }
    else if (page > 1) {
      const tempExercises = await loadExercises(page - 1, false);
      if (tempExercises.length > 0) {
        changeCurrentExercise(tempExercises, tempExercises.length - 1);
        return;
      }
    }
  }

  const saveProgress = async function (routeToHome = true) {
    try {
      if (!currentExercise) return;

      const exCurInd = exercises.findIndex((e) => e.exerciseId == currentExercise.exerciseId);
      let exerId = null as number | null;
      if (practiseMistakesInThisPath || page > 1) {
        exerId = currentExercise.exerciseId;
      }
      else if (exCurInd > 0) {
        exerId = currentExercise.exerciseId;
      }
      
      if (scoreToAdd > 0) {
        await setScore(scoreToAdd);
      }

      function Finalize() {
        if (routeToHome) {
          router.replace('/');
        }
      }

      if (exerId == null) {

        if (!routeToHome) {
          return;
        }

        const title = "Save progress to start of this lesson?";
        const message = "This will delete your progress on this lesson.";

        async function onConfirmed() {
          await api.delete(`/api/learning/progress/${learningPathId}`);

          Finalize();
        }

        if (Platform.OS === 'web') {
          // browser window.confirm returns true for "OK" and false for "Cancel"
          const result = window.confirm(`${title}\n\n${message}`);
          if (result) {
            onConfirmed();
          }
          else {
            Finalize();
          }
        } else {
          return Alert.alert(
            title,
            message,
            [
              {
                text: "No, continue without saving progress",
                style: "cancel",
                onPress: Finalize
              },
              {
                text: "Yes, delete my progress",
                onPress: onConfirmed,
                style: "destructive"
              },
            ]
          );
        }

      } else {
        await api.post('/api/learning/progress', { 
          learningPathId, 
          exerciseId: exerId,
          practiseMistakesInThisPath
        });

        Finalize();
      }

    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  const restartLesson = async function () {
    changeCurrentExercise(exercises, 0);
  };

  useEffect(() => {
    async function getData() {
      try {
        setIsMounted(false);
        const response = await api.get<LearningPathInfo>(`/api/learning/path/${learningPathId}`);
        const learningPathTemp = response.data;
        setLearningPathData(learningPathTemp);
        setPractiseMistakesInThisPath(learningPathTemp.practiseMistakesInThisPath);
        const exercisesTemp = await loadExercises(page, true, learningPathTemp.exerciseId);

        if (exercisesTemp && exercisesTemp.length > 0) {

          setExercises(exercisesTemp);
          let exCurInd = 0;
          if (learningPathTemp.exerciseId != null) {
            exCurInd = exercisesTemp.findIndex((e) => e.exerciseId == learningPathTemp.exerciseId);
            if (exCurInd < 0) {
              exCurInd = 0;
            }
          }
          changeCurrentExercise(exercisesTemp, exCurInd);

          setIsMounted(true);
        }
      } catch (err: unknown) {
        errorHandler(err, setError);
      }
    }
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningPathId]);

  //set focus when everything is mounted
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentExercise != null && isMounted && isChildMounted) {
        if (EXERCISE_TYPE_LOGIC[currentExercise.exerciseTypeId].FocusOnLoad) {
          const refItem = exerciseRefs.current.get(currentExercise.exerciseId);
          refItem?.setFocus();
        }
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [isMounted, isChildMounted, currentExercise, currentExercise?.exerciseId])

  return (
    <View className="lesson-outer-container" style={{ paddingHorizontal: 5, paddingTop: Platform.OS === 'web' ? 5: 26, paddingBottom: 24 }}>
      <ScrollView className="lesson-inner-container" showsVerticalScrollIndicator={false}>

        {error !== '' && (
          <View className="form-row">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {learningPathData && (
          <>
            <FormHeader titleSize='sm' OnPress={() => { saveProgress(true) }} title={`Level ${learningPathData.level}, ${learningPathData.chapter}: ${learningPathData.name}`} />
            {!currentExercise && (
              <View className="form-row">
                <View className="form-button-cell">
                  <Pressable onPress={() => router.replace(`/author/path/${learningPathId}`)}><FilePenLine /></Pressable>
                </View>
              </View>
            )}
          </>
        )}
        {currentExercise && hasData && (
          <>
            <View className="form-row">
              <Text style={styles.text}>{`Exercise ${((page - 1) * PAGE_SIZE) + (currentExercise.index ?? 0) + 1} of ${numOfRecords}`}</Text>
            </View>

            <Exercise key={currentExercise.exerciseId}
              ref={setRef}
              exerciseInfo={currentExercise}
              moveNext={moveNext}
              movePrev={movePrev}
              childLoaded={childLoaded}
              saveProgress={saveProgress}
              restartLesson={restartLesson}
              practiseMistakesInitialValue={practiseMistakesInThisPath}
              onPractiseMistakesChange={setPractiseMistakesInThisPath}
              addMistake={addMistake} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
