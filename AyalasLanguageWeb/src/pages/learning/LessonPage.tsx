import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FilePenLine } from 'lucide-react';

import { AuthHeader } from '../../components/auth/AuthHeader';
import { EXERCISE_TYPES, PLACEHOLDERS } from '../../constants/learning';
import { getMissingParts, replaceCharsForLanguage, setLanguageSettings } from '../../utils/languageUtils';
import { Exercise } from './exercise/Exercise';
import type { User } from '../../types/shared/User';
import type { ExerciseInfo } from '../../types/exercise/Exercise';
import type { ExerciseHandle } from '../../types/ui/ComponentHandles';

type LocalExercise = ExerciseInfo & { data: string | ParsedExercise; exerciseObject?: ParsedExercise; index?: number };
type ParsedExercise = { First?: string; Second?: string; ExtraOptions?: string };

function extractErrorMessage(err: unknown) {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message?: string }).message || String(err);
  }
  return String(err);
}

export function LessonPage() {
  const { learningPathId } = useParams();
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [scoreToAdd, setScoreToAdd] = useState(0);
  const [learningPathData, setLearningPathData] = useState<Record<string, unknown> | null>(null);
  const [currentExercise, setCurrentExercise] = useState<LocalExercise | null>(null);
  const [practiseMistakesInThisPath, setPractiseMistakesInThisPath] = useState(false);
  const [error, setError] = useState('');
  const exerciseRefs = useRef<Map<number, ExerciseHandle | undefined>>(new Map());
  const navigate = useNavigate();
  const { user, login } = useOutletContext<{ user: User | null; login: (u: User) => void }>();

  const changeCurrentExercise = function (arrExercises: LocalExercise[], index: number) {
    const curItem = arrExercises[index] as LocalExercise;

    // Defensive: ensure curItem and curItem.data are present
    const raw = curItem?.data;
    const rawString = typeof raw === 'string' ? raw : JSON.stringify(raw || {});
    let dataObj: ParsedExercise;
    try {
      dataObj = JSON.parse(rawString) as ParsedExercise;
    } catch {
      dataObj = { First: rawString };
    }

    const targetLang = user?.languageSettings?.targetLanguage || '';
    const firstData = replaceCharsForLanguage(targetLang, dataObj.First || '') || '';
    const secondData = replaceCharsForLanguage(targetLang, dataObj.Second || '') || '';

    if (curItem.exerciseTypeId == EXERCISE_TYPES.FILL_IN_THE_BLANKS) {
      const sentenceElements = (firstData || '').split(PLACEHOLDERS.BLANKS).map((s) => s.trim());
      const answers = getMissingParts(secondData || '', sentenceElements);
      setCurrentExercise({
        ...curItem,
        exerciseObject: dataObj,
        sentenceElements,
        answers,
        index
      });
    } else if (curItem.exerciseTypeId == EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET) {
      setCurrentExercise({
        ...curItem,
        exerciseObject: dataObj,
        sentenceElements: [firstData],
        answers: (secondData || '').trim().split(' '),
        extraItems: (replaceCharsForLanguage(targetLang, dataObj.ExtraOptions || '') || '').trim().split(' '),
        index
      });
    } else if (curItem.exerciseTypeId != EXERCISE_TYPES.MATCHING) {
      setCurrentExercise({
        ...curItem,
        data: dataObj,
        sentenceElements: [firstData],
        answers: [secondData],
        index
      });
    } else {
      const sentenceElements = (firstData || '').split(',');
      const answers = (secondData || '').split(',');

      setCurrentExercise({
        ...curItem,
        data: dataObj,
        exerciseObject: dataObj,
        sentenceElements,
        answers,
        index
      });
    }

    if (curItem.exerciseTypeId != EXERCISE_TYPES.MATCHING && curItem.exerciseTypeId != EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET) {
      const refItem = exerciseRefs.current.get(curItem.exerciseId);
      refItem?.setFocus();
    }
  };

  const childLoaded = function (exerciseId: number) {
    if (exerciseId == currentExercise?.exerciseId) {
      if (currentExercise.exerciseTypeId != EXERCISE_TYPES.MATCHING && currentExercise.exerciseTypeId != EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET) {
        const refItem = exerciseRefs.current.get(currentExercise.exerciseId);
        refItem?.setFocus();
      }
    }
  };

  const changeMistakesSetting = async function (readd: boolean) {
    try {
      if (!currentExercise) return;
      await axios.post('/api/learning/progress', {
        learningPathId: learningPathId,
        exerciseId: currentExercise.exerciseId,
        practiseMistakesInThisPath: readd
      });

      setPractiseMistakesInThisPath(readd);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    }
  };

  const addMistake = async function (exerciseId: number) {
    try {
      await axios.post('/api/learning/mistake', { exerciseId });
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
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
    const res = await axios.post('/api/profile/score', { scoreToAdd: newScore });
    setScoreToAdd(0);
    setLanguageSettings(res.data, user, login);
  };

  const moveNext = async function () {
    if (!currentExercise) return;

    const newScore = scoreToAdd + 1;

    if ((currentExercise.index ?? 0) < exercises.length - 1) {
      setScoreToAdd(newScore);
      changeCurrentExercise(exercises, (currentExercise.index ?? 0) + 1);
    } else {
      try {
        await setScore(newScore);
        //set path as done
        await axios.post('/api/learning/progress', { learningPathId });
        navigate('/home');
      } catch (err: unknown) {
        setError(extractErrorMessage(err));
      }
    }
  };

  const saveProgress = async function () {
    try {
      if (!currentExercise) return;

      const exCurInd = exercises.findIndex((e) => e.exerciseId == currentExercise.exerciseId);
      let exerId = null as number | null;
      if (exCurInd > 0) {
        exerId = currentExercise.exerciseId;
      }
      if (scoreToAdd > 0) {
        await setScore(scoreToAdd);
      }

      if (exerId == null) {
        await axios.delete(`/api/learning/progress/${learningPathId}`);
      } else {
        await axios.post('/api/learning/progress', { learningPathId, exerciseId: exerId });
      }

      navigate('/home');
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    }
  };

  const restartLesson = async function () {
    changeCurrentExercise(exercises, 0);
  };

  useEffect(() => {
    async function getData() {
      try {
        const response = await axios.get(`/api/learning/path/${learningPathId}`);
        const learningPathTemp = response.data;
        setLearningPathData(learningPathTemp);
        setPractiseMistakesInThisPath(learningPathTemp.practiseMistakesInThisPath);
        const res = await axios.get(`/api/learning/path/${learningPathId}/exercises`);

        if (res && res.data && res.data.length > 0) {
          // Normalize exercise.data so downstream code can assume a string that may contain JSON
          const exercisesTemp: LocalExercise[] = (res.data as ExerciseInfo[]).map((e) => ({
            ...e,
            data: typeof e.data === 'string' ? e.data : JSON.stringify(e.data)
          }));
          setExercises(exercisesTemp);
          let exCurInd = 0;
          if (learningPathTemp.exerciseId != null) {
            exCurInd = exercisesTemp.findIndex((e) => e.exerciseId == learningPathTemp.exerciseId);
            if (exCurInd < 0) {
              exCurInd = 0;
            }
          }
          changeCurrentExercise(exercisesTemp, exCurInd);
        }
      } catch (err: unknown) {
        setError(extractErrorMessage(err));
      }
    }
    getData();
    // changeCurrentExercise is stable in this file and intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningPathId]);

  return (
    <>
      <AuthHeader />
      <div className="form-container">
        {error !== '' && (
          <div className="form-row">
            <label className="form-error">{error}</label>
          </div>
        )}
        <form>
          {learningPathData && (
            <>
              <div className="form-header">
                <h1>{`Level ${learningPathData.level}, ${learningPathData.chapter}: ${learningPathData.name}`}</h1>
              </div>
              {!currentExercise && (
                <div className="form-row">
                  <div className="form-button-cell">
                    <Link to={`/author/path/${learningPathId}`} className="link-button" title="Edit lesson"><FilePenLine /></Link>
                  </div>
                </div>
              )}
            </>
          )}
          {currentExercise && (
            <>
              <div className="form-row">
                <label className="form-label-row">{`Exercise ${(currentExercise.index ?? 0) + 1} of ${learningPathData?.exerciseCount}`}</label>
              </div>

              <Exercise key={currentExercise.exerciseId}
                ref={setRef}
                exerciseInfo={currentExercise}
                moveNext={moveNext}
                childLoaded={childLoaded}
                saveProgress={saveProgress}
                restartLesson={restartLesson}
                learningPathId={Number(learningPathId)}
                changeMistakesSetting={changeMistakesSetting}
                practiseMistakesInThisPath={practiseMistakesInThisPath}
                addMistake={addMistake} />
            </>
          )}
        </form>
      </div>
    </>
  );
}
