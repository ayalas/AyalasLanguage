import { useState } from 'react';
import axios from 'axios';
import { SquarePen, Trash2 } from 'lucide-react';
import { AUTHOR_ACCESS } from '../../../constants/learning';

export function ExerciseLine({ exerciseInfo }: { exerciseInfo: any }) {
  const [error, setError] = useState('');
  const [exists, setExists] = useState(true);

  async function onDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await axios.delete(`/api/creator/exercise/${exerciseInfo.exerciseId}`);
      setExists(false);
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  }
  function onEditClick(e: React.MouseEvent) {
    e.preventDefault();

  }
  return (
    <>
      {exists && (
        <div className="form-row">
          <div className="content-line-part">
            {exerciseInfo.access == AUTHOR_ACCESS.CAN_EDIT && (
              <>
              <div className="form-button-cell">
              <button type="button" className="form-button button-delete-item" onClick={onDeleteClick}>
                <Trash2 className="small-icon" />
              </button>
              <button type="button" className="form-button button-edit-item" onClick={onEditClick}>
                <SquarePen className="small-icon" />
              </button>
               </div>
              </>
            )}
            {exerciseInfo.exerciseObject?.First}
          </div>
        </div>
      )}
      {error !== '' && (
        <div className="form-row">
          <label className="form-error">{error}</label>
        </div>
      )}
    </>
  );
}
