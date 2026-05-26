import { Fragment, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Eye, ListChecks, CircleDotDashed, RotateCcw, FilePenLine } from 'lucide-react';


import { FillInTheBlanksExercise  } from './exercise-types/FillInTheBlanksExercise';

export const Exercise = forwardRef(({ exerciseInfo, moveNext, childLoaded, saveProgress, restartLesson, learningPathId }, ref) => {
    
    const [error, setError] = useState("");
    const [displayAnswer, setDisplayAnswer] = useState(false);
    const refExercise = useRef(null);
    

    const toggleAnswer = function() {
        setDisplayAnswer(!displayAnswer);
    }

    const checkAnswer= function() {
        refExercise.current.checkAnswer();
    }

    // This defines what the parent can access via the ref
    useImperativeHandle(ref, () => ({
        setFocus() {
            refExercise.current.setFocus();
        }
    }));

    useEffect(() => {
        childLoaded(exerciseInfo.exerciseId);
    }, [exerciseInfo, childLoaded]);

    return (
        <Fragment key={`ex${exerciseInfo.exerciseId}row`}>
            <div className="form-row">
                <div className="form-button-cell">
                    <button type="button" onClick={checkAnswer} className="form-button" title="Check my answers"><ListChecks /></button>
                </div>
                <div className="form-button-cell">
                    <button type="button" onClick={toggleAnswer} className="form-button" title="Reveal answer"><Eye /></button>
                </div>
                <div className="form-button-cell">
                    <button type="button" onClick={saveProgress} className="form-button" title="Save progress"><CircleDotDashed /></button>
                </div>
                <div className="form-button-cell">
                    <button type="button" onClick={restartLesson} className="form-button" title="Restart lesson"><RotateCcw /></button>
                </div>
                <div className="form-button-cell">
                    <Link to={`/author/path/${learningPathId}`} className="link-button" title="Edit lesson"><FilePenLine /></Link>
                </div>
            </div>
            {error != "" && (
                <div className="form-row">
                    <label className="form-error">{error}</label>
                </div>
            )}
            <FillInTheBlanksExercise ref={refExercise} 
                exerciseInfo={exerciseInfo} setError={setError} 
                moveNext={moveNext} displayAnswer={displayAnswer} />
        </Fragment>
    );
});