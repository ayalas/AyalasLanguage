import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from "axios";
import { AuthHeader } from "../../../components/auth/AuthHeader";
import { ArrowBigLeft, Save } from "lucide-react";
import type { ExerciseData, ExerciseInfo, ExtendedExerciseInfo } from '@ayalaslanguage/types/sharedfrontlib/learning';
import { AlternativeLine, type AlternativeHandle } from "./AlternativeLine";
import { EXERCISE_TYPE_LOGIC } from '@ayalaslanguage/types/sharedfrontlib/logic';
import { FormHeader } from "../../../components/FormHeader";
import { OWNERSHIP_TYPE, type OwnershipType } from "@ayalaslanguage/types/auth";
import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { getAIInstructions, type AIChatRequestDto, type IChatMessage } from '@ayalaslanguage/types/sharedfrontlib/ai';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';

export function ExerciseUpdatePage() {
    const { exerciseId } = useParams();
    const [error, setError] = useState('');
    const [typeName, setTypeName] = useState('');
    const [initialRecord, setInitialRecord] = useState<ExtendedExerciseInfo | null>(null);
    const [firstLine, setFirstLine] = useState('');
    const [secondLine, setSecondLine] = useState('');
    const [translation, setTranslation] = useState('');
    const [corrections, setCorrections] = useState('');
    const [explanation, setExplanation] = useState('');
    const [aiCheckCompleted, setAICheckCompleted] = useState(false);
    const [aiCorrections, setAICorrections] = useState<ExerciseData | null>(null);
    const [propagateChanges, setPropagateChanges] = useState(false);
    const [extraOptions, setExtraOptions] = useState('');
    const [ownershipType, setOwnershipType] = useState<OwnershipType>(OWNERSHIP_TYPE.PUBLIC);
    const alternativeRefs = useRef<Map<string, AlternativeHandle>>(new Map());
    const navigate = useNavigate();
    const location = useLocation();
    const returnToPage = location.state?.returnToPage;
    const { user } = useOutletContext<{ user: User | null }>();


    function formToData(): string {
        const arr: string[] = [];
        if (initialRecord?.exerciseObject?.Alternatives != null
            && initialRecord?.exerciseObject?.Alternatives.length > 0
        ) {
            const map = alternativeRefs.current;
            for (const [key, handle] of map.entries()) {
                if (handle.exists()) {
                    arr.push(key);
                }
            }
        }

        return JSON.stringify({
            First: firstLine,
            Second: secondLine,
            ExtraOptions: extraOptions,
            Translation: translation,
            Alternatives: arr
        } as ExerciseData);
    }

    async function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            const dataToSend: string = formToData();

            await axios.put(`/api/creator/exercise/${exerciseId}`, { Data: dataToSend, ownershipType, propagateChanges });

            if (returnToPage != null) {
                navigate(`/author/path/${initialRecord?.learningPathId}?page=${returnToPage}`);
            }
            else {
                navigate(`/path/${initialRecord?.learningPathId}`);
            }
        } catch (ex: unknown) {
            errorHandler(ex, setError);
        }
    }

    function prepareAIRequest() {
        const exrTypeValue: ExerciseType = initialRecord?.exerciseTypeId as ExerciseType;
        const exType = EXERCISE_TYPE_LOGIC[exrTypeValue].GenerationInfo;
        if (exType == null) return null;

        let aiMessages: IChatMessage[];
        const numOfExercises = 1;
        const targetLanguage = user?.languageSettings?.targetLanguageEnglishName || '';
        const targetLanguageCode = user?.languageSettings?.targetLanguageCode || '';
        const knownLanguage = user?.languageSettings?.knownLanguage || '';
        const matchesNum = EXERCISE_TYPE_LOGIC[exrTypeValue].IsMatchingType ? initialRecord?.exerciseObject?.Second?.split(',').length || 0 : 0;
        const extraOptionsNum = EXERCISE_TYPE_LOGIC[exrTypeValue].HasExtraOptions ? initialRecord?.exerciseObject?.ExtraOptions?.split(' ').length || 0 : 0;

        const dataToSend: string = formToData();

        //automatic ai instructions (returning json)
        aiMessages = getAIInstructions(exType, targetLanguage, targetLanguageCode, knownLanguage, numOfExercises, matchesNum, extraOptionsNum, true, "", dataToSend || '');

        return {
            exerciseType: exrTypeValue,
            numOfExercises,
            matches: matchesNum,
            extraOptions: extraOptionsNum,
            messages: aiMessages
        } as AIChatRequestDto;
    }

    async function sendCheckRequestToAI(req: AIChatRequestDto) {
        let response: any;
        let arrObjects: ExerciseData[] = [];
        try {
            response = await axios.post('/api/ai/unclose/chat', req);
        }
        catch (err: unknown) {
            errorHandler(err, (errMsg: string) => {
                setError(`AI check failed. Error: ${errMsg}`);
            });
            return null;
        }

        if (response.data !== undefined && response.data !== null) {
            // Extract the raw string response
            const objData = response.data;

            if (objData === undefined || objData.content === undefined) {
                setError('AI check did not return a result.');
                return null;
            }
            // Extract the raw string response
            const jsonOutput = objData.content;

            if (!Array.isArray(jsonOutput)) {
                setError('AI check did not return the expected result.');
                return null;
            }
            else {
                //verify that has at least one element that can be assigned to ExerciseData
                if (jsonOutput.length == 0) {
                    setError('AI check returned an empty result.');
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
                            || (EXERCISE_TYPE_LOGIC[req.exerciseType].HasExtraOptions && !('ExtraOptions' in item))) {
                            isValid = false;
                            break;
                        }

                        if ((typeof (item as Record<string, unknown>).First !== 'string') || (typeof (item as Record<string, unknown>).Second !== 'string')
                            || (EXERCISE_TYPE_LOGIC[req.exerciseType].HasExtraOptions && (typeof (item as Record<string, unknown>).ExtraOptions !== 'string'))) {
                            isValid = false;
                            break;
                        }
                    }

                    if (!isValid) {
                        setError('AI check returned the expected result structure.');
                        return null;
                    }

                    setExplanation(objData.explanation || '');
                    arrObjects = jsonOutput;
                }
            }
        }
        else {
            setError('AI check did not return a result.');
            return null;
        }

        return arrObjects;
    }

    async function onAICheckClick(e: React.MouseEvent) {
        e.preventDefault();
        setAICheckCompleted(false);
        setCorrections('');
        setExplanation('');
        setAICorrections(null);
        setError('Processing AI check...');
        const req = prepareAIRequest();


        if (!req || req.messages.length == 0) {
            setError('There is no automated AI instruction for this exercise type.');
            return;
        }

        const arrObjects: ExerciseData[] | null = await sendCheckRequestToAI(req);

        if (arrObjects == null || arrObjects.length == 0) {
            return;
        }

        const theExercise = arrObjects[0];

        if (theExercise.First !== initialRecord?.exerciseObject?.First
            || theExercise.Second !== initialRecord?.exerciseObject?.Second
            || (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].ShowsTranslationOnRevealedAnswer
                && theExercise.Translation !== initialRecord?.exerciseObject?.Translation)
            || (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].HasExtraOptions
                && theExercise.ExtraOptions !== initialRecord?.exerciseObject?.ExtraOptions)) {
            setAICorrections(theExercise);
            setError('AI check offers corrections for this exercise:');
            let messageArr = [
                `First line: ${theExercise.First}`,
                `Second line: ${theExercise.Second}`
            ];
            if (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].HasExtraOptions &&
                theExercise.ExtraOptions !== undefined && theExercise.ExtraOptions !== '') {
                messageArr.push(`Extra options: ${theExercise.ExtraOptions}`);
            }
            if (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].ShowsTranslationOnRevealedAnswer &&
                theExercise.Translation !== undefined && theExercise.Translation !== '') {
                messageArr.push(`Translation: ${theExercise.Translation}`);
            }
            if (explanation !== undefined && explanation !== '') {
                messageArr.push(`Explanation: ${explanation}`);
            }
            setCorrections(messageArr.join('\n'));
        }
        else {
            setAICheckCompleted(true);
            setError('');
        }

    }

    function onApplyAICorrections(e: React.MouseEvent) {
        e.preventDefault();
        if (aiCorrections) {
            setFirstLine(aiCorrections.First || '');
            setSecondLine(aiCorrections.Second || '');
            if (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].ShowsTranslationOnRevealedAnswer) {
                setTranslation(aiCorrections.Translation as string);
            }
            if (EXERCISE_TYPE_LOGIC[initialRecord?.exerciseTypeId || 0].HasExtraOptions) {
                setExtraOptions(aiCorrections.ExtraOptions as string);
            }
        }

        setAICheckCompleted(false);
        setCorrections('');
        setExplanation('');
        setAICorrections(null);
        setError('');
    }

    function onDismissAICorrections(e: React.MouseEvent) {
        e.preventDefault();
        setAICheckCompleted(false);
        setCorrections('');
        setExplanation('');
        setAICorrections(null);
        setError('');
    }

    function onBackClick(e: React.MouseEvent) {
        e.preventDefault();

        if (initialRecord != null && initialRecord.learningPathId != null) {
            navigate(`/path/${initialRecord?.learningPathId}`);
        }
    }

    function onBackEditorClick(e: React.MouseEvent) {
        e.preventDefault();

        if (initialRecord != null && initialRecord.learningPathId != null) {
            navigate(`/author/path/${initialRecord?.learningPathId}?page=${returnToPage}`);
        }
    }

    useEffect(() => {
        async function loadAsync() {
            try {
                if (Number(exerciseId) > 0) {
                    const res = await axios.get<ExerciseInfo>(`/api/creator/exercise/${exerciseId}`);
                    const exerciseTemp: ExtendedExerciseInfo = { ...res.data };
                    if (exerciseTemp.data != null && exerciseTemp.data != "") {
                        exerciseTemp.exerciseObject = JSON.parse(exerciseTemp.data);
                    }
                    setInitialRecord(exerciseTemp);
                    setTypeName(EXERCISE_TYPE_LOGIC[exerciseTemp.exerciseTypeId].Name);
                    setOwnershipType(exerciseTemp.ownershipType);
                    if (exerciseTemp.exerciseObject != null) {
                        if (exerciseTemp.exerciseObject.First != null) {
                            setFirstLine(exerciseTemp.exerciseObject.First);
                        }
                        if (exerciseTemp.exerciseObject.Second != null) {
                            setSecondLine(exerciseTemp.exerciseObject.Second);
                        }
                        if (EXERCISE_TYPE_LOGIC[exerciseTemp.exerciseTypeId].ShowsTranslationOnRevealedAnswer) {
                            setTranslation(exerciseTemp.exerciseObject.Translation as string);
                        }
                        if (EXERCISE_TYPE_LOGIC[exerciseTemp.exerciseTypeId].HasExtraOptions) {
                            setExtraOptions(exerciseTemp.exerciseObject.ExtraOptions as string);
                        }
                    }
                }
            } catch (err: unknown) {
                errorHandler(err, setError);
            }
        }
        loadAsync();
    }, [exerciseId]);

    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <form onSubmit={onFormSubmit}>
                    <FormHeader isPublic={false} title="Exercise editor" />

                    {error !== '' && (
                        <div className="form-row">
                            <label className="form-error">{error}</label>
                        </div>
                    )}

                    {corrections !== '' && (
                        <div className="form-row">
                            <div className="form-input-long">
                                <textarea data-testid="corrections" className="text-area-wide" readOnly={true} value={corrections} />
                            </div>
                        </div>
                    ) || (aiCheckCompleted && (
                        <>
                            <div className="form-row">
                                <label className="form-label">AI check completed. No corrections found.{explanation !== '' && (<>Here's the explanation:</>)}</label>
                            </div>
                            {explanation !== '' && (
                                <div className="form-row">
                                    <div className="form-input-long">
                                        <textarea data-testid="explanation" className="text-area-wide" readOnly={true} value={explanation} />
                                    </div>
                                </div>
                            )}
                        </>
                    ))}
                    <div className="form-label-row">Exercise Type</div>
                    <div className="form-row">
                        <div className="form-input-row">
                            <label className="form-label">{typeName}</label>
                        </div>
                    </div>
                    <div className="form-label-row">First line</div>
                    <div className="form-row">
                        <div className="form-input-long">
                            <textarea data-testid="first-line" className="text-area-minimal" required={true} value={firstLine} onChange={(e) => { setFirstLine(e.target.value) }} />
                        </div>
                    </div>
                    <div className="form-label-row">Second line</div>
                    <div className="form-row">
                        <div className="form-input-long">
                            <textarea data-testid="second-line" className="text-area-minimal" required={true} value={secondLine} onChange={(e) => { setSecondLine(e.target.value) }} />
                        </div>
                    </div>
                    {initialRecord != null && EXERCISE_TYPE_LOGIC[initialRecord.exerciseTypeId].ShowsTranslationOnRevealedAnswer && (
                        <>
                            <div className="form-label-row">Translation</div>
                            <div className="form-row">
                                <div className="form-input-long">
                                    <textarea data-testid="translation" className="text-area-minimal" value={translation} onChange={(e) => { setTranslation(e.target.value) }} />
                                </div>
                            </div>
                        </>
                    )}
                    {initialRecord != null && EXERCISE_TYPE_LOGIC[initialRecord.exerciseTypeId].HasExtraOptions && (
                        <>
                            <div className="form-label-row">Extra Options</div>
                            <div className="form-row">
                                <div className="form-input-long">
                                    <textarea data-testid="extra-options" className="text-area-minimal" required={true} value={extraOptions} onChange={(e) => { setExtraOptions(e.target.value) }} />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-row">
                        <div className="form-input-row">
                            <input type="checkbox" data-testid="private" checked={propagateChanges} onChange={(e) => { setPropagateChanges(e.target.checked) }} />
                            <label className="content-line-part">Change everywhere</label>
                        </div>
                        <div className="form-content-row">Propagate to copies of this exercise</div>
                    </div>

                    <div className="form-row">
                        <div className="form-input-row">
                            <input type="checkbox" data-testid="private" checked={ownershipType == OWNERSHIP_TYPE.USER} onChange={(e) => { setOwnershipType(e.target.checked ? OWNERSHIP_TYPE.USER : OWNERSHIP_TYPE.PUBLIC) }} />
                            <label className="content-line-part">Private</label>
                        </div>
                        <div className="form-content-row">Make this lesson private, so only you can see it</div>
                    </div>

                    {initialRecord != null && initialRecord.exerciseObject != null
                        && initialRecord.exerciseObject.Alternatives != null
                        && initialRecord.exerciseObject.Alternatives.length > 0 && (
                            <>
                                <div className="form-row">
                                    <div className="form-label-row">Alternatives</div>
                                </div>
                                {
                                    initialRecord.exerciseObject.Alternatives.map((alternative) => {
                                        const setRef = (el: AlternativeHandle) => {
                                            if (el) {
                                                alternativeRefs.current.set(alternative, el);
                                            } else {
                                                alternativeRefs.current.delete(alternative);
                                            }
                                        };
                                        return (
                                            <AlternativeLine ref={setRef} key={alternative} alternative={alternative} />
                                        );
                                    })}
                            </>)}
                    <div className="buttons-container">
                        <div className="form-button-cell">
                            <button data-testid="back" className="form-button button-back" onClick={onBackClick}><ArrowBigLeft /> Back to Lesson</button>
                        </div>
                        <div className="form-button-cell">
                            <button data-testid="back-editor" className="form-button" onClick={onBackEditorClick}>Lesson Editor</button>
                        </div>
                        {corrections !== '' && (
                            <div className="form-button-cell">
                                <button data-testid="ai-check" className="form-button" onClick={onApplyAICorrections}>Apply AI corrections</button>
                            </div>
                        )}
                        {(explanation !== '' || corrections !== '') && (
                            <div className="form-button-cell">
                                <button data-testid="ai-check" className="form-button" onClick={onDismissAICorrections}>Dismiss AI corrections</button>
                            </div>
                        )}
                        {corrections === '' && (
                            <div className="form-button-cell">
                                <button data-testid="ai-check" className="form-button" onClick={onAICheckClick}>Check with AI</button>
                            </div>
                        )}
                        <div className="form-button-cell">
                            <button data-testid="save" type="submit" className="form-button" title="Save"><Save />&nbsp;Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}