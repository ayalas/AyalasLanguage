import { useState } from 'react';
import axios from 'axios';
import { Trash } from 'lucide-react';
import { AUTHOR_ACCESS } from '../../constants/learning';

export function ExerciseLineForDelete({ exerciseInfo }) {
    const [error, setError] = useState("");
    const [exists, setExists] = useState(true);

    async function onButtonClick(e) {
        e.preventDefault();
        try {
            await axios.delete(`/api/creator/exercise/${exerciseInfo.exerciseId}`);
            setExists(false); //disappear from screen
        }
        catch (err) {
            setError(err.message);
        }
    }
    console.log(exerciseInfo);
    return (
        <>
            {exists && (
                <div className="form-row">
                    {   exerciseInfo.access == AUTHOR_ACCESS.CAN_EDIT &&
                        (
                    <div className="form-button-cell">
                        <button type="button" className="form-button" onClick={onButtonClick} ><Trash className="small-icon" /></button>
                    </div>
                    )}
                    <div className="form-content-row">
                        {exerciseInfo.exerciseObject.First}
                    </div>
                </div>
            )}
            {error != "" && (
                <div className="form-row">
                    <label className="form-error">{error}</label>
                </div>
            )}
        </>
    );
}