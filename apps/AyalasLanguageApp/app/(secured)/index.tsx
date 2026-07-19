import { useEffect, useState, Fragment, useRef } from "react";
import { findNodeHandle, ScrollView, Text, View, Platform } from "react-native";
import { Link } from 'expo-router';

import { LayersPlus, Check, CircleDotDashed, History } from 'lucide-react-native';
import dayjs from 'dayjs';

import type { ExerciseType } from '@ayalaslanguage/types/exercise';
import { errorHandler } from '@ayalaslanguage/types/error';
import { EXERCISE_TYPE_LOGIC } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { type ILearningPath, DEFAULT_NUM_OF_EXERCISES, LEANRING_STATUS } from "@ayalaslanguage/types/sharedfrontlib/learning";

import { ExerciseTypeGroupTitle } from '@/components/home/ExerciseTypeGroupTitle';

import api from '@/lib/api'; //secured axios instance
import { useAuth } from "@/lib/AuthContext";
import SecuredHeader, { LANGUAGE_INDICATOR_ENUM } from "@/components/SecuredHeader";
import useTextStyles from '@/lib/useTextStyles';

type ExerciseTypeGroupObject = {
  exerciseTypeId: 0 | ExerciseType,
  paths: ILearningPath[];
};

type LevelGroupObject = {
  level: number;
  exerciseTypes: ExerciseTypeGroupObject[]
}

export default function HomeScreen() {
  const [learningPath, setLearningPath] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [latestLesson, setLatestLesson] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLanguage, setHasLanguage] = useState(false);
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const latestLessonRef = useRef<View>(null);
  const { styles } = useTextStyles();
  const [targetY, setTargetY] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async function () {
      try {
        setIsLoading(true);
        setTargetY(null);
        if (user?.languageSettings?.targetLanguageId != null && user.languageSettings.knownLanguageId != null) {
          setHasLanguage(true);
        } else {
          return;
        }
        const response = await api.get<ILearningPath[]>('/api/learning/path');

        if (response.data != null) {
          const learningPaths = response.data;

          let lastModifiedLessonId: number = 0;
          let lastModifiedLessonDate: dayjs.Dayjs | null = null;

          //group by level and then by exerciseTypeId (which can be null for empty lessons)
          const transformedArray = Object.values(
            learningPaths.reduce((acc: any, current: ILearningPath) => {
              //if we don't have the level - create it
              if (!acc[current.level]) {
                acc[current.level] = {
                  level: current.level,
                  exerciseTypes: []
                } as LevelGroupObject;
              }

              const exerciseTypeId: number = current.exerciseTypeId ?? 0;
              //if we don't have the exercise type id inside the level - create it
              if (!acc[current.level].exerciseTypes[exerciseTypeId]) {
                acc[current.level].exerciseTypes[exerciseTypeId] =
                  {
                    exerciseTypeId: exerciseTypeId,
                    paths: []
                  } as ExerciseTypeGroupObject;
              }
              //find latest modified lesson logic
              if (current.lastModified != null) {
                //save the first modified element's details
                if (lastModifiedLessonDate == null) {
                  lastModifiedLessonId = current.learningPathId;
                  lastModifiedLessonDate = dayjs(current.lastModified);
                }
                //compare and save latest element
                else if (dayjs(current.lastModified).isAfter(lastModifiedLessonDate)) {
                  lastModifiedLessonId = current.learningPathId;
                  lastModifiedLessonDate = dayjs(current.lastModified);
                }
              }
              //add the lesson inside the exercise type paths array
              acc[current.level].exerciseTypes[exerciseTypeId].paths.push(current);
              return acc;
            }, {})
          );

          if (lastModifiedLessonId > 0) {
            setLatestLesson(lastModifiedLessonId);
          }

          setLearningPath(transformedArray);
        }

      } catch (err: unknown) {
        errorHandler(err, setError);
      }
      finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.languageSettings?.targetLanguageId, user?.userId]);

  useEffect(() => {
  if (!isLoading && targetY !== null && scrollViewRef.current) {
    scrollViewRef.current.scrollTo({
      y: targetY - 100, // Adjust offset as needed
      animated: true,
    });
  }
}, [isLoading, targetY]);

  return (
      <View className="root">
        <SecuredHeader languageIndicator={LANGUAGE_INDICATOR_ENUM.SWITCH} />
        {error !== '' && (
          <View className="form-row">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {isLoading && (
          <Text style={styles.dimmedText}>
            Loading...
          </Text>
        ) || ((learningPath && learningPath.length > 0) && (
          <ScrollView className="learning-container" showsVerticalScrollIndicator={false} ref={scrollViewRef}> 
            {learningPath.map((level) => {
              return (
                <View className="learning-level-container" key={`level-${level.level}`}>
                  <Text style={styles.h1}>Level {level.level}</Text>
                  {level.exerciseTypes.sort(
                    (a: ExerciseTypeGroupObject, b: ExerciseTypeGroupObject) => EXERCISE_TYPE_LOGIC[a.exerciseTypeId].SortByEaseRank - EXERCISE_TYPE_LOGIC[b.exerciseTypeId].SortByEaseRank
                  ).map((exerciseTypeObject: ExerciseTypeGroupObject) => {
                    let lastPathObj = { level: level.level, chapter: 1 }
                    if (exerciseTypeObject.paths.length > 0) {
                      lastPathObj.chapter = exerciseTypeObject.paths[exerciseTypeObject.paths.length - 1].chapter;
                    }
                    return (
                      <Fragment key={`level-${level.level}-type-${exerciseTypeObject.exerciseTypeId}`}>
                        <View className="learning-exercise-type-outer-container">

                          <View className="learning-exercise-type-inner-container">
                            <ExerciseTypeGroupTitle exerciseTypeId={exerciseTypeObject.exerciseTypeId} />
                            <View className="learning-exercise-type-inner-body">
                              {exerciseTypeObject.paths.map((path: any) => {
                                const isDone = path.status === LEANRING_STATUS.DONE;
                                const isInProgress = path.status === LEANRING_STATUS.IN_PROGRESS;
                                return (
                                  <View className="learning-lesson" key={path.learningPathId}
                                    ref={path.learningPathId === latestLesson ? latestLessonRef : null}
                                    onLayout={path.learningPathId === latestLesson? (event) => {
                                      const layout = event.nativeEvent.layout;
                                      setTargetY(layout.y);
                                  }: () => {}}
                                  >
                                    <Link className={`learning-lesson-link${isDone ? ' lesson-done' : ''}`} href={exerciseTypeObject.exerciseTypeId == 0 ? `/author/path/${path.learningPathId}` : `/path/${path.learningPathId}`}>{path.name}</Link>
                                    {isDone && (
                                      <Check />
                                    )}
                                    {isInProgress && (
                                      <CircleDotDashed className="color-brand-dashed" />
                                    )}
                                    {path.practiseMistakesInThisPath && (
                                      <History />
                                    )}
                                    <View className="content-line-part"><Text style={styles.dimmedText}>{path.exerciseCount > DEFAULT_NUM_OF_EXERCISES ? `[${path.exerciseCount}]` : ""}</Text></View>
                                  </View>
                                );
                              })}
                              <View className="learning-level-creator">
                                <Link href={`/author/create?level=${lastPathObj.level}&chapter=${lastPathObj.chapter}`}><LayersPlus className="color-brand-layers" /></Link>
                              </View>
                            </View>
                          </View>
                        </View>
                      </Fragment>
                    );
                  })}


                </View>
              );
            })}
          </ScrollView>
        ) || (hasLanguage && (
          <Text style={styles.text}>
            It looks like there are not yet any lessons in this language.{"\n"}
            But you can <Link href="/author/create">add ones yourself!</Link>
          </Text>
        )) || (
            <Text style={styles.text}>
              You have not selected which language to learn.{"\n"}
              Go to <Link style={[styles.dimmedText, styles.underline]} href="/profile">the profile page</Link> to choose one!
            </Text>
          ))}
      </View>
  );
}
