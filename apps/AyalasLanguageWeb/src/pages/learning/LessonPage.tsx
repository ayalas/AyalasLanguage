import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FilePenLine, X } from 'lucide-react';

import { getMissingParts, replaceCharsForLanguage, setLanguageSettings, splitAndKeep } from '@ayalaslanguage/types/sharedfrontlib/utils';
import { Exercise, type ExerciseHandle } from './exercise/Exercise';
import { errorHandler } from '@ayalaslanguage/types/error';
import { EXERCISE_TYPE_LOGIC, safeParseData } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { PLACEHOLDERS, type ExerciseInfo, type ExtendedExerciseInfo, type LearningPathInfo, type PagedExercisesRequest, type PagedExercisesResponse } from '@ayalaslanguage/types/sharedfrontlib/learning';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { toast } from 'sonner';
import { PAGE_SIZE } from '../../constants/learning';

export function LessonPage() {
  const { learningPathId } = useParams();
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

    if (EXERCISE_TYPE_LOGIC[curItem.exerciseTypeId].FocusOnLoad) {
      const refItem = exerciseRefs.current.get(curItem.exerciseId);
      refItem?.setFocus();
    }
  };

  const childLoaded = function (exerciseId: number) {
    if (exerciseId == currentExercise?.exerciseId) {
      if (EXERCISE_TYPE_LOGIC[currentExercise.exerciseTypeId].FocusOnLoad) {
        const refItem = exerciseRefs.current.get(currentExercise.exerciseId);
        refItem?.setFocus();
      }
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
    setScoreToAdd(newScore);

    if ((currentExercise.index ?? 0) === exercises.length - 1) {

      const tempExercises = await loadExercises(page + 1, !hasMoreData || page + 1 >= totalPages);
      if (tempExercises && tempExercises.length > 0) {
        changeCurrentExercise(tempExercises, 0);
        return;
      }
    }

    if ((currentExercise.index ?? 0) < exercises.length - 1) {
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

      if (practiseMistakesInThisPath) {
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
          navigate('/home');
        }
      }

      if (exerId == null) {

        if (!routeToHome) {
          return;
        }

        const toastId = toast('Save progress to start of this lesson?', {
          description: 'This will delete your progress on this lesson.',
          action: {
            label: 'Yes, delete my progress',
            onClick: async (e) => {
              e.preventDefault();
              await axios.delete(`/api/learning/progress/${learningPathId}`);
              toast.dismiss(toastId);

              Finalize();
            },
          },
          cancel: {
            label: 'No, continue without saving progress',
            onClick: (e) => {
              e.preventDefault();
              toast.dismiss(toastId);

              Finalize();
            }
          },
          classNames: {
            toast: 'my-confirm-toast',
            description: 'my-confirm-description', // Optional: styling the description
            actionButton: 'my-action-btn', // Makes the button full width at the bottom
            cancelButton: 'my-cancel-btn',
          },
        });

      } else {
        await axios.post('/api/learning/progress', {
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

  const loadExercises = async function (newPage: number, forceRefresh: boolean, startExerciseId?: number) {
    try {
      const res = await axios.post<PagedExercisesResponse>(`/api/learning/path/${learningPathId}/paged`,
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

  useEffect(() => {
    async function getData() {
      try {
        const response = await axios.get<LearningPathInfo>(`/api/learning/path/${learningPathId}`);
        const learningPathTemp = response.data;
        setLearningPathData(learningPathTemp);
        setPractiseMistakesInThisPath(learningPathTemp.practiseMistakesInThisPath);
        const exercisesTemp = await loadExercises(page, true, learningPathTemp.exerciseId);

        if (exercisesTemp && exercisesTemp.length > 0) {
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
                  <div className="form-name">{`Level ${learningPathData.level}, ${learningPathData.chapter}: ${learningPathData.name}`}</div>
                  <div className="form-close-row">
                    <button onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); saveProgress(true) }} className="actions-menu-link-button" title="Home"><X />&nbsp;Exit</button>
                  </div>
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
            {currentExercise && hasData && (
              <>
                <div className="form-row">
                  <label className="form-label-row">{`Exercise ${((page - 1) * PAGE_SIZE) + (currentExercise.index ?? 0) + 1} of ${numOfRecords}`}</label>
                </div>

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
          </form>
        </div>
      </div>
    </>
  );
}
