import { useState } from 'react';
import axios from 'axios';
import { SquarePen, Trash2 } from 'lucide-react';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import { useNavigate } from 'react-router-dom';
import type { ExtendedExerciseInfo } from '../../../types/Exercise';
import { errorHandler } from '@ayalaslanguage/types/error';

export function ExerciseLine({ exerciseInfo }: { exerciseInfo: ExtendedExerciseInfo }) {
  const [error, setError] = useState('');
  const [exists, setExists] = useState(true);
  const navigate = useNavigate();

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

    navigate(`/author/exercise/${exerciseInfo.exerciseId}`)
  }
  return (
    <>
      {exists && (
        <div className="form-row">
          <div className="content-line-part">
            {exerciseInfo.access == AUTHOR_ACCESS.CAN_EDIT && (
              <>
              <div className="form-button-cell">
              <button data-testid="delete-item" type="button" className="form-button button-delete-item" onClick={onDeleteClick}>
                <Trash2 className="small-icon" />
              </button>
              <button data-testid="edit-item" type="button" className="form-button button-edit-item" onClick={onEditClick}>
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
