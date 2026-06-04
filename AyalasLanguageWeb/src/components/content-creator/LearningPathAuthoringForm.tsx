import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { LayersPlus, Trash, FileUp, FileDown, Ban } from 'lucide-react';
import axios from 'axios';

import { removeLastCharIfMatch, downloadFile } from '../../utils/utils';
import { EXERCISE_GENERATIONS, PLACEHOLDERS, AUTHOR_ACCESS, EXERCISE_TYPES } from '../../constants/learning';
import type { User } from '../../types/shared/User';

export function LearningPathAuthoringForm({ handleSubmit, initialRecord, reloadExercise }:
  { handleSubmit: any; initialRecord?: any; reloadExercise?: () => void }) {
  const [error, setError] = useState('');
  const [level, setLevel] = useState(1);
  const [fileForImport, setFileForImport] = useState<File | null>(null);
  const [importStart, setImportStart] = useState(false);
  const [chapter, setChapter] = useState(1);
  const [title, setTitle] = useState('');
  const [access, setAccess] = useState(AUTHOR_ACCESS.CAN_EDIT);
  const [exerciseType, setExerciseType] = useState(0);
  const [exerciseTypeDesc, setExerciseTypeDesc] = useState('');
  const [firstSet, setFirstSet] = useState('');
  const [secondSet, setSecondSet] = useState('');
  const [wrongExtraOptions, setWrongExtraOptions] = useState('');
  const [firstSetDesc, setFirstSetDesc] = useState('');
  const [secondSetDesc, setSecondSetDesc] = useState('');
  const [aiInstructions, setAIInstructions] = useState('');
  const [searchParams] = useSearchParams();
  const initLevel = searchParams.get('level');
  const initChapter = searchParams.get('chapter');
  const navigate = useNavigate();

  const { user } = useOutletContext<{ user: User | null }>();

  const parseForm = function () {
    if (firstSet == '' || secondSet == '') {
      return null;
    }

  const arrFirstSet = (removeLastCharIfMatch(firstSet.trim(), ';') ?? '').split(';');
  const arrSecondSet = (removeLastCharIfMatch(secondSet.trim(), ';') ?? '').split(';');

    if (!arrFirstSet || arrFirstSet.length === 0 || !arrSecondSet || arrSecondSet.length === 0) {
      return null;
    }

    if (arrFirstSet.length != arrSecondSet.length) {
      setError(`Must have a match between the number of words/sentences on both sets. Found ${arrFirstSet.length} on the first set, and ${arrSecondSet.length} on the second set.`);
      return null;
    }

    let arrExtraOptions: string[] = [];
    if (exerciseType == EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET) {
  arrExtraOptions = (removeLastCharIfMatch(wrongExtraOptions.trim(), ';') ?? '').split(';');
      if (arrFirstSet.length != arrExtraOptions.length) {
        setError(`Must have a match between the number of words/sentences and sets of extra options. Found ${arrFirstSet.length} on the first set, and ${arrExtraOptions.length} on the wrong extra options.`);
        return null;
      }
    }

    const arrObjects: any[] = [];
    for (let i = 0; i < arrFirstSet.length; i++) {
      const objExerciseData: any = {
        First: arrFirstSet[i].trim(),
        Second: arrSecondSet[i].trim()
      };
      if (exerciseType == EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET) {
        objExerciseData.ExtraOptions = arrExtraOptions[i].trim();
      }
      arrObjects.push(objExerciseData);
    }

    setError('');
    return arrObjects;
  };

  const onFormSubmit = function (e: React.FormEvent) {
    e.preventDefault();
    let arrData = parseForm();

    handleSubmit(setError, createExercises, level, chapter, title, exerciseType, arrData);
  };

  const createExercises = async function (pathId: number, exerciseType: number, arrData: any[]) {
    let created: number[] = [];
    for (const exer of arrData) {
      try {
        let responseEx = await axios.post('/api/creator/exercise', {
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
    } catch (ex: any) {
      setError(ex.message);
    }
  };

  const handleExerciseTypeLogic = function (exrTypeValue: number) {
    const exType = EXERCISE_GENERATIONS.find((ex) => ex.type == exrTypeValue) as any;
    setExerciseTypeDesc(exType.description);

    let aiDesc = exType.ai_instruction as string;
    aiDesc = aiDesc.replaceAll(PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER, user?.languageSettings?.knownLanguage || '');
    aiDesc = aiDesc.replaceAll(PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER, user?.languageSettings?.targetLanguage || '');
    aiDesc = aiDesc.replaceAll(PLACEHOLDERS.LEVEL_PLACEHOLDER, String(level));

    let subject = title.trim();
    if (subject == '') {
      subject = 'any language exchange';
    }
    aiDesc = aiDesc.replaceAll(PLACEHOLDERS.SUBJECT_PLACEHOLDER, subject);

    setAIInstructions(aiDesc);
    setFirstSetDesc(exType.first_data_instructions);
    setSecondSetDesc(exType.second_data_instructions);
  };

  const onChangeExerciseType = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExerciseType(Number(e.target.value));
    handleExerciseTypeLogic(Number(e.target.value));
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
      reloadExercise && reloadExercise();
    } catch (ex: any) {
      setError(ex.response?.data || ex.message);
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
      const response = await fetch(`/api/learning/path/${initialRecord.learningPathId}/exercises`, { credentials: 'include' });
      if (response && response.ok) {
        downloadFile(await response.blob(), `${title}-exercises-${initialRecord.learningPathId}.json`);
      }
    } catch (ex: any) {
      setError(ex.message);
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
          if (initLevel !== '' && Number(initLevel) > 0) {
            setLevel(Number(initLevel));
          }
          if (initChapter !== '' && Number(initChapter) > 0) {
            setChapter(Number(initChapter));
          }
        }
      } catch (ex: any) {
        setError(ex.message);
      }
    }
    execAsync();
  }, [initialRecord]);

  useEffect(() => {
    async function execAsync() {
      if (exerciseType > 0) {
        handleExerciseTypeLogic(exerciseType);
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
            <button type="submit" className="form-button" title="Save"><LayersPlus /></button>
          </div>
          {initialRecord && (
            <>
              <div className="form-button-cell">
                <button type="button" onClick={onImportExercises} className="form-button" title="Import Exercises"><FileDown /></button>
              </div>
              <div className="form-button-cell">
                <button type="button" onClick={onExportExercises} className="form-button" title="Export Exercises"><FileUp /></button>
              </div>
            </>
          )}
          {initialRecord && initialRecord.access == AUTHOR_ACCESS.CAN_EDIT && initialRecord.exerciseCount == 0 && (
            <div className="form-button-cell">
              <button type="button" onClick={deleteLesson} className="form-button" title="Delete lesson"><Trash /></button>
            </div>
          )}
        </div>
        {error != '' && (
          <div className="form-row">
            <label className="form-error">{error}</label>
          </div>
        )}
        {importStart && (
          <>
            <div className="form-label-row">Please select an exercises json file for import and click Import Exercises again</div>
            <div className="form-row">
              <div className="form-input-row">
                <input type="file" onChange={handleFileChange} accept=".json" />
              </div>
              <div className="form-input-row">
                <button type="button" onClick={cancelImport} className="form-button" title="Cancel"><Ban /> Cancel</button>
              </div>
            </div>
          </>
        )}
        <div className="form-label-row">Level</div>
        <div className="form-row">
          <div className="form-input-row">
            <input type="number" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} value={level} onChange={(e) => { setLevel(Number(e.target.value)) }} />
          </div>
        </div>
        <div className="form-label-row">Chapter</div>
        <div className="form-row">
          <div className="form-input-row">
            <input type="number" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} required={access == AUTHOR_ACCESS.CAN_EDIT} value={chapter} onChange={(e) => { setChapter(Number(e.target.value)) }} />
          </div>
        </div>
        <div className="form-label-row">Title</div>
        <div className="form-row">
          <div className="form-input-row">
            <input type="text" readOnly={access != AUTHOR_ACCESS.CAN_EDIT} required={access == AUTHOR_ACCESS.CAN_EDIT} value={title} onChange={(e) => { setTitle(e.target.value) }} />
          </div>
        </div>
        <div className="form-header">
          <h2>Exercise Generator</h2>
        </div>
        <div className="form-label-row">Exercise Type</div>
        <div className="form-row">
          <div className="form-input-row">
            <select required id="exercise-type" className="form-select" value={exerciseType} onChange={onChangeExerciseType}>
              <option value="0" disabled>-- Please choose an option --</option>
              {EXERCISE_GENERATIONS.map((exType) => (
                <option key={exType.type} value={exType.type}>{exType.name}</option>
              ))}
            </select>
          </div>
          <div className="form-content-row">{exerciseTypeDesc}</div>
        </div>
        <div className="form-label-row">AI instructions</div>
        <div className="form-row">
          <div className="form-content-row">{aiInstructions}</div>
        </div>
        <div className="form-label-row">First set of words/sentences</div>
        <div className="form-row">
          <div className="form-input-row">
            <textarea className="text-area-wide" value={firstSet} onChange={(e) => { setFirstSet(e.target.value) }} />
          </div>
          <div className="form-content-row">{firstSetDesc}</div>
        </div>
        <div className="form-label-row">Second set of words/sentences</div>
        <div className="form-row">
          <div className="form-input-row">
            <textarea className="text-area-wide" value={secondSet} onChange={(e) => { setSecondSet(e.target.value) }} />
          </div>
          <div className="form-content-row">{secondSetDesc}</div>
        </div>
        {exerciseType == EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET && (
          <>
            <div className="form-label-row">Wrong Extra Options</div>
            <div className="form-row">
              <div className="form-input-row">
                <textarea className="text-area-wide" value={wrongExtraOptions} onChange={(e) => { setWrongExtraOptions(e.target.value) }} />
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
