import { useEffect, useState, Fragment } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { LayersPlus, Check, CircleDotDashed, History } from 'lucide-react';

import { AuthHeader, LANGUAGE_INDICATOR_ENUM } from '../components/auth/AuthHeader';
import { DEFAULT_NUM_OF_EXERCISES, LEANRING_STATUS } from '../constants/learning';
import type { User } from '../types/User';
import { errorHandler } from '@ayalaslanguage/types/error';
import { ExerciseTypeGroupTitle } from '../components/ExerciseTypeGroupTitle';
import type { ExerciseType } from '@ayalaslanguage/types/exercise';
import { rankExerciseTypeByEase } from '../logic/ExerciseTypeLogic';

type ExerciseTypeGroupObject = {
  exerciseTypeId: 0 | ExerciseType,
  paths: any[];
};

export default function Homepage() {
  const [learningPath, setLearningPath] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasLanguage, setHasLanguage] = useState(false);
  const { user } = useOutletContext<{ user: User | null }>();
  useEffect(() => {
    const loadData = async function () {
      try {
        if (user?.languageSettings?.targetLanguageId != null && user.languageSettings.knownLanguageId != null) {
          setHasLanguage(true);
        } else {
          return;
        }
        const response = await axios.get('/api/learning/path');

        if (response.data != null) {
          const learningPaths = response.data;

          //group by level and then by exerciseTypeId (which can be null for empty lessons)
          const transformedArray = Object.values(
            learningPaths.reduce((acc: any, current: any) => {
              //if we don't have the level - create it
              if (!acc[current.level]) {
                acc[current.level] = {
                  level: current.level,
                  exerciseTypes: []
                };
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
              //add the lesson inside the exercise type paths array
              acc[current.level].exerciseTypes[exerciseTypeId].paths.push(current);
              return acc;
            }, {})
          );

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
  }, [user]);
  return (
    <>
      <AuthHeader languageIndicator={LANGUAGE_INDICATOR_ENUM.SWITCH} />
      <div className="home-container">
        {error !== '' && (
          <div className="form-row">
            <label className="form-error">{error}</label>
          </div>
        )}
        {isLoading && (
            <div className="learning=path-empty">
                Loading...
            </div>
        ) || ((learningPath && learningPath.length > 0) && (
          <div className="learning-container">
            {learningPath.map((level) => {
              return (
                <div className="learning-level-container" key={`level-${level.level}`}>
                  <h4>Level {level.level}</h4>
                  {level.exerciseTypes.sort(
                      (a:ExerciseTypeGroupObject, b:ExerciseTypeGroupObject) =>  rankExerciseTypeByEase(a.exerciseTypeId) - rankExerciseTypeByEase(b.exerciseTypeId)  
                    ).map((exerciseTypeObject: ExerciseTypeGroupObject) => {
                    let lastPathObj = { level: level.level, chapter: 1 }
                    if (exerciseTypeObject.paths.length > 0) {
                      lastPathObj.chapter = exerciseTypeObject.paths[exerciseTypeObject.paths.length - 1].chapter;
                    }
                    return (
                      <Fragment key={`level-${level.level}-type-${exerciseTypeObject.exerciseTypeId}`}>
                        <div className="learning-exercise-type-outer-container">

                          <div className="learning-exercise-type-inner-container">
                            <ExerciseTypeGroupTitle exerciseTypeId={exerciseTypeObject.exerciseTypeId} />
                            <div className="learning-exercise-type-inner-body">
                              {exerciseTypeObject.paths.map((path: any) => {
                                const isDone = path.status == LEANRING_STATUS.DONE;
                                const isInProgress = path.status == LEANRING_STATUS.IN_PROGRESS;
                                return (
                                  <div className="learning-lesson" key={path.learningPathId}>
                                    <Link className={`learning-lesson-link${isDone ? ' lesson-done' : ''}`} to={exerciseTypeObject.exerciseTypeId == 0? `/author/path/${path.learningPathId}` : `/path/${path.learningPathId}`}>{path.name}</Link>
                                    {isDone && (
                                      <span title="Done"><Check className="learning-progress-img" /></span>
                                    )}
                                    {isInProgress && (
                                      <span title="In progress"><CircleDotDashed className="learning-progress-img" /></span>
                                    )}
                                    {path.practiseMistakesInThisPath && (
                                      <span title="Mistakes will be readded to this lesson"><History className="learning-progress-img" /></span>
                                    )}
                                    <div className="content-line-part" title={`${path.exerciseCount} exercises`}>{path.exerciseCount > DEFAULT_NUM_OF_EXERCISES? `[${path.exerciseCount}]` : ""}</div>
                                  </div>
                                );
                              })}
                              <div className="learning-level-creator">
                                <Link to={`/author/path?level=${lastPathObj.level}&chapter=${lastPathObj.chapter}`} title="Generate more exercises here"><LayersPlus /></Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}


                </div>
              );
            })}
          </div>
        ) || (hasLanguage && (
          <div className="learning-path-empty">
            It looks like there are not yet any lessons in this language.<br />
            But you can <Link to="/author/path">add ones yourself!</Link>
          </div>
        )) || (
            <div className="learning-path-empty">
              You have not selected which language to learn.<br />
              Go to <Link to="/profile">the profile page</Link> to choose one!
            </div>
          ))}
      </div>
    </>
  );
}
