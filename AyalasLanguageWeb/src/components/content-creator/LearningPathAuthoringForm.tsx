import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LayersPlus, Trash, FileUp, FileDown, Ban, Workflow, UserPen, BookOpenCheck } from 'lucide-react';
import axios from 'axios';

import { removeLastCharIfMatch, downloadFile, errorHandler, initializePuter, parseLLMResponse } from '../../utils/utils';
import { EXERCISE_GENERATIONS, PLACEHOLDERS, AUTHOR_ACCESS } from '../../constants/learning';
import { type ExerciseType } from '../../types/exercise/Exercise';
import type { User } from '../../types/shared/User';
import type { ExerciseData } from '../../types/exercise/Exercise';
import puter from '@heyputer/puter.js';
import type { NextChapterResponse } from '../../types/creator/creator';
import { hasExtraOptions } from '../../logic/ExerciseTypeLogic';

export function LearningPathAuthoringForm({ handleSubmit, initialRecord, reloadExercise }:
  { handleSubmit: (...args: any[]) => Promise<void>; initialRecord?: any; reloadExercise?: () => void }) {
  const [error, setError] = useState('');
  const [level, setLevel] = useState(1);
  const [fileForImport, setFileForImport] = useState<File | null>(null);
  const [importStart, setImportStart] = useState(false);
  const [chapter, setChapter] = useState(1);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
  const [aiInstructionsAuto, setAIInstructionsAuto] = useState('');
  const [searchParams] = useSearchParams();
  const initLevel = searchParams.get('level');
  const initChapter = searchParams.get('chapter');
  const navigate = useNavigate();
  const [puterSignedIn, setPuterSignedIn] = useState(false);
  const [usePuterAI, setUsePuterAI] = useState(true);

  const { user } = useOutletContext<{ user: User | null }>();

  const parseForm = async function () {
    let arrObjects: ExerciseData[] = [];
    if (!usePuterAI) {
      if (firstSet == '' || secondSet == '') {
        return [];
      }

      const arrFirstSet = (removeLastCharIfMatch(firstSet.trim(), ';') ?? '').split(';');
      const arrSecondSet = (removeLastCharIfMatch(secondSet.trim(), ';') ?? '').split(';');

      if (!arrFirstSet || arrFirstSet.length === 0 || !arrSecondSet || arrSecondSet.length === 0) {
        return [];
      }

      if (arrFirstSet.length != arrSecondSet.length) {
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

      if (aiInstructionsAuto == '') {
        setError('There is no automated AI instruction for this exercise type. Switch to manual use of AI or try a different exercise type.');
        return null;
      }
      const response = await puter.ai.chat(aiInstructionsAuto);
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
          console.log('Error parsing puter.ai.chat response', rawText);
          return null;
        }
        if (!Array.isArray(jsonOutput)) {
          setError('Automated generation did not return the expected result. Switch to manual use of AI or try again.');
          console.log(jsonOutput);
          return null;
        }
        else {
          //verify that has at least one element that can be assigned to ExerciseData
          if (jsonOutput.length == 0) {
            setError('Automated generation returned an empty result. Switch to manual use of AI or try again.');
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
              return null;
            }

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
    setIsLoading(true);
    const arrData = await parseForm();

    //error is displayed when arrData is null
    if (arrData != null) {
      await handleSubmit(setError, createExercises, level, chapter, title, exerciseType, arrData);
    }
    setIsLoading(false);
  };

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

  const replaceAIInstructionsPlaceholders = function (aiDesc: string): string {
    aiDesc = aiDesc.replaceAll(PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER, user?.languageSettings?.knownLanguage || '');
    aiDesc = aiDesc.replaceAll(PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER, user?.languageSettings?.targetLanguage || '');
    aiDesc = aiDesc.replaceAll(PLACEHOLDERS.LEVEL_PLACEHOLDER, String(level));

    let subject = title.trim();
    if (subject == '') {
      subject = 'any language exchange';
    }
    return aiDesc.replaceAll(PLACEHOLDERS.SUBJECT_PLACEHOLDER, subject);
  };

  const handleExerciseTypeLogic = function (exrTypeValue: ExerciseType) {
    const exType = EXERCISE_GENERATIONS.find((ex) => ex.type == exrTypeValue) as any;
    setExerciseTypeDesc(exType.description);
    let aiDesc: string;
    //manual ai instructions
    aiDesc = replaceAIInstructionsPlaceholders(exType.ai_instruction as string);
    setAIInstructions(aiDesc);
    //automatic ai instructions (returning json)
    aiDesc = replaceAIInstructionsPlaceholders(exType.ai_instruction_auto as string);
    setAIInstructionsAuto(aiDesc);

    setFirstSetDesc(exType.first_data_instructions);
    setSecondSetDesc(exType.second_data_instructions);
    if (hasExtraOptions(exrTypeValue)) {
      setWrongExtraOptionsDesc(exType.extra_options_instructions);
    }
  };



  const onChangeExerciseType = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExerciseType(Number(e.target.value) as ExerciseType);
    handleExerciseTypeLogic(Number(e.target.value) as ExerciseType);
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
        setIsLoading(false);
        const tempPuterSignin = (await initializePuter() == true);
        setPuterSignedIn(tempPuterSignin);
        if (!tempPuterSignin) {
          //default to manual use of AI if could not sign in
          setUsePuterAI(false);
        }
      } catch (ex: unknown) {
        errorHandler(ex, setError);
      }
    }
    execAsync();
  }, [initialRecord, searchParams]);

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
      <form onSubmit={onFormSubmit}>
        <div className="form-header">
          <h1>Lesson editor</h1>
        </div>
        <div className="form-row">
          <div className="form-button-cell">
            <button data-testid="save" type="submit" disabled={isLoading} className="form-button" title="Save and Generate Exercises"><LayersPlus /></button>
          </div>
          <div className="form-button-cell">
            <button data-testid="switch-ai-use" type="button" disabled={isLoading} onClick={() => { setUsePuterAI(!usePuterAI) }} className="form-button"
              title={usePuterAI ? "Automated AI use (click to Switch to manual use)" : "Manual AI use (click to Switch to automated use)"}>{usePuterAI && (<Workflow />) || (<UserPen />)}
            </button>
          </div>
          {initialRecord && (
            <>
              <div className="form-button-cell">
                <button data-testid="import-exercises" type="button" disabled={isLoading} onClick={onImportExercises} className="form-button" title="Import Exercises"><FileDown /></button>
              </div>
              <div className="form-button-cell">
                <button data-testid="export-exercises" type="button" disabled={isLoading} onClick={onExportExercises} className="form-button" title="Export Exercises"><FileUp /></button>
              </div>
            </>
          )}
          {initialRecord && initialRecord.access == AUTHOR_ACCESS.CAN_EDIT && initialRecord.exerciseCount == 0 && (
            <div className="form-button-cell">
              <button data-testid="delete-lesson" type="button" disabled={isLoading} onClick={deleteLesson} className="form-button" title="Delete lesson"><Trash /></button>
            </div>
          )}
          {initialRecord && !isLoading && (
            <div className="form-button-cell">
              <Link className="link-button" title="Back to Lesson" to={`/path/${initialRecord.learningPathId}`}><BookOpenCheck /></Link>
            </div>
          )

          }
        </div>
        {error != '' && (
          <div className="form-row">
            <label className="form-error">{error}</label>
          </div>
        )}
        {isLoading && (
          <div className="loadingOverlay">
            <div className="loadingBox">
              Generating exercises...
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
                  <input type="number" data-testid="level" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} value={level} onChange={(e) => { setLevel(Number(e.target.value)) }} />
                </div>
              </div>
              <div className="form-label-row">Chapter</div>
              <div className="form-row">
                <div className="form-input-row">
                  <input type="number" data-testid="chapter" min="0.01" step="any" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} required={access == AUTHOR_ACCESS.CAN_EDIT} value={chapter} onChange={(e) => { setChapter(Number(e.target.value)) }} />
                </div>
              </div>
              <div className="form-label-row">Subject</div>
              <div className="form-row">
                <div className="form-input-row">
                  <input type="text" data-testid="title" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} required={access == AUTHOR_ACCESS.CAN_EDIT} value={title} onChange={(e) => { setTitle(e.target.value) }} />
                </div>
                <div className="form-content-row">AI will generate exercises on this subject.</div>
              </div>
              <div className="form-label-row">Exercise Type</div>
              <div className="form-row">
                <div className="form-input-row">
                  <select required data-testid="exercise-type" className="form-select" value={exerciseType} onChange={onChangeExerciseType}>
                    <option value="0" disabled>-- Please choose an option --</option>
                    {EXERCISE_GENERATIONS.map((exType) => (
                      <option key={exType.type} value={exType.type}>{exType.name}</option>
                    ))}
                  </select>
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
                      <textarea data-testid="first-set" className="text-area-wide" value={firstSet} onChange={(e) => { setFirstSet(e.target.value) }} />
                    </div>
                    <div className="form-content-row">{firstSetDesc}</div>
                  </div>
                  <div className="form-label-row">Second set of words/sentences</div>
                  <div className="form-row">
                    <div className="form-input-row">
                      <textarea data-testid="second-set" className="text-area-wide" value={secondSet} onChange={(e) => { setSecondSet(e.target.value) }} />
                    </div>
                    <div className="form-content-row">{secondSetDesc}</div>
                  </div>
                  {hasExtraOptions(exerciseType) && (
                    <>
                      <div className="form-label-row">Wrong Extra Options</div>
                      <div className="form-row">
                        <div className="form-input-row">
                          <textarea data-testid="extra-options" className="text-area-wide" value={wrongExtraOptions} onChange={(e) => { setWrongExtraOptions(e.target.value) }} />
                        </div>
                        <div className="form-content-row">{wrongExtraOptionsDesc}</div>
                      </div>
                    </>
                  )}
                </>)}
            </>
          )}

      </form>
    </div>
  );
}
