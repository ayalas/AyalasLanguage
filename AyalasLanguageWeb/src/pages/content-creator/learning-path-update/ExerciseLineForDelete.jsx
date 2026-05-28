import { useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { AUTHOR_ACCESS } from '../../../constants/learning';

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
    return (
        <>
            {exists && (
                <div className="form-row">
                   
                    <div className="content-line-part">
                         {   exerciseInfo.access == AUTHOR_ACCESS.CAN_EDIT &&
                        (

                        <button type="button" className="form-button button-delete-exercise" onClick={onButtonClick} ><Trash2 className="small-icon" /></button>
                    )}
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