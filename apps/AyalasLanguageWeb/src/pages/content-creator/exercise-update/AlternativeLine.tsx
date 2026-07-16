import { ArchiveRestore, Trash2 } from "lucide-react";
import { useImperativeHandle, useState } from "react";

export interface AlternativeHandle {
  exists: () => boolean;
}

export function AlternativeLine({ alternative, ref }: { alternative: string, ref: React.Ref<AlternativeHandle> }) {
    const [exists, setExists] = useState(true);

    function onDeleteClick(e: React.MouseEvent) {
        e.preventDefault();

        setExists(!exists);
    }

    useImperativeHandle(ref, () => ({
        exists() {
            return exists;
        }
    }));

    return (
        <div className="form-row">
            <div className="content-line-part">

                <div className="form-button-cell">
                    <button data-testid="delete-or-restore" type="button" className="form-button button-delete-item" 
                        title={exists? "Delete" : "Restore"}
                    onClick={onDeleteClick}>
                        {exists && (
                            <Trash2 className="small-icon" />
                        ) || (
                                <ArchiveRestore className="small-icon" />
                            )}
                    </button>
                    <label className={exists ? "form-label label-exists" : "form-label label-deleted"}>{alternative}</label>
                </div>
            </div>
        </div>
    );
}