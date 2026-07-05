import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LayersPlus, Trash, FileUp, FileDown, Ban, Workflow, UserPen, BookOpenCheck, Save } from 'lucide-react';
import axios from 'axios';
import { errorHandler } from '@ayalaslanguage/types/error';
import { removeLastCharIfMatch, downloadFile, initializePuter, parseLLMResponse, writeToLog, handleKeyDown } from '../../utils/utils';
import { EXERCISE_GENERATIONS, DEFAULT_NUM_OF_EXERCISES, type ExerciseGeneration } from '../../constants/learning';
import { ROLE_TYPE, AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';

import type { User } from '../../types/shared/User';
import type { ExerciseData } from '../../types/exercise/Exercise';
import puter from '@heyputer/puter.js';
import type { NextChapterResponse } from '../../types/creator/creator';
import { hasExtraOptions, rankExerciseTypeByEase } from '../../logic/ExerciseTypeLogic';
import type { ExerciseType } from '@ayalaslanguage/types/exercise';
import { LOG_TYPE, type LogAutoAIFailure } from '@ayalaslanguage/types/log';
import { ActionsMenuComponent, type ActionsMenuItem } from '../ActionsMenuComponent';
import { ExerciseTypeIcon } from '../ExerciseTypeIcon';
import { getAIInstructions, type IChatMessage } from '../../logic/AIInstructionsLogic';
import { FormHeader } from '../FormHeader';

export function LearningPathAuthoringForm({ handleSubmit, initialRecord, reloadExercise }:
  { handleSubmit: (...args: any[]) => Promise<void>; initialRecord?: any; reloadExercise?: () => void }) {
  const [error, setError] = useState('');
  const [level, setLevel] = useState(1);
  const [fileForImport, setFileForImport] = useState<File | null>(null);
  const [importStart, setImportStart] = useState(false);
  const [chapter, setChapter] = useState(1);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [access, setAccess] = useState(AUTHOR_ACCESS.CAN_EDIT);

  const [exerciseType, setExerciseType] = useState<ExerciseType | 0>(0);
  const [exerciseTypeDesc, setExerciseTypeDesc] = useState('');
  const [firstSet, setFirstSet] = useState('');
  const [secondSet, setSecondSet] = useState('');
  const [wrongExtraOptions, setWrongExtraOptions] = useState('');
  const [firstSetDesc, setFirstSetDesc] = useState('');
  const [secondSetDesc, setSecondSetDesc] = useState('');
  const [wrongExtraOptionsDesc, setWrongExtraOptionsDesc] = useState('');
  const [aiInstructions, setAIInstructions] = useState('');
  const [searchParams] = useSearchParams();
  const initLevel = searchParams.get('level');
  const initChapter = searchParams.get('chapter');
  const navigate = useNavigate();
  const [puterSignedIn, setPuterSignedIn] = useState(false);
  const [usePuterAI, setUsePuterAI] = useState(true);

  const titleRef = useRef<HTMLInputElement>(null);
  const exerciseTypeRef = useRef<HTMLSelectElement>(null);
  const firstSetRef = useRef<HTMLTextAreaElement>(null);
  const secondSetRef = useRef<HTMLTextAreaElement>(null);
  const wrongExtraOptionsRef = useRef<HTMLTextAreaElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const { user } = useOutletContext<{ user: User | null }>();

  const parseForm = async function () {
    let arrObjects: ExerciseData[] = [];
    if (!usePuterAI) {

      if (firstSet == '' && secondSet == '') {
        return [];
      }

      if (firstSet == '' || secondSet == '') {
        setError(`Must fill both sets. Found '${firstSet}' on the first set, and '${secondSet}' on the second set.`);
        return null;
      }

      const arrFirstSet = (removeLastCharIfMatch(firstSet.trim(), ';') ?? '').split(';');
      const arrSecondSet = (removeLastCharIfMatch(secondSet.trim(), ';') ?? '').split(';');

      if ((!arrFirstSet || arrFirstSet.length === 0) && (!arrSecondSet || arrSecondSet.length === 0)) {

        return [];
      }

      if (!arrFirstSet || !arrSecondSet || arrFirstSet.length != arrSecondSet.length) {
        setError(`Must have a match between the number of words/sentences on both sets. Found ${arrFirstSet.length} on the first set, and ${arrSecondSet.length} on the second set.`);
        return null;
      }

      let arrExtraOptions: string[] = [];
      if (hasExtraOptions(exerciseType)) {
        arrExtraOptions = (removeLastCharIfMatch(wrongExtraOptions.trim(), ';') ?? '').split(';');
        if (arrFirstSet.length != arrExtraOptions.length) {
          setError(`Must have a match between the number of words/sentences and sets of extra options. Found ${arrFirstSet.length} on the first set, and ${arrExtraOptions.length} on the wrong extra options.`);
          return null;
        }
      }

      for (let i = 0; i < arrFirstSet.length; i++) {
        const objExerciseData: ExerciseData = {
          First: arrFirstSet[i].trim(),
          Second: arrSecondSet[i].trim()
        };
        if (hasExtraOptions(exerciseType)) {
          objExerciseData.ExtraOptions = arrExtraOptions[i].trim();
        }
        arrObjects.push(objExerciseData);
      }
    }
    else { //use AI to generate exercises
      if (exerciseType == 0) {
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
      const response = await puter.ai.chat(aiAutoDescNew);
      if (response != undefined && response.message != undefined) {
        // Extract the raw string response
        const rawText = response.message.content.toString();



        // Parse the string into a JSON object
        let jsonOutput: unknown;
        try {
          jsonOutput = parseLLMResponse(rawText);
        }
        catch {
          setError('Automated generation did not return in the expected result format. Switch to manual use of AI or try again.');
          writeToLog<LogAutoAIFailure>(LOG_TYPE.AUTO_AI_FAILURE, {
            Title: "parsing LLM response failed",
            Instruction: aiAutoDescNew.map(it => it.content).join(' '),
            Result: rawText
          } as LogAutoAIFailure);
          return null;
        }
        if (!Array.isArray(jsonOutput)) {
          setError('Automated generation did not return the expected result. Switch to manual use of AI or try again.');
          writeToLog<LogAutoAIFailure>(LOG_TYPE.AUTO_AI_FAILURE, {
            Title: "Result is not an array",
            Instruction: aiAutoDescNew.map(it => it.content).join(' '),
            Result: rawText
          } as LogAutoAIFailure);
          return null;
        }
        else {
          //verify that has at least one element that can be assigned to ExerciseData
          if (jsonOutput.length == 0) {
            setError('Automated generation returned an empty result. Switch to manual use of AI or try again.');
            writeToLog<LogAutoAIFailure>(LOG_TYPE.AUTO_AI_FAILURE, {
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
                || (hasExtraOptions(exerciseType) && !('ExtraOptions' in item))) {
                isValid = false;
                break;
              }

              if ((typeof (item as Record<string, unknown>).First !== 'string') || (typeof (item as Record<string, unknown>).Second !== 'string')
                || (hasExtraOptions(exerciseType) && (typeof (item as Record<string, unknown>).ExtraOptions !== 'string'))) {
                isValid = false;
                break;
              }
            }

            if (!isValid) {
              setError('Automated generation returned the expected result structure. Switch to manual use of AI or try again.');
              writeToLog<LogAutoAIFailure>(LOG_TYPE.AUTO_AI_FAILURE, {
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

  const onFormSubmit = async function (e: React.SubmitEvent) {
    e.preventDefault();
    setLoadingMessage('Generating exercises...');
    setIsLoading(true);


    const arrData = await parseForm();

    //error is displayed when arrData is null
    if (arrData != null) {

      await handleSubmit(setError, createExercises, level, chapter, title, exerciseType, arrData);
    }
    setIsLoading(false);
  };

  const saveOnly = async function (e: React.MouseEvent) {

    e.preventDefault();

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
        const responseEx = await axios.post('/api/creator/exercise', {
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
            await axios.delete(`/api/creator/exercise/${exerId}`);
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
      await axios.delete(`/api/creator/learning-path/${initialRecord.learningPathId}`);
      navigate('/home');
    } catch (ex: unknown) {
      errorHandler(ex, setError);
    }
  };

  const handleExerciseTypeLogic = function (exrTypeValue: ExerciseType) {
    const exType = EXERCISE_GENERATIONS.find((ex) => ex.type == exrTypeValue) as ExerciseGeneration;
    setExerciseTypeDesc(exType.description);
    let aiMessages: IChatMessage[];
    const numOfExercises = user?.numOfExercisesToGenerate ?? DEFAULT_NUM_OF_EXERCISES;
    const targetLanguage = user?.languageSettings?.targetLanguageEnglishName || '';
    const knownLanguage = user?.languageSettings?.knownLanguage || '';
    let subject = title.trim();
    if (subject == '') {
      subject = 'any language exchange';
    }
    //manual ai instructions
    aiMessages = getAIInstructions(targetLanguage, knownLanguage, numOfExercises, false, subject, exrTypeValue);
    setAIInstructions(aiMessages.map(it => it.content).join(' '));
    //automatic ai instructions (returning json)
    aiMessages = getAIInstructions(targetLanguage, knownLanguage, numOfExercises, true, subject, exrTypeValue);

    setFirstSetDesc(exType.first_data_instructions);
    setSecondSetDesc(exType.second_data_instructions);
    if (hasExtraOptions(exrTypeValue)) {
      setWrongExtraOptionsDesc(exType.extra_options_instructions || '');
    }

    return aiMessages;
  };



  const onChangeExerciseType = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const exType = Number(e.target.value) as ExerciseType;
    setExerciseType(exType);
    handleExerciseTypeLogic(exType);
  };

  async function onImportExercises(e: React.MouseEvent) {
    e.preventDefault();
    try {
      if (!importStart) {
        setImportStart(true);
        return;
      }

      const formData = new FormData();
      if (fileForImport) formData.append('file', fileForImport);

      await axios.post(`/api/creator/learning-path/${initialRecord.learningPathId}/import`, formData);
      setImportStart(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      reloadExercise && reloadExercise();
    } catch (ex: unknown) {
      errorHandler(ex, setError);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFileForImport(e.target.files[0]);
    }
  }

  function cancelImport(e: React.MouseEvent) {
    e.preventDefault();
    setImportStart(false);
  }

  async function onExportExercises(e: React.MouseEvent) {
    try {
      e.preventDefault();
      const response = await axios.get(`/api/learning/path/${initialRecord.learningPathId}/exercises`, {
        responseType: 'blob' // This is the equivalent of .blob()
      });
      downloadFile(response.data, `${title}-exercises-${initialRecord.learningPathId}.json`);
    } catch (ex: unknown) {
      errorHandler(ex, setError);
    }
  }

  useEffect(() => {
    async function execAsync() {
      try {
        setIsLoading(false);
        if (initialRecord != null) {
          setLevel(initialRecord.level);
          setChapter(initialRecord.chapter);
          setTitle(initialRecord.name);
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
          const res = await axios.post<NextChapterResponse>('/api/creator/next-chapter', { Level: tempLevel, ChapterHint: hintChapter });
          setChapter(res.data.chapter);
        }

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
  }, [initialRecord, searchParams, user]);

  useEffect(() => {
    async function execAsync() {
      if (exerciseType > 0) {
        handleExerciseTypeLogic(exerciseType as ExerciseType);
      }
    }
    execAsync();
  }, [exerciseType]);

  return (
    <div className="form-container">
      <FormHeader isPublic={false} title="Lesson editor" />
      {user?.role != ROLE_TYPE.ADMIN && user?.role != ROLE_TYPE.CONTENT_CREATOR && (
        <div className="form-row">
          <div className="form-content-row">An email address confirmation request has been sent to '{user?.userName}'. Please confirm your email, so you'll be able to generate exercise content on this page and recover your account, in case you forget your password. </div>
          <div className="form-content-row">You can update your email address and resend the email confirmation request on the&nbsp;<Link to="/account">Manage account page</Link>.</div>
        </div>
      ) || (
          <form onSubmit={onFormSubmit}>
            {error != '' && (
              <div className="form-row">
                <label className="form-error">{error}</label>
              </div>
            )}
            {isLoading && (
              <div className="loadingOverlay">
                <div data-testid="loadingBox" className="loadingBox">
                  {loadingMessage}
                </div>
              </div>
            ) || (
                <>
                  {importStart && (
                    <>
                      <div className="form-label-row">Please select an exercises json file for import and click Import Exercises again</div>
                      <div className="form-row">
                        <div className="form-input-row">
                          <input data-testid="import-file" type="file" onChange={handleFileChange} accept=".json" />
                        </div>
                        <div className="form-input-row">
                          <button data-testid="cancel-import" type="button" onClick={cancelImport} className="form-button" title="Cancel"><Ban /> Cancel</button>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="form-label-row">Level</div>
                  <div className="form-row">
                    <div className="form-input-row">
                      <input type="number" className="form-input" data-testid="level" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} value={level} onChange={(e) => { setLevel(Number(e.target.value)) }} />
                    </div>
                  </div>
                  <div className="form-label-row">Chapter</div>
                  <div className="form-row">
                    <div className="form-input-row">
                      <input type="number" className="form-input" data-testid="chapter" min="0.01" step="any" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} required={access == AUTHOR_ACCESS.CAN_EDIT} value={chapter} onChange={(e) => { setChapter(Number(e.target.value)) }} />
                    </div>
                  </div>
                  <div className="form-label-row">Subject</div>
                  <div className="form-row">
                    <div className="form-input-row">
                      <input ref={titleRef} type="text" className="form-input form-input-long" data-testid="title" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} required={access == AUTHOR_ACCESS.CAN_EDIT} value={title} onKeyDown={(e) => handleKeyDown(e, exerciseTypeRef)} onChange={(e) => { setTitle(e.target.value) }} />
                    </div>
                    <div className="form-content-row">AI will generate exercises on this subject.</div>
                  </div>
                  <div className="form-label-row">Exercise Type</div>
                  <div className="form-row">
                    <div className="exercise-type-selector-container">
                      <select ref={exerciseTypeRef} required data-testid="exercise-type" className="exercise-type-select" value={exerciseType} 
                        onChange={onChangeExerciseType}>
                        <option value="0" disabled>-- Please choose an option --</option>
                        {EXERCISE_GENERATIONS.sort((a: ExerciseGeneration, b: ExerciseGeneration) => rankExerciseTypeByEase(a.type) - rankExerciseTypeByEase(b.type)).map((exType) => (
                          <option key={exType.type} value={exType.type}>{exType.name}</option>
                        ))}
                      </select>
                      <div className="exercise-type-difficulty">
                        <ExerciseTypeIcon exerciseTypeId={exerciseType} />
                      </div>
                    </div>
                    <div className="form-content-row">{exerciseTypeDesc}</div>
                  </div>
                  {!usePuterAI && (
                    <>
                      <div className="form-label-row">AI instructions</div>
                      <div className="form-row">
                        <div className="form-content-row">{aiInstructions}</div>
                      </div>
                      <div className="form-label-row">First set of words/sentences</div>
                      <div className="form-row">
                        <div className="form-input-row">
                          <textarea ref={firstSetRef} data-testid="first-set" className="text-area-wide" value={firstSet} onKeyDown={(e) => handleKeyDown(e, secondSetRef)} onChange={(e) => { setFirstSet(e.target.value) }} />
                        </div>
                        <div className="form-content-row">{firstSetDesc}</div>
                      </div>
                      <div className="form-label-row">Second set of words/sentences</div>
                      <div className="form-row">
                        <div className="form-input-row">
                          <textarea ref={secondSetRef} data-testid="second-set" className="text-area-wide" value={secondSet} onKeyDown={(e) => handleKeyDown(e, hasExtraOptions(exerciseType) ? wrongExtraOptionsRef : saveButtonRef)} onChange={(e) => { setSecondSet(e.target.value) }} />
                        </div>
                        <div className="form-content-row">{secondSetDesc}</div>
                      </div>
                      {hasExtraOptions(exerciseType) && (
                        <>
                          <div className="form-label-row">Wrong Extra Options</div>
                          <div className="form-row">
                            <div className="form-input-row">
                              <textarea ref={wrongExtraOptionsRef} data-testid="extra-options" className="text-area-wide" value={wrongExtraOptions} onKeyDown={(e) => handleKeyDown(e, saveButtonRef)} onChange={(e) => { setWrongExtraOptions(e.target.value) }} />
                            </div>
                            <div className="form-content-row">{wrongExtraOptionsDesc}</div>
                          </div>
                        </>
                      )}
                    </>)}
                </>
              )}
            <div className="buttons-container">
              <ActionsMenuComponent anchorTitle="More" items={[
                {
                  isVisible: usePuterAI,
                  dataTestId: "switch-ai-use",
                  disabled: isLoading || user?.disablePuter,
                  children: <><UserPen />&nbsp;Switch to Manual Entry</>,
                  onClick: () => { setUsePuterAI(!usePuterAI) }
                },
                {
                  isVisible: !usePuterAI,
                  dataTestId: "switch-ai-use",
                  disabled: isLoading || user?.disablePuter,
                  children: <><Workflow />&nbsp;Switch to AI Generation</>,
                  onClick: () => { setUsePuterAI(!usePuterAI) }
                },
                {
                  isVisible: initialRecord != null && initialRecord.access == AUTHOR_ACCESS.CAN_EDIT,
                  dataTestId: "import-exercises",
                  disabled: isLoading,
                  onClick: onImportExercises,
                  children: <><FileDown />&nbsp;Import Exercises</>
                },
                {
                  isVisible: initialRecord != null && initialRecord.access == AUTHOR_ACCESS.CAN_EDIT,
                  dataTestId: "export-exercises",
                  disabled: isLoading,
                  onClick: onExportExercises,
                  children: <><FileUp />&nbsp;Export Exercises</>
                },
                {
                  isVisible: initialRecord != null && initialRecord.access == AUTHOR_ACCESS.CAN_EDIT && initialRecord.exerciseCount == 0,
                  dataTestId: "delete-lesson",
                  disabled: isLoading,
                  onClick: deleteLesson,
                  children: <><Trash />&nbsp;Delete Lesson</>
                },
                {
                  isVisible: initialRecord != null && !isLoading,
                  dataTestId: "back-to-lesson",
                  children: <><BookOpenCheck />&nbsp;Back to Lesson</>,
                  toPath: `/path/${initialRecord?.learningPathId}`
                }
              ] as ActionsMenuItem[]} />
              {initialRecord && initialRecord.access == AUTHOR_ACCESS.CAN_EDIT && usePuterAI && (
                <div className="form-button-cell">
                  <button data-testid="save-only" type="button" className="top-button" title="Save" onClick={saveOnly}>
                    <Save />&nbsp;Save
                  </button>
                </div>
              )}
              <div className="form-button-cell">
                <button ref={saveButtonRef} data-testid="save" type="submit" disabled={isLoading} className="top-button"><LayersPlus />&nbsp;{usePuterAI ? "Generate" : "Save & Generate"}</button>
              </div>
            </div>
          </form>
        )}

    </div>
  );
}
