import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ArrowBigLeft, FilePenLine } from 'lucide-react';

import { AuthHeader } from '../../components/auth/AuthHeader';
import { PLACEHOLDERS } from '../../constants/learning';
import { getMissingParts, replaceCharsForLanguage, setLanguageSettings, splitAndKeep } from '../../utils/languageUtils';
import { Exercise } from './exercise/Exercise';
import type { User } from '../../types/shared/User';
import type { ExerciseInfo, ExtendedExerciseInfo } from '../../types/exercise/Exercise';
import type { ExerciseHandle } from '../../types/ui/ComponentHandles';
import { errorHandler } from '@ayalaslanguage/types/error';
import { focusOnLoad, getExtraOptionsSeparator, hasExtraOptions, hasSingleBucketAnswer, isMatchingType, usesInlineExerciseWithBlanks } from '../../logic/ExerciseTypeLogic';
import { safeParseData } from '../../logic/ExerciseDataLogic';

export function LessonPage() {
  const { learningPathId } = useParams();
  const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
  const [scoreToAdd, setScoreToAdd] = useState(0);
  const [learningPathData, setLearningPathData] = useState<Record<string, unknown> | null>(null);
  const [currentExercise, setCurrentExercise] = useState<ExtendedExerciseInfo | null>(null);
  const [practiseMistakesInThisPath, setPractiseMistakesInThisPath] = useState(false);
  const [error, setError] = useState('');
  const exerciseRefs = useRef<Map<number, ExerciseHandle | undefined>>(new Map());
  const navigate = useNavigate();
  const { user, login } = useOutletContext<{ user: User; login: (u: User) => void }>();

  const changeCurrentExercise = function (arrExercises: ExerciseInfo[], index: number) {
    const curItem = arrExercises[index];

    // Defensive: ensure curItem and curItem.data are present
    const raw = curItem?.data;
    const dataObj = safeParseData(raw);
    if (dataObj == null) return;

    const targetLang = user?.languageSettings?.targetLanguage || '';
    const firstData = replaceCharsForLanguage(targetLang, dataObj?.First || '') || '';
    const secondData = replaceCharsForLanguage(targetLang, dataObj?.Second || '') || '';

    if (usesInlineExerciseWithBlanks(curItem.exerciseTypeId)) {
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
    } else if (hasExtraOptions(curItem.exerciseTypeId)) {
      const separator = getExtraOptionsSeparator(curItem.exerciseTypeId);
      let tempAnswers: string[];
      const secondAsStr = (secondData || '').trim();
      if (hasSingleBucketAnswer(curItem.exerciseTypeId)) {
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
    } else if (isMatchingType(curItem.exerciseTypeId)) {
      const sentenceElements = (firstData || '').split(',');
      const answers = (secondData || '').split(',');

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

    if (focusOnLoad(curItem.exerciseTypeId)) {
      const refItem = exerciseRefs.current.get(curItem.exerciseId);
      refItem?.setFocus();
    }
  };

  const childLoaded = function (exerciseId: number) {
    if (exerciseId == currentExercise?.exerciseId) {
      if (focusOnLoad(currentExercise.exerciseTypeId)) {
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
      errorHandler(err, setError);
    }
  };

  const addMistake = async function (exerciseId: number) {
    try {
      await axios.post('/api/learning/mistake', { exerciseId });
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
        errorHandler(err, setError);
      }
    }
  };

  const onBackClick = function (e: React.MouseEvent) {
    e.preventDefault();

    if (currentExercise == null) return;
    if ((currentExercise.index ?? 0) > 0) {
      changeCurrentExercise(exercises, (currentExercise.index ?? 0) - 1);
    }
  }

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
      errorHandler(err, setError);
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
        const res = await axios.get<ExerciseInfo[]>(`/api/learning/path/${learningPathId}/exercises`);

        if (res && res.data && res.data.length > 0) {

          const exercisesTemp = [...res.data];

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
        errorHandler(err, setError);
      }
    }
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningPathId]);

  return (
    <>
      <AuthHeader />
      <div className="lesson-outer-container">
        <div className="lesson-inner-container">
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
                {currentExercise && (currentExercise.index ?? 0) > 0 && (
                  <div className="form-row">
                    <button data-testid="back" className="form-button button-back" onClick={onBackClick}><ArrowBigLeft /> Back</button>
                  </div>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
